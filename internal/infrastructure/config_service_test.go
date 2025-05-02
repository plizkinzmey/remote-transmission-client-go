package infrastructure

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockEncryptionService is a mock type for the EncryptionService type
// Убедимся, что MockEncryptionService реализует IEncryptionService
var _ IEncryptionService = (*MockEncryptionService)(nil)

type MockEncryptionService struct {
	mock.Mock
}

// EncryptConfig mocks the EncryptConfig method
func (m *MockEncryptionService) EncryptConfig(config interface{}) (string, error) {
	args := m.Called(config)
	return args.String(0), args.Error(1)
}

// DecryptConfig mocks the DecryptConfig method
func (m *MockEncryptionService) DecryptConfig(encryptedData string, config interface{}) error {
	args := m.Called(encryptedData, config)
	// Simulate unmarshalling into the passed config object if successful
	if args.Error(0) == nil && encryptedData == "valid_encrypted_data" {
		if cfg, ok := config.(*domain.Config); ok {
			*cfg = domain.Config{Host: "decrypted_host"}
		}
	}
	return args.Error(0)
}

// --- Функция для установки моков OS ---
func setupOSMocks(t *testing.T) {
	t.Helper()
	// Сохраняем оригинальные функции
	originalUserConfigDir := osUserConfigDir
	originalStat := osStat
	originalReadFile := osReadFile
	originalMkdirAll := osMkdirAll
	originalWriteFile := osWriteFile
	originalMarshalIndent := jsonMarshalIndent

	// Сбрасываем на значения по умолчанию перед каждым тестом (если нужно)
	osUserConfigDir = os.UserConfigDir
	osStat = os.Stat
	osReadFile = os.ReadFile
	osMkdirAll = os.MkdirAll
	osWriteFile = os.WriteFile
	jsonMarshalIndent = json.MarshalIndent

	// Регистрируем очистку
	t.Cleanup(func() {
		osUserConfigDir = originalUserConfigDir
		osStat = originalStat
		osReadFile = originalReadFile
		osMkdirAll = originalMkdirAll
		osWriteFile = originalWriteFile
		jsonMarshalIndent = originalMarshalIndent
	})
}

func TestNewConfigService(t *testing.T) {
	service := NewConfigService()
	assert.NotNil(t, service)
	assert.NotNil(t, service.encryptionService, "EncryptionService should be initialized")
	assert.NotNil(t, service.pathGetter, "pathGetter should be initialized")
}

func TestConfigExists(t *testing.T) {
	setupOSMocks(t)
	mockEncryption := new(MockEncryptionService) // Не используется, но нужен для создания сервиса
	testPath := "/fake/config/dir/transmission-client/config.json"

	service := &ConfigService{
		encryptionService: mockEncryption,
		pathGetter: func() (string, error) {
			return testPath, nil
		},
	}

	t.Run("Exists", func(t *testing.T) {
		osStat = func(name string) (os.FileInfo, error) {
			assert.Equal(t, testPath, name)
			return nil, nil // Файл существует, ошибки нет
		}
		exists, err := service.ConfigExists()
		assert.NoError(t, err)
		assert.True(t, exists)
	})

	t.Run("NotExists", func(t *testing.T) {
		osStat = func(name string) (os.FileInfo, error) {
			assert.Equal(t, testPath, name)
			return nil, os.ErrNotExist // Файл не существует
		}
		exists, err := service.ConfigExists()
		assert.NoError(t, err) // ErrNotExist не является ошибкой для этой функции
		assert.False(t, exists)
	})

	t.Run("StatError", func(t *testing.T) {
		statErr := errors.New("permission denied")
		osStat = func(name string) (os.FileInfo, error) {
			assert.Equal(t, testPath, name)
			return nil, statErr // Другая ошибка Stat
		}
		exists, err := service.ConfigExists()
		assert.ErrorIs(t, err, statErr)
		assert.False(t, exists)
	})

	t.Run("PathGetterError", func(t *testing.T) {
		pathErr := errors.New("cannot get path")
		serviceWithPathError := &ConfigService{
			encryptionService: mockEncryption,
			pathGetter: func() (string, error) {
				return "", pathErr
			},
		}
		exists, err := serviceWithPathError.ConfigExists()
		assert.ErrorIs(t, err, pathErr)
		assert.False(t, exists)
	})
}

func TestLoadConfig(t *testing.T) {
	setupOSMocks(t)
	mockEncryption := new(MockEncryptionService)
	testPath := "/fake/load/config.json"

	service := &ConfigService{
		encryptionService: mockEncryption,
		pathGetter: func() (string, error) {
			return testPath, nil
		},
	}

	t.Run("Success_NewFormat", func(t *testing.T) {
		encryptedData := "valid_encrypted_data"
		configFormat := ConfigFormat{EncryptedData: encryptedData}
		jsonData, _ := json.Marshal(configFormat)

		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) {
			assert.Equal(t, testPath, name)
			return jsonData, nil
		}
		mockEncryption.On("DecryptConfig", encryptedData, mock.AnythingOfType("*domain.Config")).Return(nil).Once()

		config, err := service.LoadConfig()
		assert.NoError(t, err)
		require.NotNil(t, config)
		assert.Equal(t, "decrypted_host", config.Host) // Значение из мока DecryptConfig
		mockEncryption.AssertExpectations(t)
	})

	t.Run("Success_OldFormat", func(t *testing.T) {
		// Сбрасываем ожидания мока перед этим тестом
		mockEncryption.ExpectedCalls = nil
		mockEncryption.Calls = nil

		oldConfig := domain.Config{Host: "old_host", Port: 9091}
		jsonData, _ := json.Marshal(oldConfig)

		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) { return jsonData, nil }
		// DecryptConfig не должен вызываться

		config, err := service.LoadConfig()
		assert.NoError(t, err)
		require.NotNil(t, config)
		assert.Equal(t, "old_host", config.Host)
		assert.Equal(t, 9091, config.Port)
		mockEncryption.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
	})

	t.Run("NotExist", func(t *testing.T) {
		osStat = func(name string) (os.FileInfo, error) { return nil, os.ErrNotExist }
		config, err := service.LoadConfig()
		assert.ErrorIs(t, err, ErrConfigNotExists)
		assert.Nil(t, config)
	})

	t.Run("StatError", func(t *testing.T) {
		statErr := errors.New("stat permission error")
		osStat = func(name string) (os.FileInfo, error) { return nil, statErr }
		config, err := service.LoadConfig()
		// Ошибка Stat (кроме NotExist) должна приводить к ошибке чтения файла позже
		assert.Error(t, err)
		assert.Nil(t, config)
	})

	t.Run("ReadFileError", func(t *testing.T) {
		readErr := errors.New("read error")
		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) { return nil, readErr }
		config, err := service.LoadConfig()
		assert.ErrorIs(t, err, readErr)
		assert.ErrorContains(t, err, "failed to read config file")
		assert.Nil(t, config)
	})

	t.Run("ParseError_NewFormat", func(t *testing.T) {
		invalidJsonData := []byte(`{"encryptedData": "abc",}`) // Невалидный JSON
		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) { return invalidJsonData, nil }
		config, err := service.LoadConfig()
		assert.Error(t, err)
		assert.ErrorContains(t, err, "failed to parse config file")
		assert.Nil(t, config)
	})

	t.Run("EmptyEncryptedData", func(t *testing.T) {
		configFormat := ConfigFormat{EncryptedData: ""}
		jsonData, _ := json.Marshal(configFormat)
		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) { return jsonData, nil }
		config, err := service.LoadConfig()
		assert.NoError(t, err) // Не ошибка, просто нет данных
		// Ожидаем пустую структуру, а не nil
		assert.Equal(t, &domain.Config{}, config)
	})

	t.Run("DecryptError", func(t *testing.T) {
		encryptedData := "invalid_encrypted_data"
		configFormat := ConfigFormat{EncryptedData: encryptedData}
		jsonData, _ := json.Marshal(configFormat)
		decryptErr := errors.New("decryption failed")

		osStat = func(name string) (os.FileInfo, error) { return nil, nil }
		osReadFile = func(name string) ([]byte, error) { return jsonData, nil }
		mockEncryption.On("DecryptConfig", encryptedData, mock.AnythingOfType("*domain.Config")).Return(decryptErr).Once()

		config, err := service.LoadConfig()
		assert.ErrorIs(t, err, decryptErr)
		assert.ErrorContains(t, err, "failed to decrypt config")
		assert.Nil(t, config)
		mockEncryption.AssertExpectations(t)
	})

	t.Run("PathGetterError", func(t *testing.T) {
		pathErr := errors.New("path error")
		serviceWithPathError := &ConfigService{
			encryptionService: mockEncryption,
			pathGetter: func() (string, error) {
				return "", pathErr
			},
		}
		config, err := serviceWithPathError.LoadConfig()
		assert.ErrorIs(t, err, pathErr)
		assert.ErrorContains(t, err, "failed to determine config path")
		assert.Nil(t, config)
	})
}

func TestSaveConfig(t *testing.T) {
	setupOSMocks(t)
	mockEncryption := new(MockEncryptionService)
	testPath := "/fake/save/config.json"
	testDir := filepath.Dir(testPath)
	configToSave := &domain.Config{Host: "test-host"}
	encryptedData := "encrypted_config_data"
	var writtenData []byte

	service := &ConfigService{
		encryptionService: mockEncryption,
		pathGetter: func() (string, error) {
			return testPath, nil
		},
	}

	// Сбрасываем writtenData перед каждым подтестом
	resetWrittenData := func() { writtenData = nil }

	t.Run("Success", func(t *testing.T) {
		resetWrittenData()
		mkdirCalled := false
		writeFileCalled := false

		osMkdirAll = func(path string, perm os.FileMode) error {
			assert.Equal(t, testDir, path)
			assert.Equal(t, os.FileMode(0700), perm)
			mkdirCalled = true
			return nil
		}
		mockEncryption.On("EncryptConfig", configToSave).Return(encryptedData, nil).Once()
		osWriteFile = func(name string, data []byte, perm os.FileMode) error {
			assert.Equal(t, testPath, name)
			assert.Equal(t, os.FileMode(0600), perm)
			writtenData = data
			writeFileCalled = true
			return nil
		}

		err := service.SaveConfig(configToSave)
		assert.NoError(t, err)
		assert.True(t, mkdirCalled, "os.MkdirAll should be called")
		assert.True(t, writeFileCalled, "os.WriteFile should be called")

		// Проверяем содержимое записанных данных
		var savedFormat ConfigFormat
		err = json.Unmarshal(writtenData, &savedFormat)
		require.NoError(t, err)
		assert.Equal(t, encryptedData, savedFormat.EncryptedData)

		mockEncryption.AssertExpectations(t)
	})

	t.Run("PathGetterError", func(t *testing.T) {
		resetWrittenData()
		pathErr := errors.New("path error")
		serviceWithPathError := &ConfigService{
			encryptionService: mockEncryption,
			pathGetter: func() (string, error) {
				return "", pathErr
			},
		}
		err := serviceWithPathError.SaveConfig(configToSave)
		assert.ErrorIs(t, err, pathErr)
		assert.ErrorContains(t, err, "failed to determine config path")
	})

	t.Run("MkdirError", func(t *testing.T) {
		resetWrittenData()
		// Сбрасываем ожидания мока перед этим тестом
		mockEncryption.ExpectedCalls = nil
		mockEncryption.Calls = nil

		mkdirErr := errors.New("mkdir failed")
		osMkdirAll = func(path string, perm os.FileMode) error {
			return mkdirErr
		}
		// EncryptConfig и WriteFile не должны вызываться
		mockEncryption.AssertNotCalled(t, "EncryptConfig", mock.Anything)

		err := service.SaveConfig(configToSave)
		assert.ErrorIs(t, err, mkdirErr)
		assert.ErrorContains(t, err, "failed to create config directory")
		assert.Nil(t, writtenData)
	})

	t.Run("EncryptError", func(t *testing.T) {
		resetWrittenData()
		encryptErr := errors.New("encryption failed")
		osMkdirAll = func(path string, perm os.FileMode) error { return nil }
		mockEncryption.On("EncryptConfig", configToSave).Return("", encryptErr).Once()
		// WriteFile не должен вызываться

		err := service.SaveConfig(configToSave)
		assert.ErrorIs(t, err, encryptErr)
		assert.ErrorContains(t, err, "failed to encrypt config")
		assert.Nil(t, writtenData)
		mockEncryption.AssertExpectations(t)
	})

	t.Run("MarshalError", func(t *testing.T) {
		resetWrittenData()
		marshalErr := errors.New("simulated marshal error")
		osMkdirAll = func(path string, perm os.FileMode) error { return nil }
		mockEncryption.On("EncryptConfig", configToSave).Return(encryptedData, nil).Once()

		// Мокируем jsonMarshalIndent для возврата ошибки
		originalMarshal := jsonMarshalIndent
		jsonMarshalIndent = func(v any, prefix, indent string) ([]byte, error) {
			return nil, marshalErr
		}
		t.Cleanup(func() { jsonMarshalIndent = originalMarshal })

		err := service.SaveConfig(configToSave)
		assert.ErrorIs(t, err, marshalErr)
		assert.ErrorContains(t, err, "failed to marshal config")
		assert.Nil(t, writtenData)
		mockEncryption.AssertExpectations(t)
	})

	t.Run("WriteFileError", func(t *testing.T) {
		resetWrittenData()
		writeErr := errors.New("write failed")
		osMkdirAll = func(path string, perm os.FileMode) error { return nil }
		mockEncryption.On("EncryptConfig", configToSave).Return(encryptedData, nil).Once()
		osWriteFile = func(name string, data []byte, perm os.FileMode) error {
			return writeErr
		}

		err := service.SaveConfig(configToSave)
		assert.ErrorIs(t, err, writeErr)
		assert.ErrorContains(t, err, "failed to write config file")
		mockEncryption.AssertExpectations(t)
	})
}
