package application

import (
	"transmission-client-go/internal/domain"
)

type TorrentService struct {
	repo domain.TorrentRepository
}

func NewTorrentService(repo domain.TorrentRepository) *TorrentService {
	return &TorrentService{
		repo: repo,
	}
}

func (s *TorrentService) GetAllTorrents() ([]domain.Torrent, error) {
	return s.repo.GetAll()
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
