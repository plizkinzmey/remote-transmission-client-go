package application

import (
	"fmt"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTransmissionClient - мок для TransmissionClient
type MockTransmissionClient struct {
	mock.Mock
}

func (m *MockTransmissionClient) GetAll() ([]domain.Torrent, error) {
	args := m.Called()
	return args.Get(0).([]domain.Torrent), args.Error(1)
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

	// Устанавливаем конфигурацию с MaxUploadRatio
	service.config = &domain.Config{
		MaxUploadRatio: 1.5,
	}

	// Создаем торренты с разным рейтингом загрузки
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	downloadDir := "/test/path"
	torrentURL := "http://example.com/test.torrent"

	// Настраиваем мок для валидации пути
	mockRepo.On("ValidateDownloadPath", downloadDir).Return(nil)
	mockRepo.On("Add", torrentURL, downloadDir).Return(nil)

	err := service.AddTorrent(torrentURL, downloadDir)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestAddTorrent_InvalidPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	invalidPath := "/invalid/path"
	torrentURL := "http://example.com/test.torrent"

	// Путь не проходит валидацию
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

	// Тест запуска торрентов
	mockRepo.On("Start", ids).Return(nil)
	err := service.StartTorrents(ids)
	assert.NoError(t, err)

	// Тест остановки торрентов
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

	// Тест включения медленного режима
	mockRepo.On("SetTorrentSpeedLimit", ids, int64(50), int64(50)).Return(nil)
	err := service.SetTorrentSpeedLimit(ids, true)
	assert.NoError(t, err)

	// Тест выключения медленного режима
	mockRepo.On("SetTorrentSpeedLimit", ids, int64(0), int64(0)).Return(nil)
	err = service.SetTorrentSpeedLimit(ids, false)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_WithConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	// Устанавливаем конфигурацию с настройками медленного режима
	service.config = &domain.Config{
		SlowSpeedLimit: 20,
		SlowSpeedUnit:  "MiB/s", // Проверяем конвертацию из MiB/s в KiB/s
	}

	ids := []int64{1, 2}

	// При использовании единиц MiB/s, 20 MiB/s конвертируется в 20*1024 = 20480 KiB/s
	mockRepo.On("SetTorrentSpeedLimit", ids, int64(20480), int64(20480)).Return(nil)

	err := service.SetTorrentSpeedLimit(ids, true)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	// Не устанавливаем конфигурацию (равна nil)
	ids := []int64{1, 2}

	// Должен использоваться лимит по умолчанию (10 КБ/с)
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
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	expectedPath := "/default/path"
	service.config = &domain.Config{} // пустая конфигурация

	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil)

	path, err := service.GetDefaultDownloadDir()

	assert.NoError(t, err)
	assert.Equal(t, expectedPath, path)
	assert.Equal(t, expectedPath, service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestSaveDownloadPath_New(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/existing/path"},
	}

	newPath := "/new/path"
	err := service.SaveDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{newPath, "/existing/path"}, service.config.DownloadPaths)
}

func TestSaveDownloadPath_Duplicate(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	existingPath := "/existing/path"
	service.config = &domain.Config{
		DownloadPaths: []string{existingPath},
	}

	err := service.SaveDownloadPath(existingPath)

	assert.NoError(t, err)
	assert.Equal(t, []string{existingPath}, service.config.DownloadPaths)
}

func TestSaveDownloadPath_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	err := service.SaveDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
}

func TestSaveDownloadPath_EmptyPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{}

	err := service.SaveDownloadPath("")

	assert.NoError(t, err) // Пустой путь просто игнорируется
}

func TestSaveDownloadPath_LimitPaths(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	// Создаем 10 путей
	paths := make([]string, 10)
	for i := 0; i < 10; i++ {
		paths[i] = fmt.Sprintf("/existing/path%d", i)
	}

	service.config = &domain.Config{
		DownloadPaths: paths,
	}

	newPath := "/new/path"
	err := service.SaveDownloadPath(newPath)

	assert.NoError(t, err)
	// Проверяем, что новый путь добавлен в начало, и список ограничен 10 путями
	assert.Equal(t, 10, len(service.config.DownloadPaths))
	assert.Equal(t, newPath, service.config.DownloadPaths[0])
	assert.NotContains(t, service.config.DownloadPaths, "/existing/path9") // Последний путь должен быть удален
}

func TestAddUniquePathsFromHistory_Empty(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: nil,
	}

	result := []string{"/path1"}
	updatedResult := service.addUniquePathsFromHistory(result)

	assert.Equal(t, result, updatedResult)
}

func TestAddUniquePathsFromHistory_WithDuplicates(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/path1", "/path2", "/path3"},
	}

	result := []string{"/path1"} // Дубликат в исходном списке
	updatedResult := service.addUniquePathsFromHistory(result)

	assert.Equal(t, []string{"/path1", "/path2", "/path3"}, updatedResult)
}

func TestGetDownloadPaths_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	paths, err := service.GetDownloadPaths()

	assert.Error(t, err)
	assert.Nil(t, paths)
	assert.Equal(t, ErrConfigNotInited, err.Error())
}

func TestGetDownloadPaths_EmptyConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{},
	}

	// Моделируем ситуацию, когда fetchPathFromClient возвращает успешный результат
	expectedPath := "/from/client"
	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil)

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Contains(t, paths, expectedPath)
	mockRepo.AssertExpectations(t)
}

func TestGetDownloadPaths_WithDefaultPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "/default/path",
		DownloadPaths:       []string{},
	}

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Contains(t, paths, "/default/path")
}

func TestGetDownloadPaths_FromClient(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{},
	}

	expectedPath := "/default/from/client/path"
	mockRepo.On("GetDefaultDownloadDir").Return(expectedPath, nil).Once()

	service.fetchDefaultPathIfEmpty() // Вызываем отдельно для обновления config

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Contains(t, paths, expectedPath)
	mockRepo.AssertExpectations(t)
}

func TestGetDownloadPaths_EmptyResult(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "",
		DownloadPaths:       []string{},
	}

	// Настраиваем мок на возврат ошибки для всех вызовов GetDefaultDownloadDir
	mockRepo.On("GetDefaultDownloadDir").Return("", fmt.Errorf("not available")).Times(2)

	paths, err := service.GetDownloadPaths()

	assert.NoError(t, err)
	assert.Empty(t, paths) // Результат должен быть пустым массивом
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/invalid/path", "/valid/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/valid/path",
	}

	mockRepo.On("ValidateDownloadPath", "/invalid/path").Return(fmt.Errorf("invalid path"))

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_NilTransaction(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	err := service.ValidatePathsTransaction(nil)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "transaction cannot be nil")
}

func TestValidatePathsTransaction_InvalidDefaultPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/valid/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/invalid/default/path",
	}

	mockRepo.On("ValidateDownloadPath", "/valid/path").Return(nil)
	mockRepo.On("ValidateDownloadPath", "/invalid/default/path").Return(fmt.Errorf("invalid path"))

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid default path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_DuplicatePaths(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path", "/new/path"}, // Дубликат
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/new/path",
	}

	mockRepo.On("ValidateDownloadPath", "/new/path").Return(nil)

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "duplicate path")
	mockRepo.AssertExpectations(t)
}

func TestValidatePathsTransaction_ConflictingPaths(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/path/to/add"},
		PathsToRemove: []string{"/path/to/add"}, // Конфликт с путем для добавления
		DefaultPath:   "",
	}

	mockRepo.On("ValidateDownloadPath", "/path/to/add").Return(nil)

	err := service.ValidatePathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "conflict: path")
	mockRepo.AssertExpectations(t)
}

func TestApplyPathsTransaction_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/old/path1", "/old/path2"},
		DefaultDownloadPath: "/old/path1",
	}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path"},
		PathsToRemove: []string{"/old/path1"},
		DefaultPath:   "/new/path",
	}

	mockRepo.On("ValidateDownloadPath", "/new/path").Return(nil)

	err := service.ApplyPathsTransaction(transaction)

	assert.NoError(t, err)
	assert.Contains(t, service.config.DownloadPaths, "/new/path")
	assert.NotContains(t, service.config.DownloadPaths, "/old/path1")
	assert.Equal(t, "/new/path", service.config.DefaultDownloadPath)
	mockRepo.AssertExpectations(t)
}

func TestApplyPathsTransaction_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/new/path"},
		PathsToRemove: []string{"/old/path"},
		DefaultPath:   "/new/path",
	}

	err := service.ApplyPathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), ErrConfigNotInited)
}

func TestApplyPathsTransaction_ValidationError(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/old/path1", "/old/path2"},
		DefaultDownloadPath: "/old/path1",
	}

	transaction := &domain.PathsTransaction{
		PathsToAdd:    []string{"/invalid/path"},
		PathsToRemove: []string{"/old/path1"},
		DefaultPath:   "/invalid/path",
	}

	// Мокируем ошибку валидации
	mockRepo.On("ValidateDownloadPath", "/invalid/path").Return(fmt.Errorf("validation error"))

	err := service.ApplyPathsTransaction(transaction)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "validation failed")
	mockRepo.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/old/path1", "/old/path2"},
		DefaultDownloadPath: "/old/path1",
		Host:                "old-host",
		Port:                9091,
	}

	newConfig := domain.ConnectionConfig{
		Host:           "new-host",
		Port:           9092,
		MaxUploadRatio: 2.0,
		SlowSpeedLimit: 50,
		SlowSpeedUnit:  "KiB/s",
	}

	pathsToAdd := []string{"/new/path"}
	pathsToRemove := []string{"/old/path1"}
	defaultPath := "/new/path"

	err := service.SaveSettingsWithPaths(newConfig, pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Equal(t, "new-host", service.config.Host)
	assert.Equal(t, 9092, service.config.Port)
	assert.Equal(t, 2.0, service.config.MaxUploadRatio)
	assert.Contains(t, service.config.DownloadPaths, "/new/path")
	assert.NotContains(t, service.config.DownloadPaths, "/old/path1")
	assert.Equal(t, "/new/path", service.config.DefaultDownloadPath)
}

func TestSaveSettingsWithPaths_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	config := domain.ConnectionConfig{
		Host: "localhost",
		Port: 9091,
	}

	err := service.SaveSettingsWithPaths(config, []string{}, []string{}, "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), ErrConfigNotInited)
}

func TestGetTorrentDownloadDirectory_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2", "/path3"},
		DefaultDownloadPath: "/path2",
	}

	err := service.RemoveDownloadPath("/path1")

	assert.NoError(t, err)
	assert.Equal(t, []string{"/path2", "/path3"}, service.config.DownloadPaths)
}

func TestRemoveDownloadPath_DefaultPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2"},
		DefaultDownloadPath: "/path1",
	}

	err := service.RemoveDownloadPath("/path1")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cannot remove default download path")
	assert.Equal(t, []string{"/path1", "/path2"}, service.config.DownloadPaths)
}

func TestRemoveDownloadPath_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	err := service.RemoveDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
}

func TestRemoveDownloadPath_PathNotFound(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2"},
		DefaultDownloadPath: "/path2",
	}

	// Пытаемся удалить путь, которого нет в списке
	err := service.RemoveDownloadPath("/non/existent/path")

	// Должен вернуть nil, так как удаление несуществующего пути не считается ошибкой
	assert.NoError(t, err)
	// Список путей не должен измениться
	assert.Equal(t, []string{"/path1", "/path2"}, service.config.DownloadPaths)
}

func TestSetFilesWanted_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	expectedStats := &domain.SessionStats{
		TotalDownloadSpeed:  1024,
		TotalUploadSpeed:    512,
		FreeSpace:           1073741824, // 1 GB
		TransmissionVersion: "2.94",
	}

	mockRepo.On("GetSessionStats").Return(expectedStats, nil)

	stats, err := service.GetSessionStats()

	assert.NoError(t, err)
	assert.Equal(t, expectedStats, stats)
	mockRepo.AssertExpectations(t)
}

func TestGetTorrents(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/existing/path"},
	}

	newPath := "/new/default/path"
	mockRepo.On("ValidateDownloadPath", newPath).Return(nil)

	err := service.SetDefaultDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Equal(t, newPath, service.config.DefaultDownloadPath)
	assert.Contains(t, service.config.DownloadPaths, newPath)
	mockRepo.AssertExpectations(t)
}

func TestSetDefaultDownloadPath_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	err := service.SetDefaultDownloadPath("/some/path")

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath")
}

func TestSetDefaultDownloadPath_EmptyPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{}

	err := service.SetDefaultDownloadPath("")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "path cannot be empty")
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath")
}

func TestSetDefaultDownloadPath_InvalidPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{}
	invalidPath := "/invalid/path"

	mockRepo.On("ValidateDownloadPath", invalidPath).Return(fmt.Errorf("invalid path"))

	err := service.SetDefaultDownloadPath(invalidPath)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid path")
	mockRepo.AssertExpectations(t)
}

func TestAddTorrentFile_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	downloadDir := "/test/path"
	filePath := "/tmp/test.torrent"

	// Настраиваем моки
	mockRepo.On("ValidateDownloadPath", downloadDir).Return(nil)
	mockRepo.On("AddFile", filePath, downloadDir).Return(nil)

	err := service.AddTorrentFile(filePath, downloadDir)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestAddTorrentFile_InvalidPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	invalidPath := "/invalid/path"
	filePath := "/tmp/test.torrent"

	// Путь не проходит валидацию
	mockRepo.On("ValidateDownloadPath", invalidPath).Return(fmt.Errorf("invalid path"))

	err := service.AddTorrentFile(filePath, invalidPath)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid download path")
	mockRepo.AssertExpectations(t)
}

func TestAddTorrentFile_EmptyPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	filePath := "/tmp/test.torrent"
	downloadDir := ""

	// Проверяем, что мы валидируем пустой путь перед добавлением торрента
	err := service.AddTorrentFile(filePath, downloadDir)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid download path")
}

func TestFetchPathFromClient_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	mockRepo.On("GetDefaultDownloadDir").Return("", fmt.Errorf("connection error"))

	resultPath := service.fetchPathFromClient()

	assert.Equal(t, "", resultPath)
	mockRepo.AssertExpectations(t)
}

func TestSavePaths_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2", "/path3"},
		DefaultDownloadPath: "/path1",
	}

	pathsToAdd := []string{"/new/path"}
	pathsToRemove := []string{"/path2"}
	defaultPath := "/new/path"

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.NoError(t, err)
	assert.Contains(t, service.config.DownloadPaths, "/new/path")
	assert.NotContains(t, service.config.DownloadPaths, "/path2")
	assert.Equal(t, defaultPath, service.config.DefaultDownloadPath)
}

func TestSavePaths_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	pathsToAdd := []string{"/new/path"}
	pathsToRemove := []string{"/path2"}
	defaultPath := "/new/path"

	err := service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
}

func TestGetPathsState_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths:       []string{"/path1", "/path2"},
		DefaultDownloadPath: "/path1",
	}

	state, err := service.GetPathsState()

	assert.NoError(t, err)
	assert.Equal(t, "/path1", state.DefaultPath)
	assert.Equal(t, []string{"/path1", "/path2"}, state.Paths)
}

func TestGetPathsState_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	state, err := service.GetPathsState()

	assert.Error(t, err)
	assert.Equal(t, ErrConfigNotInited, err.Error())
	assert.Nil(t, state)
}

func TestFetchDefaultPathIfEmpty_NotEmpty(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DefaultDownloadPath: "/existing/default/path",
	}

	resultPath := service.fetchDefaultPathIfEmpty()

	assert.Equal(t, "/existing/default/path", resultPath)
}

func TestFetchDefaultPathIfEmpty_GetFromDefault(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
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

func TestValidateDownloadPath_EmptyPath(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	err := service.ValidateDownloadPath("")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "download path cannot be empty")
}

func TestValidateDownloadPath_InvalidFormat(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	// В реальной системе это может быть путь с неправильным форматом,
	// но для теста достаточно проверить, что метод validate вызывается
	invalidPath := "/invalid/path"
	mockRepo.On("ValidateDownloadPath", invalidPath).Return(fmt.Errorf("invalid path format"))

	err := service.ValidateDownloadPath(invalidPath)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid path format")
	mockRepo.AssertExpectations(t)
}

func TestValidateDownloadPath_Success(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	validPath := "/valid/path"
	mockRepo.On("ValidateDownloadPath", validPath).Return(nil)

	err := service.ValidateDownloadPath(validPath)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestConvertSpeedToKBps(t *testing.T) {
	// Тест для KiB/s (без конвертации)
	result := convertSpeedToKBps(50, "KiB/s")
	assert.Equal(t, int64(50), result)

	// Тест для MiB/s (с конвертацией)
	result = convertSpeedToKBps(2, "MiB/s")
	assert.Equal(t, int64(2048), result)

	// Тест для нестандартного значения (должен возвращать как есть)
	result = convertSpeedToKBps(100, "unknown")
	assert.Equal(t, int64(100), result)
}
