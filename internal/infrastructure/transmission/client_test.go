package transmission

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestNewTransmissionClient проверяет создание нового клиента Transmission
func TestNewTransmissionClient(t *testing.T) {
	t.Run("ValidConfig", func(t *testing.T) {
		config := TransmissionConfig{
			Host: "localhost",
			Port: 9091,
		}
		client, err := NewTransmissionClient(config)
		assert.NoError(t, err)
		assert.NotNil(t, client)
		assert.NotNil(t, client.client)
		assert.NotNil(t, client.ctx)
	})

	t.Run("ValidConfigWithCredentials", func(t *testing.T) {
		config := TransmissionConfig{
			Host:     "http://192.168.1.100",
			Port:     9091,
			Username: "user",
			Password: "password",
		}
		client, err := NewTransmissionClient(config)
		assert.NoError(t, err)
		assert.NotNil(t, client)
		// Дополнительные проверки можно добавить, если библиотека позволяет инспектировать URL
	})

	t.Run("ValidConfigHTTPS", func(t *testing.T) {
		config := TransmissionConfig{
			Host: "https://secure.host.com/transmission/web/", // Проверяем очистку path
			Port: 443,
		}
		client, err := NewTransmissionClient(config)
		assert.NoError(t, err)
		assert.NotNil(t, client)
		// Дополнительные проверки можно добавить, если библиотека позволяет инспектировать URL
	})

	// Тесты на невалидные конфигурации (например, пустой хост) можно добавить позже,
	// если библиотека transmissionrpc не обрабатывает это сама.
}

// TestValidatePath проверяет функцию валидации пути
func TestValidatePath(t *testing.T) {
	// Создаем временный экземпляр клиента, т.к. validatePath - метод
	// Для этого теста сам клиент не используется, важен только вызов метода
	dummyClient := &TransmissionClient{}

	t.Run("EmptyPath", func(t *testing.T) {
		_, err := dummyClient.validatePath("")
		assert.Error(t, err)
		localizedErr, ok := err.(*LocalizedError)
		assert.True(t, ok)
		assert.Equal(t, "errors.emptyPath", localizedErr.key)
	})

	t.Run("WindowsVolumePath", func(t *testing.T) {
		path := `C:\Downloads`
		validatedPath, err := dummyClient.validatePath(path)
		assert.NoError(t, err)
		assert.Equal(t, path, validatedPath)
	})

	t.Run("UNCPath", func(t *testing.T) {
		path := `\\server\share\folder`
		validatedPath, err := dummyClient.validatePath(path)
		assert.NoError(t, err)
		assert.Equal(t, path, validatedPath)
	})

	t.Run("TildeExpansion", func(t *testing.T) {
		home, err := os.UserHomeDir()
		assert.NoError(t, err, "Failed to get user home directory") // Убедимся, что home dir доступен

		path := "~/Downloads"
		expectedPath := filepath.Join(home, "Downloads")
		validatedPath, err := dummyClient.validatePath(path)
		assert.NoError(t, err)
		assert.Equal(t, expectedPath, validatedPath)
	})

	t.Run("TildeExpansionError", func(t *testing.T) {
		// Моделируем ситуацию, когда не удается получить home dir
		originalHome := os.Getenv("HOME")
		os.Unsetenv("HOME") // Удаляем переменную окружения HOME
		// На Windows может потребоваться изменить USERPROFILE
		originalUserProfile := os.Getenv("USERPROFILE")
		os.Unsetenv("USERPROFILE")

		defer func() {
			os.Setenv("HOME", originalHome) // Восстанавливаем
			os.Setenv("USERPROFILE", originalUserProfile)
		}()

		path := "~/Downloads"
		_, err := dummyClient.validatePath(path)
		assert.Error(t, err)
		localizedErr, ok := err.(*LocalizedError)
		assert.True(t, ok)
		assert.Equal(t, "errors.invalidPath", localizedErr.key)
	})

	t.Run("AbsolutePath", func(t *testing.T) {
		path := "/usr/local/downloads"
		validatedPath, err := dummyClient.validatePath(path)
		assert.NoError(t, err)
		assert.Equal(t, path, validatedPath)
	})

	t.Run("RelativePath", func(t *testing.T) {
		path := "my_downloads"
		validatedPath, err := dummyClient.validatePath(path)
		assert.NoError(t, err)
		assert.Equal(t, path, validatedPath) // validatePath не преобразует относительные пути
	})
}

// TODO: Добавить тесты для ValidateDownloadPath с использованием моков
