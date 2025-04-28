package application

import (
	"errors"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

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
	service := &TorrentService{} // No config service
	paths, err := service.GetDownloadPaths()
	assert.Error(t, err)
	assert.Nil(t, paths)
	assert.EqualError(t, err, "config is not initialized") // Corrected assertion
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

func TestGetPathsState(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	expectedPaths := []string{"/path1", "/path2"}
	expectedDefault := "/path1"
	service.config = &domain.Config{
		DownloadPaths:       expectedPaths,
		DefaultDownloadPath: expectedDefault,
	}

	state, err := service.GetPathsState()

	assert.NoError(t, err)
	require.NotNil(t, state)
	assert.Equal(t, expectedPaths, state.Paths)
	assert.Equal(t, expectedDefault, state.DefaultPath)
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
