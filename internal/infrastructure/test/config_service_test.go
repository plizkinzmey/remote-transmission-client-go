package test

import (
	"os"
	"path/filepath"
	"testing"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"

	"github.com/stretchr/testify/assert"
)

func TestConfigService(t *testing.T) {
	// Создаем временную директорию для тестов
	tempDir, err := os.MkdirTemp("", "config-test")
	if err != nil {
		t.Fatalf("не удалось создать временную директорию: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Устанавливаем переменную окружения на временную директорию
	oldConfigDir := os.Getenv("CONFIG_DIR")
	os.Setenv("CONFIG_DIR", tempDir)
	defer os.Setenv("CONFIG_DIR", oldConfigDir)

	// Инициализируем сервис
	configService := infrastructure.NewConfigService()

	// Тестовая конфигурация
	testConfig := &domain.Config{
		Host:           "localhost",
		Port:           9091,
		Username:       "test",
		Password:       "password",
		Language:       "ru",
		Theme:          "dark",
		MaxUploadRatio: 1.5,
		SlowSpeedLimit: 50,
		SlowSpeedUnit:  "KiB/s",
	}

	// Тест сохранения конфигурации
	t.Run("SaveConfig", func(t *testing.T) {
		err := configService.SaveConfig(testConfig)
		assert.NoError(t, err)

		// Проверяем, существует ли файл конфигурации
		configPath := filepath.Join(tempDir, "config.json")
		_, err = os.Stat(configPath)
		assert.NoError(t, err, "файл конфигурации должен существовать")
	})

	// Тест загрузки конфигурации
	t.Run("LoadConfig", func(t *testing.T) {
		loadedConfig, err := configService.LoadConfig()
		assert.NoError(t, err)
		assert.NotNil(t, loadedConfig)
		assert.Equal(t, testConfig.Host, loadedConfig.Host)
		assert.Equal(t, testConfig.Port, loadedConfig.Port)
		assert.Equal(t, testConfig.Username, loadedConfig.Username)
		assert.Equal(t, testConfig.Language, loadedConfig.Language)
		assert.Equal(t, testConfig.Theme, loadedConfig.Theme)
		assert.Equal(t, testConfig.MaxUploadRatio, loadedConfig.MaxUploadRatio)
		assert.Equal(t, testConfig.SlowSpeedLimit, loadedConfig.SlowSpeedLimit)
		assert.Equal(t, testConfig.SlowSpeedUnit, loadedConfig.SlowSpeedUnit)

		// Пароль должен быть зашифрован и не совпадать с исходным
		assert.NotEqual(t, testConfig.Password, loadedConfig.Password)
	})
}
