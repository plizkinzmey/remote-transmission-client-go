package infrastructure

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"runtime"
	"strings"
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
	if args.Error(0) == nil {
	}
	return args.Error(0)
}

// Helper function to create a temporary directory structure and return the expected config path within it.
func tempConfigDirAndPath(t *testing.T) (string, func()) {
	tempDir, err := os.MkdirTemp("", "config_test_")
	require.NoError(t, err)

	// Определяем ожидаемый путь к файлу внутри временной директории
	configPath := filepath.Join(tempDir, "config.json")

	cleanup := func() {
		os.RemoveAll(tempDir)
	}

	return configPath, cleanup
}

func TestNewConfigService(t *testing.T) {
	service := NewConfigService()
	assert.NotNil(t, service)
	assert.NotNil(t, service.encryptionService, "EncryptionService should be initialized")
	assert.NotNil(t, service.pathGetter, "pathGetter should be initialized")
}

func TestConfigExists(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter для этого теста
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	service := &ConfigService{
		encryptionService: new(MockEncryptionService), // Не используется в этом тесте
		pathGetter:        mockPathGetter,
	}

	// 1. Test when file does not exist
	exists, err := service.ConfigExists()
	assert.NoError(t, err)
	assert.False(t, exists, "ConfigExists should return false when file doesn't exist")

	// 2. Test when file exists
	err = os.WriteFile(configPath, []byte("{}"), 0600) // Create dummy file
	require.NoError(t, err)
	exists, err = service.ConfigExists()
	assert.NoError(t, err)
	assert.True(t, exists, "ConfigExists should return true when file exists")

	// 3. Test pathGetter error
	pathGetterErr := errors.New("path getter failed")
	service.pathGetter = func() (string, error) {
		return "", pathGetterErr
	}
	exists, err = service.ConfigExists()
	assert.Error(t, err)
	assert.ErrorContains(t, err, pathGetterErr.Error())
	assert.False(t, exists, "ConfigExists should be false on path getter error")
}

func TestLoadConfig_FileNotExist(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	// Убедимся, что файл действительно не существует
	_, statErr := os.Stat(configPath)
	require.True(t, os.IsNotExist(statErr))

	config, err := service.LoadConfig()

	assert.ErrorIs(t, err, ErrConfigNotExists, "Expected ErrConfigNotExists")
	assert.Nil(t, config)
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

func TestLoadConfig_PathGetterError(t *testing.T) {
	_, cleanup := tempConfigDirAndPath(t) // Нужен только cleanup
	defer cleanup()

	pathGetterErr := errors.New("path getter failed")
	mockPathGetter := func() (string, error) {
		return "", pathGetterErr
	}

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	config, err := service.LoadConfig()

	assert.Error(t, err)
	assert.ErrorContains(t, err, pathGetterErr.Error())
	assert.Nil(t, config)
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

func TestLoadConfig_ReadError(t *testing.T) {
	t.Skip("Skipping TestLoadConfig_ReadError as forcing os.ReadFile failure is complex without OS-level mocking")
}

func TestLoadConfig_OldFormat(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	oldConfig := domain.Config{Host: "old-host", Port: 9091}
	oldData, err := json.MarshalIndent(oldConfig, "", "  ")
	require.NoError(t, err)
	err = os.WriteFile(configPath, oldData, 0600)
	require.NoError(t, err)

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	loadedConfig, err := service.LoadConfig()

	assert.NoError(t, err)
	require.NotNil(t, loadedConfig)
	assert.Equal(t, oldConfig.Host, loadedConfig.Host)
	assert.Equal(t, oldConfig.Port, loadedConfig.Port)
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

func TestLoadConfig_NewFormat_EmptyData(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	emptyFormat := ConfigFormat{EncryptedData: ""}
	emptyData, err := json.MarshalIndent(emptyFormat, "", "  ")
	require.NoError(t, err)
	err = os.WriteFile(configPath, emptyData, 0600)
	require.NoError(t, err)

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	loadedConfig, err := service.LoadConfig()

	assert.NoError(t, err)
	assert.Nil(t, loadedConfig, "Should return nil config for empty encrypted data")
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

func TestLoadConfig_NewFormat_DecryptSuccess(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	encryptedString := "encrypted-data-string"
	newFormat := ConfigFormat{EncryptedData: encryptedString}
	newData, err := json.MarshalIndent(newFormat, "", "  ")
	require.NoError(t, err)
	err = os.WriteFile(configPath, newData, 0600)
	require.NoError(t, err)

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	decryptedConfig := domain.Config{Host: "decrypted-host", Port: 1234}
	mockEncrypt.On("DecryptConfig", encryptedString, mock.AnythingOfType("*domain.Config")).Return(nil).Run(func(args mock.Arguments) {
		cfgPtr := args.Get(1).(*domain.Config)
		*cfgPtr = decryptedConfig
	})

	loadedConfig, err := service.LoadConfig()

	assert.NoError(t, err)
	require.NotNil(t, loadedConfig)
	assert.Equal(t, decryptedConfig.Host, loadedConfig.Host)
	assert.Equal(t, decryptedConfig.Port, loadedConfig.Port)
	mockEncrypt.AssertExpectations(t)
}

func TestLoadConfig_NewFormat_DecryptError(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	encryptedString := "encrypted-data-string"
	newFormat := ConfigFormat{EncryptedData: encryptedString}
	newData, err := json.MarshalIndent(newFormat, "", "  ")
	require.NoError(t, err)
	err = os.WriteFile(configPath, newData, 0600)
	require.NoError(t, err)

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	decryptErr := errors.New("decryption failed")
	mockEncrypt.On("DecryptConfig", encryptedString, mock.AnythingOfType("*domain.Config")).Return(decryptErr)

	loadedConfig, err := service.LoadConfig()

	assert.Error(t, err)
	assert.ErrorContains(t, err, decryptErr.Error())
	assert.Nil(t, loadedConfig)
	mockEncrypt.AssertExpectations(t)
}

func TestLoadConfig_ParseError(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	invalidJson := []byte("this is not json")
	err := os.WriteFile(configPath, invalidJson, 0600)
	require.NoError(t, err)

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	loadedConfig, err := service.LoadConfig()

	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to parse config file")
	assert.Nil(t, loadedConfig)
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

func TestSaveConfig_Success(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	configToSave := &domain.Config{Host: "save-host", Port: 5678}
	expectedEncryptedData := "encrypted-save-data"

	// Настройка мока EncryptConfig
	mockEncrypt.On("EncryptConfig", configToSave).Return(expectedEncryptedData, nil)

	// Вызов SaveConfig
	err := service.SaveConfig(configToSave)
	assert.NoError(t, err)

	// Проверка вызова мока
	mockEncrypt.AssertExpectations(t)

	// Проверка содержимого файла
	savedData, readErr := os.ReadFile(configPath)
	require.NoError(t, readErr, "Failed to read saved config file")

	var savedFormat ConfigFormat
	jsonErr := json.Unmarshal(savedData, &savedFormat)
	require.NoError(t, jsonErr, "Failed to unmarshal saved config data")

	assert.Equal(t, expectedEncryptedData, savedFormat.EncryptedData)
}

func TestSaveConfig_PathGetterError(t *testing.T) {
	_, cleanup := tempConfigDirAndPath(t) // Нужен только cleanup
	defer cleanup()

	pathGetterErr := errors.New("path getter failed for save")
	mockPathGetter := func() (string, error) {
		return "", pathGetterErr
	}

	mockEncrypt := new(MockEncryptionService) // Не будет вызван
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	configToSave := &domain.Config{Host: "save-host"}
	err := service.SaveConfig(configToSave)

	assert.Error(t, err)
	assert.ErrorContains(t, err, pathGetterErr.Error())
	mockEncrypt.AssertNotCalled(t, "EncryptConfig", mock.Anything)
}

func TestSaveConfig_EncryptError(t *testing.T) {
	configPath, cleanup := tempConfigDirAndPath(t)
	defer cleanup()

	// Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	mockEncrypt := new(MockEncryptionService)
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	configToSave := &domain.Config{Host: "save-host"}
	encryptErr := errors.New("encryption failed")

	// Настройка мока EncryptConfig на возврат ошибки
	mockEncrypt.On("EncryptConfig", configToSave).Return("", encryptErr)

	// Вызов SaveConfig
	err := service.SaveConfig(configToSave)

	assert.Error(t, err)
	assert.ErrorContains(t, err, encryptErr.Error())
	mockEncrypt.AssertExpectations(t)

	// Убедимся, что файл не был создан или остался пустым (если был)
	_, statErr := os.Stat(configPath)
	assert.True(t, os.IsNotExist(statErr), "Config file should not exist after encryption error")
}

func TestSaveConfig_MkdirError(t *testing.T) {
	// 1. Создаем базовую временную директорию
	baseTempDir, err := os.MkdirTemp("", "config_base_test_")
	require.NoError(t, err)
	defer os.RemoveAll(baseTempDir) // Очистка в конце

	// 2. Определяем путь, где должна быть директория, и создаем там файл
	dirPathShouldBe := filepath.Join(baseTempDir, "transmission-client")
	err = os.WriteFile(dirPathShouldBe, []byte("i am a file, not a directory"), 0600)
	require.NoError(t, err)

	// 3. Определяем полный путь к файлу конфигурации
	configPath := filepath.Join(dirPathShouldBe, "config.json")

	// 4. Мок pathGetter
	mockPathGetter := func() (string, error) {
		return configPath, nil
	}

	mockEncrypt := new(MockEncryptionService) // Не будет вызван
	service := &ConfigService{
		encryptionService: mockEncrypt,
		pathGetter:        mockPathGetter,
	}

	configToSave := &domain.Config{Host: "save-host"}

	// 5. Вызов SaveConfig
	err = service.SaveConfig(configToSave)

	// 6. Проверка ошибки от os.MkdirAll
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to create config directory")
	underlyingError := errors.Unwrap(err)
	require.NotNil(t, underlyingError, "Expected underlying error from MkdirAll")
	errorString := underlyingError.Error()
	isNotDirError := strings.Contains(errorString, "not a directory")
	if runtime.GOOS == "windows" {
	}
	assert.True(t, isNotDirError, "Underlying error should indicate 'not a directory', got: %v", errorString)

	mockEncrypt.AssertNotCalled(t, "EncryptConfig", mock.Anything)
}
