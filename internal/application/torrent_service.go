package application

import (
	"errors"
	"fmt"
	"path/filepath"
	"slices"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
	"transmission-client-go/internal/infrastructure/transmission"
)

const (
	DefaultSpeedLimit  = 10 // 10 KB/s
	ErrConfigNotInited = "config is not initialized"
)

type TorrentService struct {
	repo   domain.TorrentRepository
	config *domain.Config
}

func NewTorrentService(repo domain.TorrentRepository) *TorrentService {
	return &TorrentService{
		repo: repo,
	}
}

// UpdateConfig обновляет конфигурацию сервиса
func (s *TorrentService) UpdateConfig(config *domain.Config) {
	s.config = config
}

func (s *TorrentService) GetAllTorrents() ([]domain.Torrent, error) {
	torrents, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}

	// Проверяем каждый торрент на превышение максимального рейтинга
	if s.config != nil && s.config.MaxUploadRatio > 0 {
		var torrentsToStop []int64
		for _, t := range torrents {
			if t.Status == domain.StatusSeeding && t.UploadRatio >= s.config.MaxUploadRatio {
				torrentsToStop = append(torrentsToStop, t.ID)
			}
		}
		// Если есть торренты для остановки, останавливаем их
		if len(torrentsToStop) > 0 {
			_ = s.repo.Stop(torrentsToStop)
		}
	}

	return torrents, nil
}

// GetDefaultDownloadDir возвращает директорию загрузки по умолчанию
func (s *TorrentService) GetDefaultDownloadDir() (string, error) {
	// Проверяем, есть ли сохраненный путь в конфигурации
	if s.config != nil && s.config.DefaultDownloadPath != "" {
		return s.config.DefaultDownloadPath, nil
	}

	// Если нет, получаем из Transmission и сохраняем
	path, err := s.repo.GetDefaultDownloadDir() // Используем метод интерфейса
	if err != nil {
		return "", err
	}

	// Сохраняем путь в конфигурации
	if s.config != nil {
		s.config.DefaultDownloadPath = path
		// Игнорируем ошибку сохранения, так как это некритично
	}

	return path, nil
}

// SetDefaultDownloadPath устанавливает указанный путь как путь по умолчанию
func (s *TorrentService) SetDefaultDownloadPath(path string) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	if path == "" {
		return fmt.Errorf("path cannot be empty")
	}

	// Проверяем существование и доступность пути
	if err := s.ValidateDownloadPath(path); err != nil {
		return fmt.Errorf("invalid download path: %w", err)
	}

	// Устанавливаем путь по умолчанию
	s.config.DefaultDownloadPath = path

	// Также добавляем путь в историю, если его там нет
	_ = s.SaveDownloadPath(path)

	// Сохраняем конфигурацию
	configService := infrastructure.NewConfigService()
	return configService.SaveConfig(s.config)
}

// GetTorrents возвращает все торренты
func (s *TorrentService) GetTorrents() ([]domain.Torrent, error) {
	return s.repo.GetAll()
}

// SaveDownloadPath сохраняет путь загрузки в историю
func (s *TorrentService) SaveDownloadPath(path string) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	// Проверяем, что путь не пустой
	if path == "" {
		return nil
	}

	// Создаем список путей, если его еще нет
	if s.config.DownloadPaths == nil {
		s.config.DownloadPaths = []string{}
	}

	// Проверяем, есть ли уже такой путь в списке
	if slices.Contains(s.config.DownloadPaths, path) {
		return nil
	}

	// Добавляем новый путь в начало списка
	s.config.DownloadPaths = append([]string{path}, s.config.DownloadPaths...)

	// Ограничиваем длину списка до 10 элементов
	if len(s.config.DownloadPaths) > 10 {
		s.config.DownloadPaths = s.config.DownloadPaths[:10]
	}

	// Сохраняем конфигурацию
	configService := infrastructure.NewConfigService()
	return configService.SaveConfig(s.config)
}

// fetchDefaultPathIfEmpty пытается получить путь по умолчанию, если он не установлен
func (s *TorrentService) fetchDefaultPathIfEmpty() string {
	if s.config.DefaultDownloadPath == "" {
		defaultPath, err := s.GetDefaultDownloadDir()
		if err == nil && defaultPath != "" {
			return defaultPath
		}
	}
	return s.config.DefaultDownloadPath
}

// fetchPathFromClient пытается получить путь напрямую из клиента Transmission
func (s *TorrentService) fetchPathFromClient() string {
	// Пытаемся получить путь из репозитория
	path, err := s.repo.GetDefaultDownloadDir() // Используем метод интерфейса
	if err != nil || path == "" {
		return ""
	}

	// Сохраняем для последующего использования
	s.config.DefaultDownloadPath = path
	configService := infrastructure.NewConfigService()
	_ = configService.SaveConfig(s.config)

	return path
}

// addUniquePathsFromHistory добавляет уникальные пути из истории в результат
func (s *TorrentService) addUniquePathsFromHistory(result []string) []string {
	if s.config.DownloadPaths == nil {
		return result
	}

	for _, path := range s.config.DownloadPaths {
		if !slices.Contains(result, path) {
			result = append(result, path)
		}
	}

	return result
}

// GetDownloadPaths возвращает список сохраненных путей загрузки
func (s *TorrentService) GetDownloadPaths() ([]string, error) {
	if s.config == nil {
		return nil, errors.New(ErrConfigNotInited)
	}

	// Создаем результирующий список
	var result []string

	// Добавляем путь по умолчанию, если он есть
	defaultPath := s.fetchDefaultPathIfEmpty()
	if defaultPath != "" {
		result = append(result, defaultPath)
	}

	// Добавляем уникальные пути из истории
	result = s.addUniquePathsFromHistory(result)

	// Если после всех попыток список путей всё ещё пуст,
	// пытаемся получить путь напрямую из клиента
	if len(result) == 0 {
		path := s.fetchPathFromClient()
		if path != "" {
			result = append(result, path)
		}
	}

	return result, nil
}

func (s *TorrentService) AddTorrent(url string, downloadDir string) error {
	// Проверяем путь перед добавлением торрента
	if err := s.ValidateDownloadPath(downloadDir); err != nil {
		return fmt.Errorf("invalid download path: %w", err)
	}

	// Если указана директория загрузки, сохраняем ее в историю
	if downloadDir != "" {
		_ = s.SaveDownloadPath(downloadDir)
	}

	// Используем метод Add из интерфейса repo
	return s.repo.Add(url, downloadDir)
}

func (s *TorrentService) AddTorrentFile(filepath string, downloadDir string) error {
	// Проверяем путь перед добавлением торрента
	if err := s.ValidateDownloadPath(downloadDir); err != nil {
		return fmt.Errorf("invalid download path: %w", err)
	}

	// Если указана директория загрузки, сохраняем ее в историю
	if downloadDir != "" {
		_ = s.SaveDownloadPath(downloadDir)
	}

	// Используем метод AddFile из интерфейса repo
	return s.repo.AddFile(filepath, downloadDir)
}

func (s *TorrentService) RemoveTorrent(id int64, deleteData bool) error {
	return s.repo.Remove(id, deleteData)
}

func (s *TorrentService) StartTorrents(ids []int64) error {
	return s.repo.Start(ids)
}

func (s *TorrentService) StopTorrents(ids []int64) error {
	return s.repo.Stop(ids)
}

func (s *TorrentService) GetSessionStats() (*domain.SessionStats, error) {
	return s.repo.GetSessionStats()
}

// Новые методы для работы с файлами
func (s *TorrentService) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	return s.repo.GetTorrentFiles(id)
}

func (s *TorrentService) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	return s.repo.SetFilesWanted(id, fileIds, wanted)
}

// convertSpeedToKBps конвертирует скорость из указанных единиц в КБ/с
func convertSpeedToKBps(speed int, unit string) int64 {
	switch unit {
	case "MiB/s":
		return int64(speed) * 1024 // Конвертируем MiB/s в KiB/s
	default:
		return int64(speed) // Значение уже в KiB/s
	}
}

// SetTorrentSpeedLimit устанавливает ограничение скорости для указанных торрентов
func (s *TorrentService) SetTorrentSpeedLimit(ids []int64, isSlowMode bool) error {
	var downloadLimit, uploadLimit int64
	if isSlowMode {
		if s.config != nil && s.config.SlowSpeedLimit > 0 {
			// Используем значение из конфигурации
			limit := convertSpeedToKBps(s.config.SlowSpeedLimit, s.config.SlowSpeedUnit)
			downloadLimit = limit
			uploadLimit = limit
		} else {
			// Значение по умолчанию: 10 КБит/с
			downloadLimit = 10
			uploadLimit = 10
		}
	}
	return s.repo.SetTorrentSpeedLimit(ids, downloadLimit, uploadLimit)
}

// RemoveDownloadPath удаляет путь из истории путей скачивания
func (s *TorrentService) RemoveDownloadPath(path string) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	// Проверяем, что путь не является путем по умолчанию
	if path == s.config.DefaultDownloadPath {
		return fmt.Errorf("cannot remove default download path")
	}

	// Получаем индекс пути в списке
	idx := slices.Index(s.config.DownloadPaths, path)
	if idx == -1 {
		return nil // путь не найден в списке
	}

	// Удаляем путь из списка, используя slices.Delete
	s.config.DownloadPaths = slices.Delete(s.config.DownloadPaths, idx, idx+1)

	// Сохраняем конфигурацию
	configService := infrastructure.NewConfigService()
	return configService.SaveConfig(s.config)
}

// ValidateDownloadPath проверяет существование и доступность пути для скачивания
func (s *TorrentService) ValidateDownloadPath(path string) error {
	// Проверяем, что путь не пустой
	if path == "" {
		return fmt.Errorf("download path cannot be empty")
	}

	// Получаем абсолютный путь
	absPath, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("invalid path format: %w", err)
	}

	// Проверяем путь через репозиторий
	return s.repo.ValidateDownloadPath(absPath) // Используем метод интерфейса
}

// VerifyTorrent запускает процесс проверки целостности данных торрента
func (s *TorrentService) VerifyTorrent(id int64) error {
	return s.repo.VerifyTorrent(id)
}

// ValidatePathsTransaction проверяет корректность транзакции изменения путей
func (s *TorrentService) ValidatePathsTransaction(transaction *domain.PathsTransaction) error {
	if transaction == nil {
		return errors.New("transaction cannot be nil")
	}

	// Проверяем все новые пути
	for _, path := range transaction.PathsToAdd {
		if err := s.ValidateDownloadPath(path); err != nil {
			return fmt.Errorf("invalid path %s: %w", path, err)
		}
	}

	// Проверяем путь по умолчанию
	if transaction.DefaultPath != "" {
		if err := s.ValidateDownloadPath(transaction.DefaultPath); err != nil {
			return fmt.Errorf("invalid default path %s: %w", transaction.DefaultPath, err)
		}
	}

	// Проверяем на дубликаты между добавляемыми путями
	pathMap := make(map[string]bool)
	for _, path := range transaction.PathsToAdd {
		if pathMap[path] {
			return fmt.Errorf("duplicate path in transaction: %s", path)
		}
		pathMap[path] = true
	}

	// Проверяем конфликты между операциями
	for _, pathToAdd := range transaction.PathsToAdd {
		for _, pathToRemove := range transaction.PathsToRemove {
			if pathToAdd == pathToRemove {
				return fmt.Errorf("conflict: path %s is both added and removed", pathToAdd)
			}
		}
	}

	return nil
}

// ApplyPathsTransaction применяет изменения путей с поддержкой отката
func (s *TorrentService) ApplyPathsTransaction(transaction *domain.PathsTransaction) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	// Сохраняем текущее состояние для возможного отката
	transaction.OriginalState = s.config.GetPathsState()

	// Валидируем транзакцию
	if err := s.ValidatePathsTransaction(transaction); err != nil {
		return fmt.Errorf("validation failed: %w", err)
	}

	// Применяем транзакцию
	s.config.ApplyPathsTransaction(transaction)

	// Сохраняем конфигурацию
	configService := infrastructure.NewConfigService()
	if err := configService.SaveConfig(s.config); err != nil {
		// В случае ошибки выполняем откат
		s.config.RollbackPathsTransaction(transaction)
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

// SavePaths сохраняет изменения путей атомарно
func (s *TorrentService) SavePaths(pathsToAdd, pathsToRemove []string, defaultPath string) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	// Сохраняем оригинальный список путей
	originalPaths := make([]string, len(s.config.DownloadPaths))
	copy(originalPaths, s.config.DownloadPaths)

	// Удаляем пути, которые нужно удалить
	var filteredPaths []string
	for _, path := range originalPaths {
		shouldKeep := true
		for _, pathToRemove := range pathsToRemove {
			if path == pathToRemove {
				shouldKeep = false
				break
			}
		}
		if shouldKeep {
			filteredPaths = append(filteredPaths, path)
		}
	}

	// Добавляем новые пути в начало списка (чтобы сохранить консистентность с методом SaveDownloadPath)
	for _, pathToAdd := range pathsToAdd {
		// Проверяем, нет ли уже такого пути
		exists := false
		for _, existingPath := range filteredPaths {
			if existingPath == pathToAdd {
				exists = true
				break
			}
		}
		if !exists {
			// Добавляем новый путь в начало списка
			filteredPaths = append([]string{pathToAdd}, filteredPaths...)
		}
	}

	// Обновляем конфигурацию
	s.config.DownloadPaths = filteredPaths
	if defaultPath != "" {
		s.config.DefaultDownloadPath = defaultPath
		// Добавляем путь по умолчанию в историю, если его там нет
		exists := false
		for _, path := range s.config.DownloadPaths {
			if path == defaultPath {
				exists = true
				break
			}
		}
		if !exists {
			s.config.DownloadPaths = append([]string{defaultPath}, s.config.DownloadPaths...)
		}
	}

	// Ограничиваем длину списка до 10 элементов
	if len(s.config.DownloadPaths) > 10 {
		s.config.DownloadPaths = s.config.DownloadPaths[:10]
	}

	// Сохраняем изменения
	configService := infrastructure.NewConfigService()
	if err := configService.SaveConfig(s.config); err != nil {
		// В случае ошибки восстанавливаем оригинальное состояние
		s.config.DownloadPaths = originalPaths
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

// GetPathsState возвращает текущее состояние путей
func (s *TorrentService) GetPathsState() (*domain.PathsState, error) {
	if s.config == nil {
		return nil, errors.New(ErrConfigNotInited)
	}
	return s.config.GetPathsState(), nil
}

// SaveSettingsWithPaths сохраняет настройки соединения и изменения путей в одной транзакции
func (s *TorrentService) SaveSettingsWithPaths(connectionConfig domain.ConnectionConfig, pathsToAdd []string, pathsToRemove []string, defaultPath string) error {
	if s.config == nil {
		return errors.New(ErrConfigNotInited)
	}

	// Сохраняем оригинальный список путей и настройки для возможного отката
	originalPaths := make([]string, len(s.config.DownloadPaths))
	copy(originalPaths, s.config.DownloadPaths)
	originalDefaultPath := s.config.DefaultDownloadPath
	originalHost := s.config.Host
	originalPort := s.config.Port
	originalUsername := s.config.Username
	originalPassword := s.config.Password

	// Обновляем настройки соединения
	s.config.Host = connectionConfig.Host
	s.config.Port = connectionConfig.Port
	s.config.Username = connectionConfig.Username
	s.config.Password = connectionConfig.Password
	s.config.MaxUploadRatio = connectionConfig.MaxUploadRatio
	s.config.SlowSpeedLimit = connectionConfig.SlowSpeedLimit
	s.config.SlowSpeedUnit = connectionConfig.SlowSpeedUnit

	// Применяем изменения путей

	// 1. Удаляем пути, которые нужно удалить
	var filteredPaths []string
	for _, path := range s.config.DownloadPaths {
		shouldKeep := true
		for _, pathToRemove := range pathsToRemove {
			if path == pathToRemove {
				shouldKeep = false
				break
			}
		}
		if shouldKeep {
			filteredPaths = append(filteredPaths, path)
		}
	}

	// 2. Добавляем новые пути в начало списка
	for _, pathToAdd := range pathsToAdd {
		exists := false
		for _, existingPath := range filteredPaths {
			if existingPath == pathToAdd {
				exists = true
				break
			}
		}
		if !exists {
			filteredPaths = append([]string{pathToAdd}, filteredPaths...)
		}
	}

	// Обновляем список путей
	s.config.DownloadPaths = filteredPaths

	// 3. Устанавливаем путь по умолчанию, если он указан
	if defaultPath != "" {
		s.config.DefaultDownloadPath = defaultPath

		// Добавляем путь по умолчанию в начало списка, если его там нет
		exists := false
		for _, path := range s.config.DownloadPaths {
			if path == defaultPath {
				exists = true
				break
			}
		}
		if !exists {
			s.config.DownloadPaths = append([]string{defaultPath}, s.config.DownloadPaths...)
		}
	}

	// 4. Ограничиваем длину списка до 10 элементов
	if len(s.config.DownloadPaths) > 10 {
		s.config.DownloadPaths = s.config.DownloadPaths[:10]
	}

	// Проверяем, изменились ли настройки соединения
	connectionChanged := s.config.Host != originalHost ||
		s.config.Port != originalPort ||
		s.config.Username != originalUsername ||
		s.config.Password != originalPassword

	// Проверяем, изменились ли настройки соединения (дублирование удалено)
	// Переменная connectionChanged уже объявлена выше

	// Сохраняем конфигурацию одной операцией
	configService := infrastructure.NewConfigService()
	if err := configService.SaveConfig(s.config); err != nil {
		// В случае ошибки восстанавливаем оригинальное состояние
		s.config.DownloadPaths = originalPaths
		s.config.DefaultDownloadPath = originalDefaultPath
		s.config.Host = originalHost
		s.config.Port = originalPort
		s.config.Username = originalUsername
		s.config.Password = originalPassword
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Если изменились настройки соединения, обновляем клиент Transmission
	if connectionChanged {
		client, err := transmission.NewTransmissionClient(transmission.TransmissionConfig{
			Host:     s.config.Host,
			Port:     s.config.Port,
			Username: s.config.Username,
			Password: s.config.Password,
		})
		if err != nil {
			return fmt.Errorf("failed to initialize transmission client: %w", err)
		}

		// Обновляем репозиторий в сервисе
		s.repo = client
	}

	return nil
}

// GetTorrentDownloadDirectory возвращает директорию, в которой находится/скачивается торрент
func (s *TorrentService) GetTorrentDownloadDirectory(id int64) (string, error) {
	return s.repo.GetTorrentDownloadDirectory(id)
}
