package transmission

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/hekmon/cunits/v2" // Импортируем пакет для типа Bits
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
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
		// Используем assert.ErrorAs для проверки типа ошибки, если LocalizedError экспортирован
		// или проверяем текст ошибки, если он не экспортирован
		var localizedErr *LocalizedError // Предполагаем, что LocalizedError определен в errors.go
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.emptyPath", localizedErr.key)
		}
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
		// Используем assert.ErrorAs
		var localizedErr *LocalizedError
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.invalidPath", localizedErr.key)
		}
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

// TestValidateDownloadPath проверяет ValidateDownloadPath с моком для FreeSpace
func TestValidateDownloadPath(t *testing.T) {
	ctx := context.Background()

	t.Run("ValidPathAndAccessible", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "/downloads/valid"
		parentDir := filepath.Dir(testPath)

		// Настраиваем мок на успешный ответ, используя cunits.Bits
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*8), cunits.Bits(2048*1024*8), nil).Once()

		err := client.ValidateDownloadPath(testPath)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t) // Проверяем, что мок был вызван
	})

	t.Run("InvalidPathFormat", func(t *testing.T) {
		mockRPC := new(MockRPCClient) // Мок не будет вызван
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "" // Пустой путь

		err := client.ValidateDownloadPath(testPath)
		assert.Error(t, err)
		var localizedErr *LocalizedError
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.emptyPath", localizedErr.key)
		}
		mockRPC.AssertNotCalled(t, "FreeSpace", mock.Anything, mock.Anything) // Убедимся, что FreeSpace не вызывался
	})

	t.Run("PermissionDenied", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "/restricted/path"
		parentDir := filepath.Dir(testPath)

		// ИСПРАВЛЕНО: Используем строку "permission denied" (маленькая 'p')
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(0), cunits.Bits(0), errors.New("some error "+"permission denied")).Once()

		err := client.ValidateDownloadPath(testPath)
		assert.Error(t, err)
		var localizedErr *LocalizedError
		// Теперь эта проверка должна пройти, т.к. checkAccessibility вернет правильный ключ
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.directoryAccessDenied", localizedErr.key)
		}
		mockRPC.AssertExpectations(t)
	})

	t.Run("NoSuchFileOrDirectory", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "/nonexistent/parent/path"
		parentDir := filepath.Dir(testPath)

		// Используем строки напрямую (убедимся, что совпадает с errors.go)
		// В errors.go: errNoSuchFileOrDirectory = "No such file or directory"
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(0), cunits.Bits(0), errors.New("No such file or directory"+" details")).Once()

		err := client.ValidateDownloadPath(testPath)
		assert.Error(t, err)
		var localizedErr *LocalizedError
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.parentDirectoryNotExists", localizedErr.key)
		}
		mockRPC.AssertExpectations(t)
	})

	t.Run("OtherAccessibilityError", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "/some/other/issue"
		parentDir := filepath.Dir(testPath)

		// Настраиваем мок на возврат другой ошибки
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(0), cunits.Bits(0), errors.New("generic network error")).Once()

		err := client.ValidateDownloadPath(testPath)
		assert.Error(t, err)
		var localizedErr *LocalizedError
		if assert.ErrorAs(t, err, &localizedErr) {
			assert.Equal(t, "errors.directoryNotAccessible", localizedErr.key)
		}
		mockRPC.AssertExpectations(t)
	})

	t.Run("TildeExpansionAndAccessible", func(t *testing.T) {
		home, homeErr := os.UserHomeDir()
		assert.NoError(t, homeErr, "Failed to get user home directory for test setup")

		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		testPath := "~/downloads/valid_tilde"
		expectedValidatedPath := filepath.Join(home, "downloads/valid_tilde")
		parentDir := filepath.Dir(expectedValidatedPath)

		// Настраиваем мок на успешный ответ для развернутого пути
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*8), cunits.Bits(2048*1024*8), nil).Once()

		err := client.ValidateDownloadPath(testPath)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})
}
