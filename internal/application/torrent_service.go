package application

import (
	"fmt"
	"slices"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
)

const (
	DefaultSpeedLimit = 10 // 10 KB/s
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
	client, ok := s.repo.(*infrastructure.TransmissionClient)
	if !ok {
		return "", fmt.Errorf("repository does not support getting default download directory")
	}

	path, err := client.GetDefaultDownloadDir()
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

// SaveDownloadPath сохраняет путь загрузки в историю
func (s *TorrentService) SaveDownloadPath(path string) error {
	if s.config == nil {
		return fmt.Errorf("config is not initialized")
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
	client, ok := s.repo.(*infrastructure.TransmissionClient)
	if !ok {
		return ""
	}

	path, err := client.GetDefaultDownloadDir()
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
		return nil, fmt.Errorf("config is not initialized")
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
	// Если указана директория загрузки, сохраняем ее в историю
	if downloadDir != "" {
		_ = s.SaveDownloadPath(downloadDir)
	}

	client, ok := s.repo.(*infrastructure.TransmissionClient)
	if !ok {
		return fmt.Errorf("repository does not support setting download directory")
	}

	return client.Add(url, downloadDir)
}

func (s *TorrentService) AddTorrentFile(filepath string, downloadDir string) error {
	// Если указана директория загрузки, сохраняем ее в историю
	if downloadDir != "" {
		_ = s.SaveDownloadPath(downloadDir)
	}

	client, ok := s.repo.(*infrastructure.TransmissionClient)
	if !ok {
		return fmt.Errorf("repository does not support setting download directory")
	}

	return client.AddFile(filepath, downloadDir)
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
