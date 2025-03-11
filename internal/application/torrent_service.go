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