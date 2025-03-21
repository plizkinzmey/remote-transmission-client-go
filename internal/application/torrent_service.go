package application

import (
	"transmission-client-go/internal/domain"
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

func (s *TorrentService) AddTorrent(url string) error {
	return s.repo.Add(url)
}

func (s *TorrentService) AddTorrentFile(filepath string) error {
	return s.repo.AddFile(filepath)
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
