package infrastructure

import (
	"bytes"
	"encoding/base64"
	"io"
	"testing"
	"transmission-client-go/internal/domain"

	"crypto/rand" // Import crypto/rand for the original reader

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/zalando/go-keyring" // Import for keyring.ErrNotFound
)

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

// TODO: Add tests for error cases:
// - EncryptConfig: Marshal error, keyring error (other than NotFound), cipher/GCM errors, nonce generation error
// - DecryptConfig: Empty data, Base64 decode error, keyring error, cipher/GCM errors, ciphertext too short, GCM Open error, Unmarshal error
// - getEncryptionKey: Keyring decode error, rand.Reader error (PBKDF2 path), machineIDGetter error (PBKDF2 path), keyringSet error
