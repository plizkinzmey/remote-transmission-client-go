package application

import (
	"errors"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSaveDownloadPath_Success(t *testing.T) {
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

func TestSetDefaultDownloadPath_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		DownloadPaths: []string{"/existing/path"},
	}
	newPath := "/new/default/path"

	mockRepo.On("ValidateDownloadPath", newPath).Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(nil)

	err := service.SetDefaultDownloadPath(newPath)

	assert.NoError(t, err)
	assert.Equal(t, newPath, service.config.DefaultDownloadPath)
	assert.Contains(t, service.config.DownloadPaths, newPath)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}