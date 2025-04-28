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

// Определяем тип функции для создания ConfigService
type configServiceFactory func() infrastructure.IConfigService

// Переменная для хранения фабрики ConfigService, по умолчанию используем реальную
var configServiceFactoryImpl configServiceFactory = func() infrastructure.IConfigService {
	return infrastructure.NewConfigService()
}

// Определяем тип функции для создания TransmissionClient
type transmissionClientFactory func(config transmission.TransmissionConfig) (domain.TorrentRepository, error)

// Переменная для хранения фабрики TransmissionClient, по умолчанию используем реальную
var transmissionClientFactoryImpl transmissionClientFactory = func(config transmission.TransmissionConfig) (domain.TorrentRepository, error) {
	return transmission.NewTransmissionClient(config)
}

const (
	DefaultSpeedLimit = 10 // 10 KB/s
	maxDownloadPaths  = 10
)

// Определяем ошибки как переменные для возможности использования errors.Is
var (
	ErrConfigNotInited = errors.New("config is not initialized")
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
		return ErrConfigNotInited
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
	configService := configServiceFactoryImpl()
	return configService.SaveConfig(s.config)
}

// GetTorrents возвращает все торренты
func (s *TorrentService) GetTorrents() ([]domain.Torrent, error) {
	return s.repo.GetAll()
}

// SaveDownloadPath сохраняет путь загрузки в историю
func (s *TorrentService) SaveDownloadPath(path string) error {
	if s.config == nil {
		return ErrConfigNotInited
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
	configService := configServiceFactoryImpl()
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

// addUniquePathsFromHistory добавляет уникальные пути из истории, исключая текущий путь по умолчанию
func (s *TorrentService) addUniquePathsFromHistory(mergedPaths []string) []string {
	if s.config == nil {
		return mergedPaths
	}

	uniquePathsMap := make(map[string]bool)
	for _, p := range mergedPaths {
		uniquePathsMap[p] = true
	}

	// Добавляем пути из истории, если их еще нет и они не равны текущему DefaultDownloadPath
	for _, historyPath := range s.config.DownloadPaths {
		// Пропускаем путь, если он уже есть в mergedPaths или если он равен текущему DefaultDownloadPath
		if _, exists := uniquePathsMap[historyPath]; !exists && historyPath != s.config.DefaultDownloadPath {
			mergedPaths = append(mergedPaths, historyPath)
			uniquePathsMap[historyPath] = true // Добавляем в карту, чтобы избежать дубликатов из самой истории
		}
	}
	return mergedPaths
}

// GetDownloadPaths возвращает список сохраненных путей загрузки
func (s *TorrentService) GetDownloadPaths() ([]string, error) {
	if s.config == nil {
		return nil, ErrConfigNotInited
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

// SetTorrentSpeedLimit устанавливает ограничение скорости для указанных торрентов
func (s *TorrentService) SetTorrentSpeedLimit(ids []int64, isSlowMode bool) error {
	var downloadLimit, uploadLimit int64
	if isSlowMode {
		if s.config != nil && s.config.SlowSpeedLimit > 0 {
			// Используем функцию из пакета transmission вместо локально определенной
			limit := transmission.ConvertSpeedToKiBps(s.config.SlowSpeedLimit, s.config.SlowSpeedUnit)
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
		return ErrConfigNotInited
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
	configService := configServiceFactoryImpl()
	return configService.SaveConfig(s.config)
}

// ValidateDownloadPath проверяет существование и доступность пути для скачивания
func (s *TorrentService) ValidateDownloadPath(path string) error {
	// Добавляем проверку на nil config в начало
	if s.config == nil {
		return ErrConfigNotInited
	}
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
		return ErrConfigNotInited
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
	configService := configServiceFactoryImpl()
	if err := configService.SaveConfig(s.config); err != nil {
		// В случае ошибки выполняем откат
		s.config.RollbackPathsTransaction(transaction)
		return fmt.Errorf("failed to save config: %w", err)
	}

	return nil
}

// pathsToPathMap преобразует список путей в карту для быстрого поиска
func pathsToPathMap(paths []string) map[string]bool {
	result := make(map[string]bool)
	for _, path := range paths {
		if path != "" {
			result[path] = true
		}
	}
	return result
}

// addNewPaths добавляет новые пути в список результатов с проверкой дубликатов
func (s *TorrentService) addNewPaths(result []string, pathsToAdd []string, skipPaths map[string]bool, seenPaths map[string]bool) []string {
	for _, path := range pathsToAdd {
		if path != "" && !seenPaths[path] && !skipPaths[path] {
			result = append(result, path)
			seenPaths[path] = true
		}
	}
	return result
}

// ensureDefaultPathExists добавляет путь по умолчанию в список, если он задан и отсутствует в списке
func (s *TorrentService) ensureDefaultPathExists(result []string, defaultPath string, seenPaths map[string]bool) []string {
	if defaultPath != "" && !seenPaths[defaultPath] {
		result = append(result, defaultPath)
		seenPaths[defaultPath] = true
	}
	return result
}

// addExistingPaths добавляет существующие пути из конфигурации с проверкой дубликатов
func (s *TorrentService) addExistingPaths(result []string, skipPaths map[string]bool, seenPaths map[string]bool) []string {
	if s.config == nil || s.config.DownloadPaths == nil {
		return result
	}

	for _, path := range s.config.DownloadPaths {
		if path != "" && !seenPaths[path] && !skipPaths[path] {
			result = append(result, path)
			seenPaths[path] = true
		}
	}
	return result
}

// limitPathsListSize ограничивает размер списка путей максимальным значением
func (s *TorrentService) limitPathsListSize(paths []string, maxSize int) []string {
	if len(paths) > maxSize {
		return paths[:maxSize]
	}
	return paths
}

// createUpdatedPathsList создает обновленный список путей загрузки, обрабатывая следующие случаи:
// - Добавляет новые пути в начало списка (pathsToAdd)
// - Удаляет указанные пути (pathsToRemove)
// - Гарантирует присутствие defaultPath в списке
// - Удаляет дубликаты, сохраняя порядок
// - Ограничивает размер списка до maxDownloadPaths элементов
func (s *TorrentService) createUpdatedPathsList(pathsToAdd, pathsToRemove []string, defaultPath string) []string {
	// Инициализируем пустой результирующий слайс
	result := make([]string, 0)

	// Создаем карты для отслеживания путей
	removePaths := pathsToPathMap(pathsToRemove)
	seenPaths := make(map[string]bool)

	// Добавляем пути в определенном порядке
	result = s.addNewPaths(result, pathsToAdd, removePaths, seenPaths)
	result = s.ensureDefaultPathExists(result, defaultPath, seenPaths)
	result = s.addExistingPaths(result, removePaths, seenPaths)
	result = s.limitPathsListSize(result, maxDownloadPaths)

	return result
}

// updateDefaultPath обновляет путь по умолчанию и гарантирует, что он существует в списке путей
//
// Поведение функции:
//  1. Если defaultPath не пустой - использует его как новый путь по умолчанию
//     и гарантирует наличие этого пути в списке
//  2. Если defaultPath пустой - проверяет наличие текущего пути по умолчанию:
//     - Если текущий путь есть в списке - оставляет его без изменений
//     - Если текущего пути нет в списке - берет первый путь из списка или устанавливает пустую строку, если список пуст
//
// Возвращает обновленный список путей и путь по умолчанию
func (s *TorrentService) updateDefaultPath(pathsList []string, defaultPath string) ([]string, string) {
	updatedPathsList := pathsList
	updatedDefaultPath := s.config.DefaultDownloadPath

	if defaultPath != "" {
		// Если указан новый путь по умолчанию, используем его
		updatedDefaultPath = defaultPath

		// Проверяем, что путь по умолчанию присутствует в списке путей
		pathExists := false
		for _, path := range updatedPathsList {
			if path == defaultPath {
				pathExists = true
				break
			}
		}

		// Если путь по умолчанию отсутствует в списке, добавляем его в начало
		if !pathExists {
			updatedPathsList = append([]string{defaultPath}, updatedPathsList...)

			// Ограничиваем список максимальной длиной
			if len(updatedPathsList) > maxDownloadPaths {
				updatedPathsList = updatedPathsList[:maxDownloadPaths]
			}
		}
	} else {
		// Поведение при пустом defaultPath: проверяем актуальность текущего значения
		// и при необходимости обновляем его на основе доступных путей
		currentPathExists := false
		for _, path := range updatedPathsList {
			if path == updatedDefaultPath {
				currentPathExists = true
				break
			}
		}

		// Если текущий путь по умолчанию отсутствует в списке, обновляем его
		if !currentPathExists {
			if len(updatedPathsList) > 0 {
				// Берем первый доступный путь как новый путь по умолчанию
				updatedDefaultPath = updatedPathsList[0]
			} else {
				// Если список пуст, сбрасываем путь по умолчанию
				updatedDefaultPath = ""
			}
		}
	}

	return updatedPathsList, updatedDefaultPath
}

// saveConfigAndHandleErrors сохраняет конфигурацию и обрабатывает ошибки с откатом изменений при необходимости
func (s *TorrentService) saveConfigAndHandleErrors(originalPaths []string, originalDefaultPath string) error {
	configService := configServiceFactoryImpl()
	if err := configService.SaveConfig(s.config); err != nil {
		// Откатываем изменения в конфигурации при ошибке сохранения
		s.config.DownloadPaths = originalPaths
		s.config.DefaultDownloadPath = originalDefaultPath
		return fmt.Errorf("failed to save config: %w", err)
	}
	return nil
}

// SavePaths сохраняет изменения в списке путей загрузки и пути по умолчанию
func (s *TorrentService) SavePaths(pathsToAdd []string, pathsToRemove []string, defaultPath string) error {
	if s.config == nil {
		return ErrConfigNotInited
	}

	// Сохраняем текущее состояние для возможного отката
	originalPaths := append([]string{}, s.config.DownloadPaths...)
	originalDefaultPath := s.config.DefaultDownloadPath

	// Создаем обновленный список путей
	updatedPaths := s.createUpdatedPathsList(pathsToAdd, pathsToRemove, defaultPath)

	// Обновляем список путей в конфигурации
	s.config.DownloadPaths = updatedPaths

	// Обновляем путь по умолчанию и обеспечиваем его наличие в списке
	s.config.DownloadPaths, s.config.DefaultDownloadPath = s.updateDefaultPath(s.config.DownloadPaths, defaultPath)

	// Сохраняем конфигурацию и обрабатываем возможные ошибки
	return s.saveConfigAndHandleErrors(originalPaths, originalDefaultPath)
}

// validatePaths проверяет корректность путей перед применением изменений
func (s *TorrentService) validatePaths(pathsToAdd []string, defaultPath string) error {
	// Проверяем все новые пути
	for _, path := range pathsToAdd {
		if err := s.ValidateDownloadPath(path); err != nil {
			return fmt.Errorf("failed to save paths: invalid path %s: %w", path, err)
		}
	}

	// Проверяем путь по умолчанию, если он указан и не пуст
	if defaultPath != "" {
		if err := s.ValidateDownloadPath(defaultPath); err != nil {
			return fmt.Errorf("failed to save paths: invalid default path %s: %w", defaultPath, err)
		}
	}

	return nil
}

// SaveSettingsWithPaths сохраняет настройки соединения и изменения путей в одной транзакции
func (s *TorrentService) SaveSettingsWithPaths(connectionConfig domain.ConnectionConfig, pathsToAdd []string, pathsToRemove []string, defaultPath string) error {
	if s.config == nil {
		return ErrConfigNotInited
	}

	// Валидация путей перед продолжением
	if err := s.validatePaths(pathsToAdd, defaultPath); err != nil {
		return err
	}

	// Сохраняем оригинальный список путей и настройки для возможного отката
	originalPaths := append([]string{}, s.config.DownloadPaths...)
	originalDefaultPath := s.config.DefaultDownloadPath
	originalHost := s.config.Host
	originalPort := s.config.Port
	originalUsername := s.config.Username
	originalPassword := s.config.Password
	originalMaxUploadRatio := s.config.MaxUploadRatio
	originalSlowSpeedLimit := s.config.SlowSpeedLimit
	originalSlowSpeedUnit := s.config.SlowSpeedUnit

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

	// Сохраняем конфигурацию одной операцией
	configService := configServiceFactoryImpl()
	if err := configService.SaveConfig(s.config); err != nil {
		// В случае ошибки восстанавливаем оригинальное состояние
		s.config.DownloadPaths = originalPaths
		s.config.DefaultDownloadPath = originalDefaultPath
		s.config.Host = originalHost
		s.config.Port = originalPort
		s.config.Username = originalUsername
		s.config.Password = originalPassword
		s.config.MaxUploadRatio = originalMaxUploadRatio
		s.config.SlowSpeedLimit = originalSlowSpeedLimit
		s.config.SlowSpeedUnit = originalSlowSpeedUnit
		// Оборачиваем ошибку сохранения для ясности
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Если изменились настройки соединения, обновляем клиент Transmission
	if connectionChanged {
		client, err := transmissionClientFactoryImpl(transmission.TransmissionConfig{
			Host:     s.config.Host,
			Port:     s.config.Port,
			Username: s.config.Username,
			Password: s.config.Password,
		})
		if err != nil {
			return fmt.Errorf("failed to initialize transmission client after saving config: %w", err)
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

// GetPathsState возвращает текущее состояние путей загрузки
func (s *TorrentService) GetPathsState() (*domain.PathsState, error) {
	if s.config == nil {
		return nil, ErrConfigNotInited
	}
	return s.config.GetPathsState(), nil
}
