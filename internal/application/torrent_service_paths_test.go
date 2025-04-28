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

func TestValidateDownloadPath_DetailedErrors(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{}

	tests := []struct {
		name          string
		path          string
		mockError     error
		expectedError string
	}{
		{
			name:          "Empty path",
			path:          "",
			expectedError: "download path cannot be empty",
		},
		{
			name:          "Permission denied",
			path:          "/protected/path",
			mockError:     errors.New("permission denied"),
			expectedError: "permission denied",
		},
		{
			name:          "Path not found",
			path:          "/nonexistent/path",
			mockError:     errors.New("path not found"),
			expectedError: "path not found",
		},
		{
			name:          "Invalid path format",
			path:          "\\invalid\\path",
			mockError:     errors.New("invalid path format"),
			expectedError: "invalid path format",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.mockError != nil {
				mockRepo.On("ValidateDownloadPath", mock.AnythingOfType("string")).Return(tt.mockError).Once()
			}

			err := service.ValidateDownloadPath(tt.path)

			assert.Error(t, err)
			assert.Contains(t, err.Error(), tt.expectedError)
			mockRepo.AssertExpectations(t)
		})
	}
}

func TestValidateDownloadPath_NilConfig(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	// Намеренно не устанавливаем config

	err := service.ValidateDownloadPath("/some/path")

	assert.ErrorIs(t, err, ErrConfigNotInited)
	mockRepo.AssertNotCalled(t, "ValidateDownloadPath", mock.Anything)
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

func TestCreateUpdatedPathsList_EdgeCases(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)
	service.config = &domain.Config{
		DownloadPaths: []string{"/existing1", "/existing2", "/existing3"},
	}

	tests := []struct {
		name          string
		pathsToAdd    []string
		pathsToRemove []string
		defaultPath   string
		expected      []string
	}{
		{
			name:          "Handle duplicates in pathsToAdd",
			pathsToAdd:    []string{"/new1", "/new1", "/new2"},
			pathsToRemove: nil,
			defaultPath:   "",
			expected:      []string{"/new1", "/new2", "/existing1", "/existing2", "/existing3"},
		},
		{
			name:          "Handle empty paths",
			pathsToAdd:    []string{"", "/new1", ""},
			pathsToRemove: nil,
			defaultPath:   "",
			expected:      []string{"/new1", "/existing1", "/existing2", "/existing3"},
		},
		{
			name:          "Remove and add same path",
			pathsToAdd:    []string{"/existing1"},
			pathsToRemove: []string{"/existing1"},
			defaultPath:   "",
			expected:      []string{"/existing2", "/existing3"},
		},
		{
			name:          "Limit to 10 paths",
			pathsToAdd:    []string{"/1", "/2", "/3", "/4", "/5", "/6", "/7", "/8", "/9", "/10", "/11"},
			pathsToRemove: nil,
			defaultPath:   "",
			expected:      []string{"/1", "/2", "/3", "/4", "/5", "/6", "/7", "/8", "/9", "/10"},
		},
		{
			name:          "Default path always included",
			pathsToAdd:    []string{"/new1"},
			pathsToRemove: []string{"/default"},
			defaultPath:   "/default",
			expected:      []string{"/new1", "/default", "/existing1", "/existing2", "/existing3"},
		},
		{
			name:          "Remove all existing paths",
			pathsToAdd:    nil,
			pathsToRemove: []string{"/existing1", "/existing2", "/existing3"},
			defaultPath:   "",
			expected:      []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.createUpdatedPathsList(tt.pathsToAdd, tt.pathsToRemove, tt.defaultPath)
			assert.Equal(t, tt.expected, result, "Paths list mismatch")
		})
	}
}
