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
	if args.Error(0) == nil {
		// We need to know what data the mock should "decrypt" into config
		// Let's assume the mock setup provides the data via Return arguments
		// or we can use a helper function in the mock setup.
		// For simplicity, let's assume the test will handle filling the config object
		// based on what DecryptConfig is expected to do.
		// A more sophisticated mock could use Run to modify the config argument.
		// Example using Run:
		// mockEncrypt.On("DecryptConfig", mock.Anything, mock.Anything).Return(nil).Run(func(args mock.Arguments) {
		//     cfgPtr := args.Get(1).(*domain.Config)
		//     *cfgPtr = domain.Config{Host: "decrypted-host"} // Simulate decryption
		// })
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
	// Проверяем, что pathGetter - это реальная функция (опционально, через reflect)
	// assert.Equal(t, reflect.ValueOf(realGetConfigPath).Pointer(), reflect.ValueOf(service.pathGetter).Pointer())
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
	// Этот тест все еще сложно реализовать без мокирования os.ReadFile
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
	// Ожидаем nil, так как пустые данные не являются валидной конфигурацией
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
	// Ошибка должна содержать "failed to parse config file", так как обе попытки unmarshal провалятся
	assert.ErrorContains(t, err, "failed to parse config file")
	assert.Nil(t, loadedConfig)
	mockEncrypt.AssertNotCalled(t, "DecryptConfig", mock.Anything, mock.Anything)
}

// TODO: Add tests for SaveConfig
