package infrastructure

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher" // Import cipher for GCM manipulation
	"crypto/rand"   // Import crypto/rand for the original reader
	"crypto/sha256"
	"encoding/base64"
	"encoding/json" // Import json for marshal/unmarshal errors
	"errors"
	"io"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/zalando/go-keyring" // Import for keyring.ErrNotFound
	"golang.org/x/crypto/pbkdf2"
)

// MockReader is a helper to simulate errors from io.Reader
type MockReader struct {
	err error
}

func (mr *MockReader) Read(p []byte) (n int, err error) {
	return 0, mr.err
}

// Helper to reset mocks after each test
func resetMocks(_ *testing.T) {
	// Restore original functions/variables
	keyringGet = keyring.Get
	keyringSet = keyring.Set
	randReader = rand.Reader // Restore original crypto/rand.Reader
	machineIDGetter = getMachineID
}

func TestNewEncryptionService(t *testing.T) {
	service := NewEncryptionService()
	assert.NotNil(t, service)
}

func TestEncryptDecrypt_Success_KeyGenerated(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) }) // Ensure mocks are reset

	service := NewEncryptionService()
	config := &domain.Config{Host: "test-host", Port: 1234}

	// --- Mock Setup ---
	var storedKey string

	// Mock keyring: Get returns not found, Set stores the key
	keyringGet = func(service, username string) (string, error) {
		return "", keyring.ErrNotFound // Simulate key not found
	}
	keyringSet = func(service, username, password string) error {
		storedKey = password // Store the generated key for verification
		return nil
	}

	// Mock randReader: Provide enough deterministic bytes for BOTH key and nonce generation.
	// keySize (32 bytes) + nonceSize (12 bytes for GCM) = 44 bytes
	deterministicKeyBytes := bytes.Repeat([]byte{0xAB}, keySize)
	deterministicNonceBytes := bytes.Repeat([]byte{0xCD}, 12) // Use a different pattern for nonce
	combinedBytes := append(deterministicKeyBytes, deterministicNonceBytes...)
	randReader = bytes.NewReader(combinedBytes) // Reader with 44 bytes

	// Mock machineIDGetter - should NOT be called as random key generation should succeed now
	machineIDGetter = func() (string, error) {
		t.Error("machineIDGetter should not be called in this scenario")
		return "mock-machine-id", nil
	}

	// --- Encrypt ---
	encryptedData, err := service.EncryptConfig(config)
	require.NoError(t, err)
	assert.NotEmpty(t, encryptedData)
	assert.NotEmpty(t, storedKey, "Key should have been stored by keyringSet mock")

	// --- Decrypt ---
	// Reset mocks for decryption phase, now simulating key exists in keyring
	keyringGet = func(service, username string) (string, error) {
		require.NotEmpty(t, storedKey, "storedKey should not be empty for decryption")
		return storedKey, nil // Return the previously stored key
	}
	keyringSet = func(service, username, password string) error {
		t.Error("keyringSet should not be called during decryption")
		return nil
	}
	// randReader is not used in decryption

	var decryptedConfig domain.Config
	err = service.DecryptConfig(encryptedData, &decryptedConfig)
	require.NoError(t, err)

	// --- Assert ---
	assert.Equal(t, config.Host, decryptedConfig.Host)
	assert.Equal(t, config.Port, decryptedConfig.Port)

	// Optional: Verify the stored key format (Base64 of 32 bytes)
	// Also verify it matches the deterministic bytes we provided
	keyBytes, errDecode := base64.StdEncoding.DecodeString(storedKey)
	assert.NoError(t, errDecode)
	assert.Len(t, keyBytes, keySize)
	assert.Equal(t, deterministicKeyBytes, keyBytes, "Stored key should match the deterministic key bytes")

	// Optional: Verify the encrypted data structure (nonce + ciphertext)
	decodedCiphertext, errDecodeCipher := base64.StdEncoding.DecodeString(encryptedData)
	assert.NoError(t, errDecodeCipher)
	assert.True(t, bytes.HasPrefix(decodedCiphertext, deterministicNonceBytes), "Encrypted data should start with the deterministic nonce bytes")
	assert.Greater(t, len(decodedCiphertext), 12, "Decoded ciphertext length should be greater than nonce size")
}

func TestEncryptDecrypt_Success_KeyFromKeyring(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	config := &domain.Config{Host: "another-host", Username: "user"}

	// --- Mock Setup ---
	// Generate a plausible key manually for this test
	manualKey := make([]byte, keySize)
	_, err := io.ReadFull(randReader, manualKey) // Use real randReader here for key gen
	require.NoError(t, err)
	manualKeyBase64 := base64.StdEncoding.EncodeToString(manualKey)

	// Mock keyring: Get returns the manual key, Set should not be called
	keyringGet = func(service, username string) (string, error) {
		return manualKeyBase64, nil // Simulate key found
	}
	keyringSet = func(service, username, password string) error {
		t.Error("keyringSet should not be called when key is found")
		return nil
	}

	// Mock randReader for deterministic nonce during encryption
	deterministicNonce := bytes.Repeat([]byte{0x02}, 12)
	randReader = bytes.NewReader(deterministicNonce)

	// machineIDGetter should not be called
	machineIDGetter = func() (string, error) {
		t.Error("machineIDGetter should not be called when key is found")
		return "mock-machine-id", nil
	}

	// --- Encrypt ---
	encryptedData, err := service.EncryptConfig(config)
	require.NoError(t, err)
	assert.NotEmpty(t, encryptedData)

	// --- Decrypt ---
	// Mocks remain the same for decryption (keyringGet returns the key)

	var decryptedConfig domain.Config
	err = service.DecryptConfig(encryptedData, &decryptedConfig)
	require.NoError(t, err)

	// --- Assert ---
	assert.Equal(t, config.Host, decryptedConfig.Host)
	assert.Equal(t, config.Username, decryptedConfig.Username)

	// Optional: Verify encrypted data structure
	decodedCiphertext, errDecodeCipher := base64.StdEncoding.DecodeString(encryptedData)
	assert.NoError(t, errDecodeCipher)
	assert.True(t, bytes.HasPrefix(decodedCiphertext, deterministicNonce), "Encrypted data should start with the deterministic nonce")
}

func TestGetEncryptionKey_PBKDF2_Success(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	var storedKey string
	mockMachineID := "test-machine-id-123"
	expectedKey := pbkdf2.Key([]byte(mockMachineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	expectedKeyBase64 := base64.StdEncoding.EncodeToString(expectedKey)

	// --- Mock Setup ---
	keyringGet = func(service, username string) (string, error) {
		return "", keyring.ErrNotFound // Key not found
	}
	// Simulate error during random key generation
	randReader = &MockReader{err: errors.New("random reader failed")}
	machineIDGetter = func() (string, error) {
		return mockMachineID, nil // Return machine ID successfully
	}
	keyringSet = func(service, username, password string) error {
		storedKey = password // Capture the key being stored
		return nil
	}

	// --- Call getEncryptionKey ---
	actualKey, err := service.getEncryptionKey()

	// --- Assert ---
	require.NoError(t, err)
	assert.Equal(t, expectedKey, actualKey, "Returned key should match PBKDF2 derived key")
	assert.Equal(t, expectedKeyBase64, storedKey, "Stored key should match PBKDF2 derived key (base64)")
}

func TestGetEncryptionKey_PBKDF2_MachineIDError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	var storedKey string
	machineIDError := errors.New("failed to get machine id")
	fallbackMachineID := "transmission-client-machine-id" // The hardcoded fallback
	expectedKey := pbkdf2.Key([]byte(fallbackMachineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	expectedKeyBase64 := base64.StdEncoding.EncodeToString(expectedKey)

	// --- Mock Setup ---
	keyringGet = func(service, username string) (string, error) {
		return "", keyring.ErrNotFound // Key not found
	}
	// Simulate error during random key generation
	randReader = &MockReader{err: errors.New("random reader failed again")}
	machineIDGetter = func() (string, error) {
		return "", machineIDError // Simulate error getting machine ID
	}
	keyringSet = func(service, username, password string) error {
		storedKey = password // Capture the key being stored
		return nil
	}

	// --- Call getEncryptionKey ---
	actualKey, err := service.getEncryptionKey()

	// --- Assert ---
	require.NoError(t, err) // getEncryptionKey itself shouldn't error here, only log warnings
	assert.Equal(t, expectedKey, actualKey, "Returned key should match PBKDF2 derived key from fallback ID")
	assert.Equal(t, expectedKeyBase64, storedKey, "Stored key should match PBKDF2 derived key from fallback ID (base64)")
}

func TestGetEncryptionKey_KeyringGetOtherError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	keyringError := errors.New("some generic keyring error")
	var storedKey string // To check if a new key was generated and stored

	// --- Mock Setup ---
	keyringGet = func(service, username string) (string, error) {
		return "", keyringError // Simulate a non-NotFound error
	}
	// Mock randReader to succeed to generate a random key
	deterministicKeyBytes := bytes.Repeat([]byte{0xEE}, keySize)
	randReader = bytes.NewReader(deterministicKeyBytes)
	keyringSet = func(service, username, password string) error {
		storedKey = password // Capture the key
		return nil
	}
	machineIDGetter = func() (string, error) {
		t.Error("machineIDGetter should not be called when random key generation succeeds")
		return "should-not-be-called", nil
	}

	// --- Call getEncryptionKey ---
	actualKey, err := service.getEncryptionKey()

	// --- Assert ---
	require.NoError(t, err) // The function should handle the error and generate a new key
	assert.Equal(t, deterministicKeyBytes, actualKey, "Should return newly generated random key")
	assert.Equal(t, base64.StdEncoding.EncodeToString(deterministicKeyBytes), storedKey, "Should attempt to store the newly generated key")
}

func TestGetEncryptionKey_KeyringDecodeError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	invalidBase64Key := "this-is-not-base64!"
	var storedKey string // To check if a new key was generated and stored

	// --- Mock Setup ---
	keyringGet = func(service, username string) (string, error) {
		return invalidBase64Key, nil // Return invalid key successfully
	}
	// Mock randReader to succeed
	deterministicKeyBytes := bytes.Repeat([]byte{0xFF}, keySize)
	randReader = bytes.NewReader(deterministicKeyBytes)
	keyringSet = func(service, username, password string) error {
		storedKey = password // Capture the key
		return nil
	}
	machineIDGetter = func() (string, error) {
		t.Error("machineIDGetter should not be called when random key generation succeeds")
		return "should-not-be-called", nil
	}

	// --- Call getEncryptionKey ---
	actualKey, err := service.getEncryptionKey()

	// --- Assert ---
	require.NoError(t, err) // The function should handle the decode error and generate a new key
	assert.Equal(t, deterministicKeyBytes, actualKey, "Should return newly generated random key after decode error")
	assert.Equal(t, base64.StdEncoding.EncodeToString(deterministicKeyBytes), storedKey, "Should attempt to store the newly generated key after decode error")
}

func TestGetEncryptionKey_KeyringSetError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })

	service := NewEncryptionService()
	keyringSetError := errors.New("failed to set key in keyring")

	// --- Mock Setup ---
	keyringGet = func(service, username string) (string, error) {
		return "", keyring.ErrNotFound // Key not found
	}
	// Mock randReader to succeed
	deterministicKeyBytes := bytes.Repeat([]byte{0xAA}, keySize)
	randReader = bytes.NewReader(deterministicKeyBytes)
	keyringSet = func(service, username, password string) error {
		// Verify the correct key is attempted to be stored
		assert.Equal(t, base64.StdEncoding.EncodeToString(deterministicKeyBytes), password)
		return keyringSetError // Simulate error during set
	}
	machineIDGetter = func() (string, error) {
		t.Error("machineIDGetter should not be called when random key generation succeeds")
		return "should-not-be-called", nil
	}

	// --- Call getEncryptionKey ---
	actualKey, err := service.getEncryptionKey()

	// --- Assert ---
	// The error from keyringSet is only logged, getEncryptionKey should still succeed
	require.NoError(t, err)
	assert.Equal(t, deterministicKeyBytes, actualKey, "Should return the generated key even if storing failed")
}

// --- EncryptConfig Error Tests ---

// Mock type to cause json.Marshal error
type Unmarshallable struct {
	Channel chan int
}

func TestEncryptConfig_MarshalError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	unmarshallableConfig := &Unmarshallable{Channel: make(chan int)}

	_, err := service.EncryptConfig(unmarshallableConfig)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to marshal config")
}

func TestEncryptConfig_NonceError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	config := &domain.Config{Host: "test"}
	nonceError := errors.New("nonce generation failed")

	// Mock randReader to fail during nonce generation
	// Need to ensure getEncryptionKey succeeds first
	keyringGet = func(service, username string) (string, error) {
		return base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0xBB}, keySize)), nil // Provide valid key
	}
	randReader = &MockReader{err: nonceError} // Fail nonce generation

	_, err := service.EncryptConfig(config)

	require.Error(t, err)
	assert.ErrorIs(t, err, nonceError) // Check for the specific underlying error
	assert.Contains(t, err.Error(), "failed to generate nonce")
}

// --- DecryptConfig Error Tests ---

func TestDecryptConfig_EmptyData(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	var config domain.Config

	err := service.DecryptConfig("", &config) // Pass empty string

	require.NoError(t, err)                  // Empty data should not be an error
	assert.Equal(t, domain.Config{}, config) // Config should remain empty/zeroed
}

func TestDecryptConfig_Base64Error(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	var config domain.Config
	invalidBase64 := "this is not base64"

	err := service.DecryptConfig(invalidBase64, &config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to decode base64")
}

func TestDecryptConfig_CiphertextTooShort(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	var config domain.Config

	// Provide a valid key via mock
	keyringGet = func(service, username string) (string, error) {
		return base64.StdEncoding.EncodeToString(bytes.Repeat([]byte{0xCC}, keySize)), nil
	}

	// Create data shorter than nonce size (12 bytes for GCM)
	shortData := base64.StdEncoding.EncodeToString([]byte("short")) // "short" is 5 bytes

	err := service.DecryptConfig(shortData, &config)

	require.Error(t, err)
	assert.Contains(t, err.Error(), "ciphertext too short")
}

func TestDecryptConfig_GCMOpenError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	configToEncrypt := &domain.Config{Host: "good-data"}
	var decryptedConfig domain.Config

	// --- Setup: Encrypt data correctly first ---
	var realKeyBytes []byte
	keyringGet = func(service, username string) (string, error) {
		// Generate and store a real key for this test run
		if len(realKeyBytes) == 0 {
			realKeyBytes = make([]byte, keySize)
			_, err := rand.Read(realKeyBytes) // Use real random
			require.NoError(t, err)
		}
		return base64.StdEncoding.EncodeToString(realKeyBytes), nil
	}
	// Use real rand reader for nonce generation during encryption
	randReader = rand.Reader

	encryptedData, errEncrypt := service.EncryptConfig(configToEncrypt)
	require.NoError(t, errEncrypt)
	require.NotEmpty(t, encryptedData)

	// --- Tamper with the encrypted data ---
	decodedBytes, errDecode := base64.StdEncoding.DecodeString(encryptedData)
	require.NoError(t, errDecode)
	require.Greater(t, len(decodedBytes), 12) // Ensure it has nonce + data

	// Modify the ciphertext part (after the nonce)
	decodedBytes[len(decodedBytes)-1] ^= 0xFF // Flip some bits at the end

	tamperedEncryptedData := base64.StdEncoding.EncodeToString(decodedBytes)

	// --- Attempt to Decrypt tampered data ---
	// Keyring mock remains the same (returns the correct key)
	errDecrypt := service.DecryptConfig(tamperedEncryptedData, &decryptedConfig)

	// --- Assert ---
	require.Error(t, errDecrypt)
	// The specific error from gcm.Open is often "cipher: message authentication failed"
	assert.Contains(t, errDecrypt.Error(), "failed to decrypt data")
	// Check underlying error if possible/needed
	underlyingError := errors.Unwrap(errDecrypt)
	if underlyingError != nil {
		// Check string contains "message authentication failed"
		assert.Contains(t, underlyingError.Error(), "message authentication failed", "Expected GCM authentication error")
	} else {
		// If no underlying error, check the main error text more strictly
		assert.Contains(t, errDecrypt.Error(), "message authentication failed", "Expected GCM authentication error")
	}
}

func TestDecryptConfig_UnmarshalError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	var decryptedConfig domain.Config

	// --- Setup: Encrypt something that is NOT valid JSON ---
	invalidPlaintext := []byte("this is definitely not json {") // Invalid JSON string

	// Generate the key *before* manual encryption and mock setup
	realKeyBytes := make([]byte, keySize)
	_, err := rand.Read(realKeyBytes) // Use real random
	require.NoError(t, err)
	realKeyBase64 := base64.StdEncoding.EncodeToString(realKeyBytes)

	// Mock keyringGet to return the pre-generated key
	keyringGet = func(service, username string) (string, error) {
		return realKeyBase64, nil
	}
	randReader = rand.Reader // Use real reader for nonce

	// Manually encrypt using the key and nonce
	block, errBlock := aes.NewCipher(realKeyBytes)
	require.NoError(t, errBlock)
	gcm, errGCM := cipher.NewGCM(block)
	require.NoError(t, errGCM)
	nonce := make([]byte, gcm.NonceSize())
	_, errNonce := io.ReadFull(randReader, nonce)
	require.NoError(t, errNonce)
	// Encrypt the invalid plaintext
	ciphertext := gcm.Seal(nonce, nonce, invalidPlaintext, nil)
	encryptedData := base64.StdEncoding.EncodeToString(ciphertext)

	// --- Attempt to Decrypt and Unmarshal ---
	// Keyring mock remains the same
	errDecrypt := service.DecryptConfig(encryptedData, &decryptedConfig)

	// --- Assert ---
	// Now we expect an error because the decrypted data is not valid JSON
	require.Error(t, errDecrypt)
	assert.Contains(t, errDecrypt.Error(), "failed to unmarshal config")
	// Check underlying error type if needed (should be a json syntax error)
	var jsonSyntaxError *json.SyntaxError
	// var jsonTypeError *json.UnmarshalTypeError // Not expected here
	if errors.As(errDecrypt, &jsonSyntaxError) {
		// It's a JSON syntax error, which is expected
	} else {
		t.Errorf("Expected a JSON syntax error, but got: %v", errDecrypt)
	}
}

func TestDecryptConfig_KeyringError(t *testing.T) {
	t.Cleanup(func() { resetMocks(t) })
	service := NewEncryptionService()
	var config domain.Config
	keyringError := errors.New("failed to get key from keyring for decrypt")

	// Mock keyringGet to return an error during decryption attempt
	keyringGet = func(service, username string) (string, error) {
		return "", keyringError
	}
	// Mock randReader to succeed if getEncryptionKey generates a new key
	deterministicKeyBytes := bytes.Repeat([]byte{0xDD}, keySize)
	randReader = bytes.NewReader(deterministicKeyBytes) // Provide data for potential new key gen

	// Provide some valid-looking encrypted data (content doesn't matter)
	// IMPORTANT: This data was likely encrypted with a DIFFERENT key than the one
	// getEncryptionKey will generate after the keyring error.
	encryptedData := base64.StdEncoding.EncodeToString([]byte("nonce1234567ciphertext"))

	err := service.DecryptConfig(encryptedData, &config)

	// --- Assert ---
	// Expect a decryption error because getEncryptionKey handled the keyring error
	// internally, generated a *different* key, and decryption failed.
	require.Error(t, err)
	assert.Contains(t, err.Error(), "failed to decrypt data") // Check for the wrapper error
	// Optionally check the underlying error is related to GCM failure
	underlyingError := errors.Unwrap(err)
	require.NotNil(t, underlyingError)
	assert.Contains(t, underlyingError.Error(), "message authentication failed")

	// DO NOT assert ErrorIs(keyringError) because it was handled internally.
	// assert.ErrorIs(t, err, keyringError) // This is INCORRECT
}
