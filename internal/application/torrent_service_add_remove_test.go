package application

import (
	"errors"
	"fmt"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

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
	assert.Contains(t, err.Error(), "invalid download path")
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
}

func TestAddTorrentFile_EmptyDownloadDir(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	filePath := "/tmp/test.torrent"
	downloadDir := ""

	err := service.AddTorrentFile(filePath, downloadDir)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "download path cannot be empty")
	assert.Contains(t, err.Error(), "invalid download path")
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertNotCalled(t, "SaveConfig", mock.Anything)
	mockRepo.AssertNotCalled(t, "AddFile", mock.Anything, mock.Anything)
}
