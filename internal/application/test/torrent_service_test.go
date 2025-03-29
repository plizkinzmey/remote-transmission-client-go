package test

import (
	"testing"
	"transmission-client-go/internal/application"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// Создаем мок TorrentRepository
type MockTorrentRepository struct {
	mock.Mock
}

func (m *MockTorrentRepository) GetAll() ([]domain.Torrent, error) {
	args := m.Called()
	return args.Get(0).([]domain.Torrent), args.Error(1)
}

func (m *MockTorrentRepository) Add(url string, downloadDir string) error {
	args := m.Called(url, downloadDir)
	return args.Error(0)
}

func (m *MockTorrentRepository) AddFile(filepath string, downloadDir string) error {
	args := m.Called(filepath, downloadDir)
	return args.Error(0)
}

func (m *MockTorrentRepository) Remove(id int64, deleteData bool) error {
	args := m.Called(id, deleteData)
	return args.Error(0)
}

func (m *MockTorrentRepository) Start(ids []int64) error {
	args := m.Called(ids)
	return args.Error(0)
}

func (m *MockTorrentRepository) Stop(ids []int64) error {
	args := m.Called(ids)
	return args.Error(0)
}

func (m *MockTorrentRepository) GetSessionStats() (*domain.SessionStats, error) {
	args := m.Called()
	return args.Get(0).(*domain.SessionStats), args.Error(1)
}

func (m *MockTorrentRepository) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	args := m.Called(id)
	return args.Get(0).([]domain.TorrentFile), args.Error(1)
}

func (m *MockTorrentRepository) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	args := m.Called(id, fileIds, wanted)
	return args.Error(0)
}

func (m *MockTorrentRepository) VerifyTorrent(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTorrentRepository) SetTorrentSpeedLimit(ids []int64, downloadLimit int64, uploadLimit int64) error {
	args := m.Called(ids, downloadLimit, uploadLimit)
	return args.Error(0)
}

func (m *MockTorrentRepository) GetDefaultDownloadDir() (string, error) {
	args := m.Called()
	return args.String(0), args.Error(1)
}

// Тесты для TorrentService
func TestGetAllTorrents(t *testing.T) {
	mockRepo := new(MockTorrentRepository)
	service := application.NewTorrentService(mockRepo)

	// Настраиваем ожидаемое поведение мока
	expectedTorrents := []domain.Torrent{
		{ID: 1, Name: "Test torrent 1", Status: domain.StatusDownloading},
		{ID: 2, Name: "Test torrent 2", Status: domain.StatusSeeding},
	}

	mockRepo.On("GetAll").Return(expectedTorrents, nil)

	// Вызываем тестируемый метод
	torrents, err := service.GetAllTorrents()

	// Проверяем результаты
	assert.NoError(t, err)
	assert.Equal(t, expectedTorrents, torrents)
	mockRepo.AssertExpectations(t)
}

func TestAddTorrent(t *testing.T) {
	mockRepo := new(MockTorrentRepository)
	service := application.NewTorrentService(mockRepo)

	url := "http://example.com/torrent.torrent"
	downloadDir := "/downloads"

	mockRepo.On("Add", url, downloadDir).Return(nil)

	err := service.AddTorrent(url, downloadDir)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

// Другие тесты для сервиса будут добавлены здесь
