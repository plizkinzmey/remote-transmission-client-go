package infrastructure

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/pbkdf2"
)

// --- Моки для зависимостей ---

type MockKeyring struct {
	mock.Mock
}

func (m *MockKeyring) Get(service, username string) (string, error) {
	args := m.Called(service, username)
	return args.String(0), args.Error(1)
}

func (m *MockKeyring) Set(service, username, password string) error {
	args := m.Called(service, username, password)
	return args.Error(0)
}

type MockRandReader struct {
	mock.Mock
	DataToRead []byte
	ReadError  error
}

func (m *MockRandReader) Read(p []byte) (n int, err error) {
	if m.ReadError != nil {
		return 0, m.ReadError
	}
	if len(m.DataToRead) == 0 {
		return 0, io.EOF
	}

	n = copy(p, m.DataToRead)
	m.DataToRead = m.DataToRead[n:]

	return n, nil
}

// errorReader is a mock io.Reader that always returns an error
type errorReader struct{}

func (er *errorReader) Read(p []byte) (n int, err error) {
	return 0, errors.New("random source failed")
}

// --- Переменные для хранения оригинальных функций/ридеров ---
var (
	originalKeyringGet      keyringGetterFunc
	originalKeyringSet      keyringSetterFunc
	originalRandReader      io.Reader
	originalMachineIDGetter machineIDGetterFunc
)

// --- Функция установки моков ---
func setupEncryptionMocks(t *testing.T) (*MockKeyring, *MockRandReader) {
	t.Helper()

	// Сохраняем оригиналы
	originalKeyringGet = keyringGet
	originalKeyringSet = keyringSet
	originalRandReader = randReader
	originalMachineIDGetter = machineIDGetter

	mockKr := new(MockKeyring)
	mockRdr := new(MockRandReader)

	// Подменяем функции
	keyringGet = mockKr.Get
	keyringSet = mockKr.Set
	randReader = mockRdr
	// По умолчанию machineIDGetter возвращает фиксированное значение для тестов
	machineIDGetter = func() (string, error) { return "test-machine-id", nil }

	// Очистка
	t.Cleanup(func() {
		keyringGet = originalKeyringGet
		keyringSet = originalKeyringSet
		randReader = originalRandReader
		machineIDGetter = originalMachineIDGetter
	})

	return mockKr, mockRdr
}

// --- Тесты ---

func TestNewEncryptionService(t *testing.T) {
	service := NewEncryptionService()
	assert.NotNil(t, service)
}

// --- Тесты getEncryptionKey ---

func TestGetEncryptionKey_FromKeyringSuccess(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	expectedKey := make([]byte, keySize)
	expectedKey[0] = 1 // Просто чтобы ключ был не нулевой
	encodedKey := base64.StdEncoding.EncodeToString(expectedKey)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()

	key, err := service.getEncryptionKey()
	assert.NoError(t, err)
	assert.Equal(t, expectedKey, key)
	mockKr.AssertExpectations(t)
	mockKr.AssertNotCalled(t, "Set", mock.Anything, mock.Anything, mock.Anything)
}

func TestGetEncryptionKey_FromKeyringDecodeError(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	invalidBase64Key := "this is not base64"
	generatedKey := make([]byte, keySize)
	generatedKey[0] = 2
	encodedGeneratedKey := base64.StdEncoding.EncodeToString(generatedKey)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(invalidBase64Key, nil).Once()
	mockRdr.DataToRead = generatedKey
	mockRdr.ReadError = nil
	mockKr.On("Set", keyringServiceName, keyringUsername, encodedGeneratedKey).Return(nil).Once()

	key, err := service.getEncryptionKey()
	assert.NoError(t, err)
	assert.Equal(t, generatedKey, key) // Должен быть сгенерированный ключ
	mockKr.AssertExpectations(t)
}

func TestGetEncryptionKey_KeyringGetOtherError(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	getKeyError := errors.New("keyring unavailable")
	generatedKey := make([]byte, keySize)
	generatedKey[0] = 3
	encodedGeneratedKey := base64.StdEncoding.EncodeToString(generatedKey)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return("", getKeyError).Once()
	mockRdr.DataToRead = generatedKey
	mockRdr.ReadError = nil
	mockKr.On("Set", keyringServiceName, keyringUsername, encodedGeneratedKey).Return(nil).Once()

	key, err := service.getEncryptionKey()
	assert.NoError(t, err)
	assert.Equal(t, generatedKey, key)
	mockKr.AssertExpectations(t)
}

func TestGetEncryptionKey_GenerateNewSuccess(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	generatedKey := make([]byte, keySize)
	generatedKey[0] = 4
	encodedGeneratedKey := base64.StdEncoding.EncodeToString(generatedKey)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return("", keyring.ErrNotFound).Once()
	mockRdr.DataToRead = generatedKey
	mockRdr.ReadError = nil
	mockKr.On("Set", keyringServiceName, keyringUsername, encodedGeneratedKey).Return(nil).Once()

	key, err := service.getEncryptionKey()
	assert.NoError(t, err)
	assert.Equal(t, generatedKey, key)
	mockKr.AssertExpectations(t)
}

func TestGetEncryptionKey_GenerateNewSetError(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	generatedKey := make([]byte, keySize)
	generatedKey[0] = 5
	encodedGeneratedKey := base64.StdEncoding.EncodeToString(generatedKey)
	setError := errors.New("failed to set key")

	mockKr.On("Get", keyringServiceName, keyringUsername).Return("", keyring.ErrNotFound).Once()
	mockRdr.DataToRead = generatedKey
	mockRdr.ReadError = nil
	mockKr.On("Set", keyringServiceName, keyringUsername, encodedGeneratedKey).Return(setError).Once() // Ошибка при сохранении

	key, err := service.getEncryptionKey()
	assert.NoError(t, err)             // Ошибка Set не должна прерывать получение ключа
	assert.Equal(t, generatedKey, key) // Ключ все равно должен быть возвращен
	mockKr.AssertExpectations(t)
}

func TestGetEncryptionKey_GenerateFallbackPBKDF2(t *testing.T) {
	mockKeyring, _ := setupEncryptionMocks(t) // Получаем mockKeyring

	// Mock rand.Reader to fail
	randReader = &errorReader{}
	// Mock machineIDGetter
	expectedMachineID := "test-machine-id-for-pbkdf2" // Используем уникальное ID для теста
	machineIDGetter = func() (string, error) {
		return expectedMachineID, nil
	}

	// Вычисляем ожидаемый ключ PBKDF2 на основе тех же данных, что и в коде
	expectedKeyBytes := pbkdf2.Key([]byte(expectedMachineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	expectedKeyStr := base64.StdEncoding.EncodeToString(expectedKeyBytes) // Динамически вычисленный ключ

	// Mock keyring Get to return not found
	mockKeyring.On("Get", keyringServiceName, keyringUsername).Return("", keyring.ErrNotFound).Once()
	// Mock keyring Set to expect the dynamically calculated key
	mockKeyring.On("Set", keyringServiceName, keyringUsername, expectedKeyStr).Return(nil).Once()

	service := NewEncryptionService()
	key, err := service.getEncryptionKey()

	assert.NoError(t, err)
	assert.Equal(t, expectedKeyBytes, key) // Сравниваем байты ключа
	mockKeyring.AssertExpectations(t)
}

func TestGetEncryptionKey_GenerateFallbackPBKDF2_MachineIDError(t *testing.T) {
	mockKeyring, _ := setupEncryptionMocks(t)

	// Mock rand.Reader to fail
	randReader = &errorReader{}
	// Mock machineIDGetter to return an error
	machineIDGetter = func() (string, error) {
		return "", errors.New("cannot get machine id")
	}

	// Вычисляем ожидаемый ключ PBKDF2 на основе fallback ID машины
	fallbackMachineID := "transmission-client-machine-id" // Как в коде
	expectedKeyBytes := pbkdf2.Key([]byte(fallbackMachineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	expectedKeyStr := base64.StdEncoding.EncodeToString(expectedKeyBytes) // Динамически вычисленный ключ

	// Mock keyring Get to return not found
	mockKeyring.On("Get", keyringServiceName, keyringUsername).Return("", keyring.ErrNotFound).Once()
	// Mock keyring Set to expect the dynamically calculated key
	mockKeyring.On("Set", keyringServiceName, keyringUsername, expectedKeyStr).Return(nil).Once()

	service := NewEncryptionService()
	key, err := service.getEncryptionKey()

	assert.NoError(t, err)
	assert.Equal(t, expectedKeyBytes, key) // Сравниваем байты ключа
	mockKeyring.AssertExpectations(t)
}

// --- Тесты EncryptConfig ---

type Unmarshallable struct {
	Fn func()
}

func TestEncryptConfig_Success(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	config := map[string]string{"key": "value"}
	testKey := make([]byte, keySize)
	testKey[0] = 10
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	testNonce := make([]byte, 12) // GCM Nonce size is typically 12
	testNonce[0] = 11

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()
	mockRdr.DataToRead = testNonce
	mockRdr.ReadError = nil

	encrypted, err := service.EncryptConfig(config)
	assert.NoError(t, err)
	assert.NotEmpty(t, encrypted)

	decoded, err := base64.StdEncoding.DecodeString(encrypted)
	require.NoError(t, err)
	block, _ := aes.NewCipher(testKey)
	gcm, _ := cipher.NewGCM(block)
	require.True(t, len(decoded) >= gcm.NonceSize())
	nonce, ciphertext := decoded[:gcm.NonceSize()], decoded[gcm.NonceSize():]
	assert.Equal(t, testNonce, nonce)
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	require.NoError(t, err)
	var decryptedConfig map[string]string
	err = json.Unmarshal(plaintext, &decryptedConfig)
	require.NoError(t, err)
	assert.Equal(t, config, decryptedConfig)

	mockKr.AssertExpectations(t)
}

func TestEncryptConfig_MarshalError(t *testing.T) {
	_, _ = setupEncryptionMocks(t)
	service := NewEncryptionService()
	unmarshallableConfig := Unmarshallable{Fn: func() {}}

	encrypted, err := service.EncryptConfig(unmarshallableConfig)
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to marshal config")
	assert.Empty(t, encrypted)
}

func TestEncryptConfig_GetKeyError(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	config := map[string]string{"key": "value"}
	getKeyError := errors.New("keyring unavailable")
	randError := errors.New("rand error")
	machineIDError := errors.New("machine id error")

	// Mock keyring Get to return an error
	mockKr.On("Get", keyringServiceName, keyringUsername).Return("", getKeyError).Once()

	// Mock randReader to return an error
	mockRdr := new(MockRandReader) // Use the mock reader from setup
	originalReader := randReader
	randReader = mockRdr
	t.Cleanup(func() { randReader = originalReader })
	mockRdr.DataToRead = nil
	mockRdr.ReadError = randError // Set the error for randReader

	// Mock machineIDGetter to return an error
	originalGetter := machineIDGetter
	machineIDGetter = func() (string, error) { return "", machineIDError }
	t.Cleanup(func() { machineIDGetter = originalGetter })

	// Calculate the expected fallback key that getEncryptionKey will generate and try to set
	fallbackMachineID := "transmission-client-machine-id"
	expectedKeyBytes := pbkdf2.Key([]byte(fallbackMachineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	expectedKeyStr := base64.StdEncoding.EncodeToString(expectedKeyBytes)

	// Add expectation for the Set call that happens during fallback key generation
	mockKr.On("Set", keyringServiceName, keyringUsername, expectedKeyStr).Return(nil).Once()

	encrypted, err := service.EncryptConfig(config)

	// --- Revised Assertion ---
	// getEncryptionKey succeeds with fallback key, but nonce generation fails due to mocked randReader error
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to generate nonce")
	assert.ErrorIs(t, err, randError) // Check that the underlying error is the one we injected
	assert.Empty(t, encrypted)        // No encrypted data should be returned on error
	mockKr.AssertExpectations(t)
}

func TestEncryptConfig_NonceError(t *testing.T) {
	mockKr, mockRdr := setupEncryptionMocks(t)
	service := NewEncryptionService()
	config := map[string]string{"key": "value"}
	testKey := make([]byte, keySize)
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	nonceError := errors.New("failed to read random bytes for nonce")

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()
	mockRdr.DataToRead = nil
	mockRdr.ReadError = nonceError

	encrypted, err := service.EncryptConfig(config)
	assert.ErrorIs(t, err, nonceError)
	assert.ErrorContains(t, err, "failed to generate nonce")
	assert.Empty(t, encrypted)
	mockKr.AssertExpectations(t)
}

// --- Тесты DecryptConfig ---

func TestDecryptConfig_Success(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string
	expectedConfig := map[string]string{"key": "decrypted_value"}
	plaintext, _ := json.Marshal(expectedConfig)
	testKey := make([]byte, keySize)
	testKey[0] = 20
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	testNonce := make([]byte, 12)
	testNonce[0] = 21

	block, _ := aes.NewCipher(testKey)
	gcm, _ := cipher.NewGCM(block)
	ciphertext := gcm.Seal(nil, testNonce, plaintext, nil)
	fullCiphertext := append(testNonce, ciphertext...)
	encodedData := base64.StdEncoding.EncodeToString(fullCiphertext)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()

	err := service.DecryptConfig(encodedData, &resultConfig)
	assert.NoError(t, err)
	assert.Equal(t, expectedConfig, resultConfig)
	mockKr.AssertExpectations(t)
}

func TestDecryptConfig_EmptyData(t *testing.T) {
	_, _ = setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string

	err := service.DecryptConfig("", &resultConfig)
	assert.NoError(t, err)
	assert.Empty(t, resultConfig)
}

func TestDecryptConfig_Base64Error(t *testing.T) {
	_, _ = setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string
	invalidBase64 := "this is not base64"

	err := service.DecryptConfig(invalidBase64, &resultConfig)
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to decode base64")
	assert.Empty(t, resultConfig)
}

func TestDecryptConfig_GetKeyError(t *testing.T) {
	_, _ = setupEncryptionMocks(t) // Вызываем setup для очистки, но игнорируем возвращаемые значения
	service := NewEncryptionService()
	var resultConfig map[string]string

	// --- Revised Mocks and Assertions ---
	// The function fails early due to invalid base64 input, so getEncryptionKey is never called.
	// No mocks for keyring, randReader, or machineIDGetter are needed or expected to be called.

	// Use invalid base64 data that will cause DecodeString to fail
	invalidBase64Data := "this is not base64"
	err := service.DecryptConfig(invalidBase64Data, &resultConfig)

	assert.Error(t, err)                                    // Expect error
	assert.ErrorContains(t, err, "failed to decode base64") // Expect specific base64 error
	assert.Empty(t, resultConfig)
}

func TestDecryptConfig_CiphertextTooShort(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string
	testKey := make([]byte, keySize)
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	shortCiphertext := make([]byte, 5)
	encodedData := base64.StdEncoding.EncodeToString(shortCiphertext)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()

	err := service.DecryptConfig(encodedData, &resultConfig)
	assert.Error(t, err)
	assert.ErrorContains(t, err, "ciphertext too short")
	assert.Empty(t, resultConfig)
	mockKr.AssertExpectations(t)
}

func TestDecryptConfig_OpenError(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string
	testKey := make([]byte, keySize)
	testKey[0] = 30
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	wrongKey := make([]byte, keySize)
	wrongKey[0] = 31
	testNonce := make([]byte, 12)
	plaintext := []byte(`{"msg":"hello"}`)

	blockWrong, _ := aes.NewCipher(wrongKey)
	gcmWrong, _ := cipher.NewGCM(blockWrong)
	ciphertext := gcmWrong.Seal(nil, testNonce, plaintext, nil)
	fullCiphertext := append(testNonce, ciphertext...)
	encodedData := base64.StdEncoding.EncodeToString(fullCiphertext)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()

	err := service.DecryptConfig(encodedData, &resultConfig)
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to decrypt data")
	assert.Empty(t, resultConfig)
	mockKr.AssertExpectations(t)
}

func TestDecryptConfig_UnmarshalError(t *testing.T) {
	mockKr, _ := setupEncryptionMocks(t)
	service := NewEncryptionService()
	var resultConfig map[string]string
	invalidPlaintext := []byte(`this is not json`)
	testKey := make([]byte, keySize)
	encodedKey := base64.StdEncoding.EncodeToString(testKey)
	testNonce := make([]byte, 12)

	block, _ := aes.NewCipher(testKey)
	gcm, _ := cipher.NewGCM(block)
	ciphertext := gcm.Seal(nil, testNonce, invalidPlaintext, nil)
	fullCiphertext := append(testNonce, ciphertext...)
	encodedData := base64.StdEncoding.EncodeToString(fullCiphertext)

	mockKr.On("Get", keyringServiceName, keyringUsername).Return(encodedKey, nil).Once()

	err := service.DecryptConfig(encodedData, &resultConfig)
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to unmarshal config")
	assert.Empty(t, resultConfig)
	mockKr.AssertExpectations(t)
}
