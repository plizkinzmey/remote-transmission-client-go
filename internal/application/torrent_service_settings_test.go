package application

import (
	"errors"
	"testing"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure/transmission"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSaveSettingsWithPaths_Success(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalPaths := []string{"/old/path1", "/old/path2"}
	originalDefault := "/old/path1"
	service.config = &domain.Config{
		DownloadPaths:       append([]string{}, originalPaths...),
		DefaultDownloadPath: originalDefault,
		Host:                "oldhost",
		Port:                9090,
	}

	newSettings := domain.ConnectionConfig{
		Host:           "newhost",
		Port:           9091,
		MaxUploadRatio: 2.5,
	}

	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return cfg.Host == newSettings.Host &&
			cfg.Port == newSettings.Port &&
			cfg.MaxUploadRatio == 2.5
	})).Return(nil)

	err := service.SaveSettingsWithPaths(newSettings, []string{"/new"}, []string{"/old"}, "/new")

	assert.NoError(t, err)
	assert.Equal(t, newSettings.Host, service.config.Host)
	assert.Equal(t, newSettings.Port, service.config.Port)
	assert.Equal(t, newSettings.MaxUploadRatio, service.config.MaxUploadRatio)
	mockRepo.AssertExpectations(t)
	mockCfgSvc.AssertExpectations(t)
}

func TestSaveSettingsWithPaths_SaveError(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	originalConfig := &domain.Config{
		Host:                "oldhost",
		Port:                9090,
		DownloadPaths:       []string{"/old"},
		DefaultDownloadPath: "/old",
		MaxUploadRatio:      1.0,
	}
	service.config = originalConfig

	newSettings := domain.ConnectionConfig{
		Host:           "newhost",
		Port:           9091,
		MaxUploadRatio: 2.5,
	}

	saveError := errors.New("save failed")
	mockRepo.On("ValidateDownloadPath", "/new").Return(nil)
	mockCfgSvc.On("SaveConfig", mock.AnythingOfType("*domain.Config")).Return(saveError)

	err := service.SaveSettingsWithPaths(newSettings, []string{"/new"}, []string{"/old"}, "/new")

	assert.Error(t, err)
	assert.ErrorIs(t, err, saveError)
	assert.Equal(t, originalConfig.Host, service.config.Host)
	assert.Equal(t, originalConfig.Port, service.config.Port)
	assert.Equal(t, originalConfig.MaxUploadRatio, service.config.MaxUploadRatio)
	assert.Equal(t, originalConfig.DownloadPaths, service.config.DownloadPaths)
	assert.Equal(t, originalConfig.DefaultDownloadPath, service.config.DefaultDownloadPath)
}

func TestSaveSettingsWithPaths_ConnectionChange(t *testing.T) {
	mockRepo, mockCfgSvc := setupMocks(t)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		Host:           "oldhost",
		Port:           9090,
		MaxUploadRatio: 1.0,
	}

	newSettings := domain.ConnectionConfig{
		Host:           "newhost",
		Port:           9091,
		MaxUploadRatio: 2.5,
	}

	mockCfgSvc.On("SaveConfig", mock.MatchedBy(func(cfg *domain.Config) bool {
		return cfg.Host == newSettings.Host && cfg.Port == newSettings.Port
	})).Return(nil)

	newMockRepo := new(MockTransmissionClient)
	transmissionClientFactoryImpl = func(config transmission.TransmissionConfig) (domain.TorrentRepository, error) {
		return newMockRepo, nil
	}

	err := service.SaveSettingsWithPaths(newSettings, nil, nil, "")

	assert.NoError(t, err)
	assert.Equal(t, newSettings.Host, service.config.Host)
	assert.Equal(t, newSettings.Port, service.config.Port)
	assert.Equal(t, newSettings.MaxUploadRatio, service.config.MaxUploadRatio)
}