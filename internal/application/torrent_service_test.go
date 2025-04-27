package application

import (
	"errors"
	"fmt"
	"testing"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure" // Импортируем для интерфейса IConfigService
	"transmission-client-go/internal/infrastructure/transmission"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require" // Используем require для проверок в setup/teardown
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

// Тесты
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

func TestGetAllTorrents_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	expectedTorrents := []domain.Torrent{
		{ID: 1, Name: "Test1"},
		{ID: 2, Name: "Test2"},
	}

	mockRepo.On("GetAll").Return(expectedTorrents, nil)

	torrents, err := service.GetAllTorrents()

	assert.NoError(t, err)
	assert.Equal(t, expectedTorrents, torrents)
	mockRepo.AssertExpectations(t)
}

func TestGetAllTorrents_WithAutoStop(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		MaxUploadRatio: 1.5,
	}

	torrents := []domain.Torrent{
		{ID: 1, Name: "Test1", Status: domain.StatusSeeding, UploadRatio: 2.0},
		{ID: 2, Name: "Test2", Status: domain.StatusSeeding, UploadRatio: 1.0},
	}

	mockRepo.On("GetAll").Return(torrents, nil)
	mockRepo.On("Stop", []int64{1}).Return(nil)

	result, err := service.GetAllTorrents()

	assert.NoError(t, err)
	assert.Equal(t, torrents, result)
	mockRepo.AssertExpectations(t)
}

func TestAddTorrent_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	downloadDir := "/test/path"
	torrentURL := "http://example.com/test.torrent"

	mockRepo.On("ValidateDownloadPath", downloadDir).Return(nil)
	mockRepo.On("Add", torrentURL, downloadDir).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	err := service.AddTorrent(torrentURL, downloadDir)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestAddTorrent_InvalidPath(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	invalidPath := "/invalid/path"
	torrentURL := "http://example.com/test.torrent"

	mockRepo.On("ValidateDownloadPath", invalidPath).Return(fmt.Errorf("invalid path"))

	err := service.AddTorrent(torrentURL, invalidPath)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid download path")
	mockRepo.AssertExpectations(t)
}

func TestRemoveTorrent(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)
	deleteData := true

	mockRepo.On("Remove", torrentID, deleteData).Return(nil)

	err := service.RemoveTorrent(torrentID, deleteData)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestStartStopTorrents(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2, 3}

	mockRepo.On("Start", ids).Return(nil)
	err := service.StartTorrents(ids)
	assert.NoError(t, err)

	mockRepo.On("Stop", ids).Return(nil)
	err = service.StopTorrents(ids)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2}
	service.config = &domain.Config{
		SlowSpeedLimit: 50,
		SlowSpeedUnit:  "KiB/s",
	}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(50), int64(50)).Return(nil)
	err := service.SetTorrentSpeedLimit(ids, true)
	assert.NoError(t, err)

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(0), int64(0)).Return(nil)
	err = service.SetTorrentSpeedLimit(ids, false)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_WithConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		SlowSpeedLimit: 20,
		SlowSpeedUnit:  "MiB/s",
	}

	ids := []int64{1, 2}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(20480), int64(20480)).Return(nil)

	err := service.SetTorrentSpeedLimit(ids, true)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(10), int64(10)).Return(nil)

	err := service.SetTorrentSpeedLimit(ids, true)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestVerifyTorrent(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)

	mockRepo.On("VerifyTorrent", torrentID).Return(nil)

	err := service.VerifyTorrent(torrentID)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestGetTorrentFiles(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)
	expectedFiles := []domain.TorrentFile{
		{ID: 1, Name: "file1.txt", Size: 1024, Progress: 0.5},
		{ID: 2, Name: "file2.txt", Size: 2048, Progress: 1.0},
	}

	mockRepo.On("GetTorrentFiles", torrentID).Return(expectedFiles, nil)

	files, err := service.GetTorrentFiles(torrentID)

	assert.NoError(t, err)
	assert.Equal(t, expectedFiles, files)
	mockRepo.AssertExpectations(t)
}

func TestGetDefaultDownloadDir_FromConfig(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedPath := "/default/path"
	service.config = &domain.Config{
		DefaultDownloadPath: expectedPath,
	}

	path, err := service.GetDefaultDownloadDir()

	assert.NoError(t, err)
	assert.Equal(t, expectedPath, path)
	mockRepo.AssertNotCalled(t, "GetDefaultDownloadDir")
}

func TestGetDefaultDownloadDir_FromRepository(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedPath := "/default/path"
	service.config = &domain.Config{}

	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil)

	path, err := service.GetDefaultDownloadDir()

	assert.NoError(t, err)
	assert.Equal(t, expectedPath, path)
	assert.Equal(t, expectedPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestGetDefaultDownloadDir_RepositoryError(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}
	repoError := errors.New("repo error")

	mockRepo.On("GetDefaultDownloadDir").Return("", repoError)

	path, err := service.GetDefaultDownloadDir()

	assert.ErrorIs(t, err, repoError)
	assert.Empty(t, path)
	assert.Empty(t, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestSaveDownloadPath_New(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/existing/path"},
	}
	newPath := "/new/path"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return len(cfg.DownloadPaths) == 2 && cfg.DownloadPaths[0] == newPath
	})).Return(nil)

	err := service.SaveDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{newPath, "/existing/path"}, service.config.DownloadPaths)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveDownloadPath_Duplicate(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	existingPath := "/existing/path"
	service.config = &domain.Config{
		DownloadPaths: []string{existingPath},
	}

	err := service.SaveDownloadPath(existingPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{existingPath}, service.config.DownloadPaths)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveDownloadPath_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.SaveDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveDownloadPath_EmptyPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	err := service.SaveDownloadPath("")

	assert.NoError(t, err)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveDownloadPath_LimitPaths(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	paths := make([]string, 10)
	for i := 0; i < 10; i++ {
		paths[i] = fmt.Sprintf("/existing/path%d", i)
	}
	service.config = &domain.Config{DownloadPaths: paths}
	newPath := "/new/path"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return len(cfg.DownloadPaths) == 10 && cfg.DownloadPaths[0] == newPath
	})).Return(nil)

	err := service.SaveDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Len(t, service.config.DownloadPaths, 10)
	assert.Equal(t, newPath, service.config.DownloadPaths[0])
	assert.NotContains(t, service.config.DownloadPaths, "/existing/path9")
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveDownloadPath_SaveError(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{DownloadPaths: []string{"/old"}}
	newPath := "/new"
	saveError := errors.New("disk full")

	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(saveError)

	err := service.SaveDownloadPath(newPath)

	assert.ErrorIs(t, err, saveError)
	assert.Equal(t, []string{newPath, "/old"}, service.config.DownloadPaths)
	mockCfgSvc.AssertExpectations(t)
}

func TestGetDownloadPaths_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedPaths := []string{"/path1", "/path2"}
	service.config = &domain.Config{
		DefaultDownloadPath: "/path1",
		DownloadPaths:       expectedPaths,
	}

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Equal(t, expectedPaths, paths)
}

func TestGetDownloadPaths_NoConfig(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	paths, err := service.GetDownloadPaths()

	assert.Error(t, err)
	assert.Nil(t, paths)
	assert.Equal(t, ErrConfigNotInited, err.Error())
}

func TestGetDownloadPaths_EmptyConfigFetchClientSuccess(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{},
	}
	expectedPath := "/from/client"

	mockRepo.On("GetDefaultDownloadDir").Return("", errors.New("not found")).Once()
	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil).Once()

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Equal(t, []string{expectedPath}, paths)
	assert.Equal(t, expectedPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestGetDownloadPaths_EmptyConfigFetchClientError(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{},
	}
	fetchError := errors.New("client unavailable")

	mockRepo.On("GetDefaultDownloadDir").Return("", fetchError).Once()
	mockRepo.On("GetDefaultDownloadDir").Return("", fetchError).Once()

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Empty(t, paths)
	mockRepo.AssertExpectations(t)
}

func TestGetDownloadPaths_WithDefaultPathOnly(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "/default/path",
		DownloadPaths:       []string{},
	}

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Equal(t, []string{"/default/path"}, paths)
}

func TestGetDownloadPaths_WithHistoryOnly(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{"/hist1", "/hist2"},
	}
	fetchError := errors.New("client unavailable")

	mockRepo.On("GetDefaultDownloadDir").Return("", fetchError).Once()

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Equal(t, []string{"/hist1", "/hist2"}, paths)
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path1", "/new/path2"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/new/path1",
	}

	mockRepo.On("ValidateDownloadPath", "/new/path1").Return(nil)
	mockRepo.On("ValidateDownloadPath", "/new/path2").Return(nil)

	err := service.ValidatePathsTransaction(transaction)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_InvalidPath(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/invalid/path", "/valid/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/valid/path",
	}

	mockRepo.On("ValidateDownloadPath", "/invalid/path").Return(fmt.Errorf("invalid path"))

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid path /invalid/path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_NilTransaction(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.ValidatePathsTransaction(nil)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "transaction cannot be nil")
}

func TestValidatePathsTransaction_InvalidDefaultPath(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/valid/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/invalid/default/path",
	}

	mockRepo.On("ValidateDownloadPath", "/valid/path").Return(nil)
	mockRepo.On("ValidateDownloadPath", "/invalid/default/path").Return(fmt.Errorf("invalid path"))

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid default path /invalid/default/path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_DuplicatePaths(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path", "/new/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/new/path",
	}

	mockRepo.On("ValidateDownloadPath", "/new/path").Return(nil)

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "duplicate path in transaction: /new/path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_ConflictingPaths(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/path/to/add"},
		PathsToRemove: []string{"/path/to/add"},
		DefaultPath:   "",
	}

	mockRepo.On("ValidateDownloadPath", "/path/to/add").Return(nil)

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conflict: path /path/to/add is both added and removed")
	mockRepo.AssertExpectations(t)
}

func TestApplyPathsTransaction_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old/path1", "/old/path2"}
	originalDefault := "/old/path1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
	}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path"},
		PathsToRemove: []string{"/old/path1"},
		DefaultPath:   "/new/path",
	}

	mockRepo.On("ValidateDownloadPath", "/new/path").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	err := service.ApplyPathsTransaction(transaction)

	assert.NoError(t, err)
	assert.Equal(t, []string{"/old/path2", "/new/path"}, service.config.DownloadPaths)
	assert.Equal(t, "/new/path", service.config.DefaultDownloadPath)

	require.NotNil(t, transaction.OriginalState)
	assert.Equal(t, originalPaths, transaction.OriginalState.Paths)
	assert.Equal(t, originalDefault, transaction.OriginalState.DefaultPath)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestApplyPathsTransaction_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{}

	err := service.ApplyPathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), ErrConfigNotInited)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestApplyPathsTransaction_ValidationError(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old/path1"}
	originalDefault := "/old/path1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
	}

	transaction := &domain.PathsTransaction{
		PathsToAdd: []string{"/invalid/path"},
	}
	validationError := errors.New("validation error")

	mockRepo.On("ValidateDownloadPath", "/invalid/path").Return(validationError)

	err := service.ApplyPathsTransaction(transaction)

	assert.Error(t, err)
	assert.ErrorContains(t, err, validationError.Error())
	assert.ErrorContains(t, err, "validation failed")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)

	require.NotNil(t, transaction.OriginalState)
	assert.Equal(t, originalPaths, transaction.OriginalState.Paths)
	assert.Equal(t, originalDefault, transaction.OriginalState.DefaultPath)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestApplyPathsTransaction_SaveErrorAndRollback(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old/path1", "/old/path2"}
	originalDefault := "/old/path1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
	}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path"},
		PathsToRemove: []string{"/old/path1"},
		DefaultPath:   "/new/path",
	}
	saveError := errors.New("disk is full")

	mockRepo.On("ValidateDownloadPath", "/new/path").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(saveError)

	err := service.ApplyPathsTransaction(transaction)

	assert.Error(t, err)
	assert.ErrorIs(t, err, saveError)
	assert.ErrorContains(t, err, "failed to save config")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)

	require.NotNil(t, transaction.OriginalState)
	assert.Equal(t, originalPaths, transaction.OriginalState.Paths)
	assert.Equal(t, originalDefault, transaction.OriginalState.DefaultPath)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSavePaths_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2", "/path3"},
		DefaultDownloadPath: "/path1",
	}

	pathsToAdd := []string{"/new/path", "/path3"}
	pathsToRemove := []string{"/path2"}
	defaultPath := "/new/path"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		expected := []string{"/new/path", "/path1", "/path3"}
		// Используем ElementsMatch для сравнения без учета порядка
		return cfg.DefaultDownloadPath == defaultPath && assert.ElementsMatch(t, expected, cfg.DownloadPaths)
	})).Return(nil)

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	// Используем ElementsMatch, так как порядок не важен (кроме defaultPath, который проверяется отдельно)
	assert.ElementsMatch(t, []string{"/new/path", "/path1", "/path3"}, service.config.DownloadPaths)
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	mockCfgSvc.AssertExpectations(t)
}

func TestSavePaths_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.SavePaths([]string{"/new"}, []string{}, "/new")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSavePaths_SaveErrorAndRollback(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/path1", "/path2"}
	originalDefault := "/path1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
	}

	pathsToAdd := []string{"/new/path"}
	pathsToRemove := []string{"/path2"}
	defaultPath := "/new/path"
	saveError := errors.New("cannot write file")

	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(saveError)

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, saveError)
	assert.ErrorContains(t, err, "failed to save config")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)
	mockCfgSvc.AssertExpectations(t)
}

func TestSavePaths_AddDefaultToHistory(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1"},
		DefaultDownloadPath: "/path1",
	}

	pathsToAdd := []string{}
	pathsToRemove := []string{}
	defaultPath := "/new/default"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		expected := []string{"/new/default", "/path1"}
		return cfg.DefaultDownloadPath == defaultPath && assert.ObjectsAreEqual(expected, cfg.DownloadPaths)
	})).Return(nil)

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{"/new/default", "/path1"}, service.config.DownloadPaths)
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	mockCfgSvc.AssertExpectations(t)
}

func TestSavePaths_LimitHistoryWithDefault(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	paths := make([]string, 10)
	for i := 0; i < 10; i++ {
		paths[i] = fmt.Sprintf("/path%d", i)
	}
	service.config = &domain.Config{
		DownloadPaths:       paths,
		DefaultDownloadPath: "/path0",
	}

	pathsToAdd := []string{}
	pathsToRemove := []string{}
	defaultPath := "/new/default"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return len(cfg.DownloadPaths) == 10 &&
			cfg.DefaultDownloadPath == defaultPath &&
			cfg.DownloadPaths[0] == defaultPath &&
			cfg.DownloadPaths[9] == "/path8"
	})).Return(nil)

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Len(t, service.config.DownloadPaths, 10)
	assert.Equal(t, defaultPath, service.config.DownloadPaths[0])
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	assert.NotContains(t, service.config.DownloadPaths, "/path9")
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_SuccessNoConnectionChange(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalHost := "host1"
	originalPort := 9091
	originalPaths := []string{"/old"}
	originalDefault := "/old"
	service.config = &domain.Config{
		Host:                originalHost,
		Port:                originalPort,
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
		MaxUploadRatio:      1.0,
	}

	newConnConfig := domain.ConnectionConfig{
		Host:           originalHost,
		Port:           originalPort,
		MaxUploadRatio: 2.5,
		SlowSpeedLimit: 100,
		SlowSpeedUnit:  "KiB/s",
	}
	pathsToAdd := []string{"/new"}
	pathsToRemove := []string{"/old"}
	defaultPath := "/new"

	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return cfg.Host == originalHost &&
			cfg.Port == originalPort &&
			cfg.MaxUploadRatio == 2.5 &&
			cfg.SlowSpeedLimit == 100 &&
			cfg.DefaultDownloadPath == defaultPath &&
			assert.ObjectsAreEqual([]string{"/new"}, cfg.DownloadPaths)
	})).Return(nil)

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Equal(t, originalHost, service.config.Host)
	assert.Equal(t, originalPort, service.config.Port)
	assert.Equal(t, 2.5, service.config.MaxUploadRatio)
	assert.Equal(t, 100, service.config.SlowSpeedLimit)
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	assert.Equal(t, []string{"/new"}, service.config.DownloadPaths)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_SuccessWithConnectionChange(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		Host:                "old-host",
		Port:                9091,
		DownloadPaths:       []string{"/old"},
		DefaultDownloadPath: "/old",
	}

	newConnConfig := domain.ConnectionConfig{
		Host: "new-host",
		Port: 9092,
	}
	pathsToAdd := []string{"/new"}
	pathsToRemove := []string{"/old"}
	defaultPath := "/new"

	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	newMockRepo := new(MockTransmissionClient)
	transmissionClientFactoryImpl = func(config transmission.TransmissionConfig) (domain.TorrentRepository, error) {
		assert.Equal(t, "new-host", config.Host)
		assert.Equal(t, 9092, config.Port)
		return newMockRepo, nil
	}

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.SaveSettingsWithPaths(domain.ConnectionConfig{}, []string{}, []string{}, "")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveSettingsWithPaths_InvalidPathToAdd(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old"}
	originalDefault := "/old"
	originalHost := "host1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
		Host:                originalHost,
	}

	pathsToAdd := []string{"/invalid"}
	validationError := errors.New("path validation failed")

	mockRepo.On("ValidateDownloadPath", "/invalid").Return(validationError)

	err := service.SaveSettingsWithPaths(domain.ConnectionConfig{Host: "new-host"}, pathsToAdd, []string{}, "")

	assert.Error(t, err)
	assert.ErrorIs(t, err, validationError)
	assert.ErrorContains(t, err, "failed to save paths: invalid path /invalid")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)
	assert.Equal(t, originalHost, service.config.Host)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveSettingsWithPaths_InvalidDefaultPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old"}
	originalDefault := "/old"
	originalHost := "host1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
		Host:                originalHost,
	}

	defaultPath := "/invalid-default"
	validationError := errors.New("default path validation failed")

	mockRepo.On("ValidateDownloadPath", defaultPath).Return(validationError)

	err := service.SaveSettingsWithPaths(domain.ConnectionConfig{Host: "new-host"}, []string{}, []string{}, defaultPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, validationError)
	assert.ErrorContains(t, err, "failed to save paths: invalid default path /invalid-default")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)
	assert.Equal(t, originalHost, service.config.Host)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSaveSettingsWithPaths_SaveConfigErrorAndRollback(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old"}
	originalDefault := "/old"
	originalHost := "host1"
	originalPort := 9091
	originalRatio := 1.0
	originalLimit := 0
	originalUnit := ""
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
		Host:                originalHost,
		Port:                originalPort,
		MaxUploadRatio:      originalRatio,
		SlowSpeedLimit:      originalLimit,
		SlowSpeedUnit:       originalUnit,
	}

	newConnConfig := domain.ConnectionConfig{
		Host:           "new-host",
		Port:           9092,
		MaxUploadRatio: 2.5,
		SlowSpeedLimit: 100,
		SlowSpeedUnit:  "KiB/s",
	}
	pathsToAdd := []string{"/new"}
	pathsToRemove := []string{"/old"}
	defaultPath := "/new"
	saveError := errors.New("disk full")

	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(saveError)

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, saveError)
	assert.ErrorContains(t, err, "failed to save config")
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	assert.Equal(t, originalDefault, service.config.DefaultDownloadPath)
	assert.Equal(t, originalHost, service.config.Host)
	assert.Equal(t, originalPort, service.config.Port)
	assert.Equal(t, originalRatio, service.config.MaxUploadRatio)
	assert.Equal(t, originalLimit, service.config.SlowSpeedLimit)
	assert.Equal(t, originalUnit, service.config.SlowSpeedUnit)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_NewClientError(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalHost := "old-host"
	service.config = &domain.Config{
		Host:                originalHost,
		Port:                9091,
		DownloadPaths:       []string{"/old"},
		DefaultDownloadPath: "/old",
	}

	newConnConfig := domain.ConnectionConfig{
		Host: "new-host",
		Port: 9092,
	}
	pathsToAdd := []string{"/new"}
	pathsToRemove := []string{"/old"}
	defaultPath := "/new"
	clientError := errors.New("cannot connect to new host")

	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	transmissionClientFactoryImpl = func(config transmission.TransmissionConfig) (domain.TorrentRepository, error) {
		return nil, clientError
	}

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, clientError)
	assert.ErrorContains(t, err, "failed to initialize transmission client after saving config")
	assert.Equal(t, "new-host", service.config.Host)
	assert.Equal(t, 9092, service.config.Port)
	assert.Equal(t, "/new", service.config.DefaultDownloadPath)
	assert.Equal(t, mockRepo, service.repo)

	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_AddDefaultToHistory(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1"},
		DefaultDownloadPath: "/path1",
		Host:                "host1",
	}
	newConnConfig := domain.ConnectionConfig{Host: "host1"}
	pathsToAdd := []string{}
	pathsToRemove := []string{}
	defaultPath := "/new/default"

	mockRepo.On("ValidateDownloadPath", defaultPath).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		expected := []string{"/new/default", "/path1"}
		return cfg.DefaultDownloadPath == defaultPath && assert.ObjectsAreEqual(expected, cfg.DownloadPaths)
	})).Return(nil)

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{"/new/default", "/path1"}, service.config.DownloadPaths)
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_LimitHistoryWithDefault(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	paths := make([]string, 10)
	for i := 0; i < 10; i++ {
		paths[i] = fmt.Sprintf("/path%d", i)
	}
	service.config = &domain.Config{
		DownloadPaths:       paths,
		DefaultDownloadPath: "/path0",
		Host:                "host1",
	}
	newConnConfig := domain.ConnectionConfig{Host: "host1"}
	pathsToAdd := []string{}
	pathsToRemove := []string{}
	defaultPath := "/new/default"

	mockRepo.On("ValidateDownloadPath", defaultPath).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return len(cfg.DownloadPaths) == 10 &&
			cfg.DefaultDownloadPath == defaultPath &&
			cfg.DownloadPaths[0] == defaultPath &&
			cfg.DownloadPaths[9] == "/path8"
	})).Return(nil)

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Len(t, service.config.DownloadPaths, 10)
	assert.Equal(t, defaultPath, service.config.DownloadPaths[0])
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	assert.NotContains(t, service.config.DownloadPaths, "/path9")
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestGetTorrentDownloadDirectory_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)
	expectedDir := "/downloads/torrent1"

	mockRepo.On("GetTorrentDownloadDirectory", torrentID).Return(expectedDir, nil)

	dir, err := service.GetTorrentDownloadDirectory(torrentID)

	assert.NoError(t, err)
	assert.Equal(t, expectedDir, dir)
	mockRepo.AssertExpectations(t)
}

func TestRemoveDownloadPath_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2", "/path3"},
		DefaultDownloadPath: "/path2",
	}
	pathToRemove := "/path1"

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return assert.ObjectsAreEqual([]string{"/path2", "/path3"}, cfg.DownloadPaths)
	})).Return(nil)

	err := service.RemoveDownloadPath(pathToRemove)

	assert.NoError(t, err)
	assert.Equal(t, []string{"/path2", "/path3"}, service.config.DownloadPaths)
	mockCfgSvc.AssertExpectations(t)
}

func TestRemoveDownloadPath_DefaultPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	defaultPath := "/path1"
	service.config = &domain.Config{
		DownloadPaths:       []string{defaultPath, "/path2"},
		DefaultDownloadPath: defaultPath,
	}

	err := service.RemoveDownloadPath(defaultPath)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot remove default download path")
	assert.Equal(t, []string{defaultPath, "/path2"}, service.config.DownloadPaths)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestRemoveDownloadPath_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.RemoveDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestRemoveDownloadPath_PathNotFound(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/path1", "/path2"}
	service.config = &domain.Config{
		DownloadPaths:       originalPaths,
		DefaultDownloadPath: "/path2",
	}

	err := service.RemoveDownloadPath("/non/existent/path")

	assert.NoError(t, err)
	assert.Equal(t, originalPaths, service.config.DownloadPaths)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSetFilesWanted_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)
	fileIds := []int{1, 2, 3}
	wanted := true

	mockRepo.On("SetFilesWanted", torrentID, fileIds, wanted).Return(nil)

	err := service.SetFilesWanted(torrentID, fileIds, wanted)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestGetSessionStats_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedStats := &domain.SessionStats{
		TotalDownloadSpeed:  1024,
		TotalUploadSpeed:    512,
		FreeSpace:           1073741824,
		TransmissionVersion: "2.94",
	}

	mockRepo.On("GetSessionStats").Return(expectedStats, nil)

	stats, err := service.GetSessionStats()

	assert.NoError(t, err)
	assert.Equal(t, expectedStats, stats)
	mockRepo.AssertExpectations(t)
}

func TestGetTorrents(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedTorrents := []domain.Torrent{
		{ID: 1, Name: "Test1"},
		{ID: 2, Name: "Test2"},
	}

	mockRepo.On("GetAll").Return(expectedTorrents, nil)

	torrents, err := service.GetTorrents()

	assert.NoError(t, err)
	assert.Equal(t, expectedTorrents, torrents)
	mockRepo.AssertExpectations(t)
}

func TestSetDefaultDownloadPath_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/existing/path"},
	}
	newPath := "/new/default/path"

	mockRepo.On("ValidateDownloadPath", newPath).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil).Twice()

	err := service.SetDefaultDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Equal(t, newPath, service.config.DefaultDownloadPath)
	assert.Contains(t, service.config.DownloadPaths, newPath)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSetDefaultDownloadPath_NoConfig(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.SetDefaultDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSetDefaultDownloadPath_EmptyPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	err := service.SetDefaultDownloadPath("")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "path cannot be empty")
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestSetDefaultDownloadPath_InvalidPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}
	invalidPath := "/invalid/path"
	validationError := errors.New("invalid path")

	mockRepo.On("ValidateDownloadPath", invalidPath).Return(validationError)

	err := service.SetDefaultDownloadPath(invalidPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, validationError)
	assert.ErrorContains(t, err, "invalid download path")
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestAddTorrentFile_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	downloadDir := "/test/path"
	filePath := "/tmp/test.torrent"

	mockRepo.On("ValidateDownloadPath", downloadDir).Return(nil)
	mockRepo.On("AddFile", filePath, downloadDir).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	err := service.AddTorrentFile(filePath, downloadDir)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestAddTorrentFile_InvalidPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	invalidPath := "/invalid/path"
	filePath := "/tmp/test.torrent"
	validationError := errors.New("invalid path")

	mockRepo.On("ValidateDownloadPath", invalidPath).Return(validationError)

	err := service.AddTorrentFile(filePath, invalidPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, validationError)
	assert.ErrorContains(t, err, "invalid download path")
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestAddTorrentFile_EmptyDownloadDir(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	filePath := "/tmp/test.torrent"
	downloadDir := "" // Пустой путь
	// Ожидаемая ошибка из TorrentService.ValidateDownloadPath
	expectedValidationErrorString := "download path cannot be empty"

	// Убираем ожидание вызова mockRepo.ValidateDownloadPath,
	// так как он не должен вызываться при пустом пути.
	// mockRepo.On("ValidateDownloadPath", downloadDir).Return(validationError)

	err := service.AddTorrentFile(filePath, downloadDir)

	assert.Error(t, err)
	// Проверяем, что ошибка содержит текст ошибки валидации из TorrentService.ValidateDownloadPath
	assert.ErrorContains(t, err, expectedValidationErrorString)
	// Проверяем, что ошибка обернута правильно
	assert.ErrorContains(t, err, "invalid download path")
	mockRepo.AssertExpectations(t) // Теперь здесь не должно быть несработавших ожиданий
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
	mockRepo.AssertNotCalled(t, "AddFile", mock.Anything, mock.Anything)
}

func TestFetchPathFromClient_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	expectedPath := "/default/from/client"
	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil)

	resultPath := service.fetchPathFromClient()

	assert.Equal(t, expectedPath, resultPath)
	assert.Equal(t, expectedPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestFetchPathFromClient_Error(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}
	repoError := errors.New("connection error")

	mockRepo.On("GetDefaultDownloadDir").Return("", repoError)

	resultPath := service.fetchPathFromClient()

	assert.Equal(t, "", resultPath)
	assert.Equal(t, "", service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestGetPathsState_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2"},
		DefaultDownloadPath: "/path1",
	}

	state, err := service.GetPathsState()

	assert.NoError(t, err)
	require.NotNil(t, state)
	assert.Equal(t, "/path1", state.DefaultPath)
	assert.Equal(t, []string{"/path1", "/path2"}, state.Paths)
}

func TestGetPathsState_NoConfig(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	state, err := service.GetPathsState()

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	assert.Nil(t, state)
}

func TestFetchDefaultPathIfEmpty_NotEmpty(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "/existing/default/path",
	}

	resultPath := service.fetchDefaultPathIfEmpty()

	assert.Equal(t, "/existing/default/path", resultPath)
	mockRepo.AssertNotCalled(t, "GetDefaultDownloadDir")
}

func TestFetchDefaultPathIfEmpty_GetFromRepoSuccess(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
	}
	expectedPath := "/default/from/repo"

	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil)

	resultPath := service.fetchDefaultPathIfEmpty()

	assert.Equal(t, expectedPath, resultPath)
	mockRepo.AssertExpectations(t)
}

func TestFetchDefaultPathIfEmpty_GetFromRepoError(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
	}
	repoError := errors.New("repo error")

	mockRepo.On("GetDefaultDownloadDir").Return("", repoError)

	resultPath := service.fetchDefaultPathIfEmpty()

	assert.Equal(t, "", resultPath)
	mockRepo.AssertExpectations(t)
}

func TestValidateDownloadPath_EmptyPath(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	err := service.ValidateDownloadPath("")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "download path cannot be empty")
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
}

func TestValidateDownloadPath_RepoError(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	invalidPath := "/invalid/path"
	repoError := errors.New("permission denied")

	mockRepo.On("ValidateDownloadPath", invalidPath).Return(repoError)

	err := service.ValidateDownloadPath(invalidPath)

	assert.Error(t, err)
	assert.ErrorIs(t, err, repoError)
	mockRepo.AssertExpectations(t)
}

func TestValidateDownloadPath_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	validPath := "/valid/path"
	mockRepo.On("ValidateDownloadPath", validPath).Return(nil)

	err := service.ValidateDownloadPath(validPath)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestConvertSpeedToKiBps(t *testing.T) {
	assert.Equal(t, int64(50), convertSpeedToKiBps(50, "KiB/s"))
	assert.Equal(t, int64(2048), convertSpeedToKiBps(2, "MiB/s"))
	assert.Equal(t, int64(100), convertSpeedToKiBps(100, "unknown"))
	assert.Equal(t, int64(0), convertSpeedToKiBps(0, "MiB/s"))
}

func TestValidateDownloadPath_NilConfig(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	err := service.ValidateDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
}

func TestGetAllTorrents_RepoError(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	repoError := errors.New("failed to get torrents from repo")

	mockRepo.On("GetAll").Return(nil, repoError)

	torrents, err := service.GetAllTorrents()

	assert.ErrorIs(t, err, repoError)
	assert.Nil(t, torrents)
	mockRepo.AssertExpectations(t)
}

func TestAddUniquePathsFromHistory_DefaultExists(t *testing.T) {
	service := &TorrentService{
		config: &domain.Config{
			DefaultDownloadPath: "/default",
			DownloadPaths:       []string{"/hist1", "/default", "/hist2"},
		},
	}
	result := []string{"/current"}
	finalResult := service.addUniquePathsFromHistory(result)
	// Ожидаем, что "/default" не будет добавлен снова, но порядок сохранится
	assert.Equal(t, []string{"/current", "/hist1", "/hist2"}, finalResult)
}

func TestSaveSettingsWithPaths_RemoveNonExistentPath(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/path1", "/path2"}
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: "/path1",
		Host:                "host1",
	}
	newConnConfig := domain.ConnectionConfig{Host: "host1"} // Без изменений соединения
	pathsToAdd := []string{}
	pathsToRemove := []string{"/non-existent", "/path1"} // Удаляем существующий и несуществующий
	defaultPath := "/path2"                              // Меняем путь по умолчанию

	mockRepo.On("ValidateDownloadPath", defaultPath).Return(nil) // Валидация нового defaultPath
	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		// Ожидаем, что останется только /path2, и он станет путем по умолчанию
		expected := []string{"/path2"}
		return cfg.DefaultDownloadPath == defaultPath && assert.ObjectsAreEqual(expected, cfg.DownloadPaths)
	})).Return(nil)

	err := service.SaveSettingsWithPaths(newConnConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{"/path2"}, service.config.DownloadPaths)
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}
