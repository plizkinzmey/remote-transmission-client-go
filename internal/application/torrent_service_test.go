package application

import (
	"testing"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
	"transmission-client-go/internal/infrastructure/transmission"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTransmissionClient - мок для TransmissionClient
type MockTransmissionClient struct {
	mock.Mock
}

func (m *MockTransmissionClient) GetAll() ([]domain.Torrent, error) {
	args := m.Called()
	var torrents []domain.Torrent
	if args.Get(0) != nil {
		torrents = args.Get(0).([]domain.Torrent)
	}
	return torrents, args.Error(1)
}

func (m *MockTransmissionClient) Add(url string, downloadDir string) error {
	args := m.Called(url, downloadDir)
	return args.Error(0)
}

func (m *MockTransmissionClient) AddFile(filepath string, downloadDir string) error {
	args := m.Called(filepath, downloadDir)
	return args.Error(0)
}

func (m *MockTransmissionClient) Remove(id int64, deleteData bool) error {
	args := m.Called(id, deleteData)
	return args.Error(0)
}

func (m *MockTransmissionClient) Start(ids []int64) error {
	args := m.Called(ids)
	return args.Error(0)
}

func (m *MockTransmissionClient) Stop(ids []int64) error {
	args := m.Called(ids)
	return args.Error(0)
}

func (m *MockTransmissionClient) GetSessionStats() (*domain.SessionStats, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.SessionStats), args.Error(1)
}

func (m *MockTransmissionClient) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]domain.TorrentFile), args.Error(1)
}

func (m *MockTransmissionClient) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	args := m.Called(id, fileIds, wanted)
	return args.Error(0)
}

func (m *MockTransmissionClient) SetTorrentSpeedLimit(ids []int64, downloadLimit int64, uploadLimit int64) error {
	args := m.Called(ids, downloadLimit, uploadLimit)
	return args.Error(0)
}

func (m *MockTransmissionClient) VerifyTorrent(id int64) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockTransmissionClient) GetDefaultDownloadDir() (string, error) {
	args := m.Called()
	return args.String(0), args.Error(1)
}

func (m *MockTransmissionClient) ValidateDownloadPath(path string) error {
	args := m.Called(path)
	return args.Error(0)
}

func (m *MockTransmissionClient) GetTorrentDownloadDirectory(id int64) (string, error) {
	args := m.Called(id)
	return args.String(0), args.Error(1)
}

// MockConfigService - мок для IConfigService
type MockConfigService struct {
	mock.Mock
}

func (m *MockConfigService) LoadConfig() (*domain.Config, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Config), args.Error(1)
}

func (m *MockConfigService) SaveConfig(config *domain.Config) error {
	args := m.Called(config)
	return args.Error(0)
}

func (m *MockConfigService) ConfigExists() (bool, error) {
	args := m.Called()
	return args.Bool(0), args.Error(1)
}

// --- Глобальные переменные для хранения оригинальных фабрик ---
var originalConfigServiceFactoryImpl configServiceFactory
var originalTransmissionClientFactoryImpl transmissionClientFactory

// --- Функция для установки моков перед тестами ---
func setupMocks(t *testing.T) (*MockTransmissionClient, *MockConfigService) {
	t.Helper()

	// Сохраняем оригинальные фабрики
	originalConfigServiceFactoryImpl = configServiceFactoryImpl
	originalTransmissionClientFactoryImpl = transmissionClientFactoryImpl

	mockRepo := new(MockTransmissionClient)
	mockCfgSvc := new(MockConfigService)

	// Подменяем фабрику ConfigService
	configServiceFactoryImpl = func() infrastructure.IConfigService {
		return mockCfgSvc
	}

	// Подменяем фабрику TransmissionClient
	transmissionClientFactoryImpl = func(config transmission.TransmissionConfig) (domain.TorrentRepository, error) {
		return mockRepo, nil
	}

	// Регистрируем очистку после теста
	t.Cleanup(func() {
		configServiceFactoryImpl = originalConfigServiceFactoryImpl
		transmissionClientFactoryImpl = originalTransmissionClientFactoryImpl
	})

	return mockRepo, mockCfgSvc
}

// Базовые тесты
func TestNewTorrentService(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	assert.NotNil(t, service)
	assert.Equal(t, mockRepo, service.repo)
	assert.Nil(t, service.config)
}

func TestUpdateConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)
	config := &domain.Config{
		Host: "localhost",
		Port: 9091,
	}

	service.UpdateConfig(config)
	assert.Equal(t, config, service.config)
}
