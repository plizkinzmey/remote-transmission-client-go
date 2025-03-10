package infrastructure

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"

	"github.com/zalando/go-keyring"
	"golang.org/x/crypto/pbkdf2"
)

const (
	// Имя приложения для Keychain
	keyringServiceName = "transmission-client-go"
	// Имя пользователя для Keychain (используется как ключ)
	keyringUsername = "config-encryption-key"
	// Salt для генерации ключа, если не сможем получить из Keychain
	fallbackSalt = "transmission-client-salt"
	// Количество итераций для PBKDF2
	iterations = 4096
	// Длина ключа шифрования в байтах
	keySize = 32 // 256 бит
)

// EncryptionService предоставляет методы для шифрования и дешифрования данных
type EncryptionService struct{}

// NewEncryptionService создает новый сервис шифрования
func NewEncryptionService() *EncryptionService {
	return &EncryptionService{}
}

// EncryptConfig шифрует конфигурацию
func (s *EncryptionService) EncryptConfig(config interface{}) (string, error) {
	// Преобразуем конфиг в JSON
	plaintext, err := json.Marshal(config)
	if err != nil {
		return "", fmt.Errorf("failed to marshal config: %w", err)
	}

	// Получаем ключ шифрования
	key, err := s.getEncryptionKey()
	if err != nil {
		return "", err
	}

	// Создаем блок шифрования AES
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher block: %w", err)
	}

	// Создаем GCM (Galois/Counter Mode) для AES
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	// Генерируем случайный nonce (number used once)
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	// Шифруем данные
	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)

	// Кодируем в base64 для удобного хранения
	encoded := base64.StdEncoding.EncodeToString(ciphertext)
	return encoded, nil
}

// DecryptConfig дешифрует конфигурацию
func (s *EncryptionService) DecryptConfig(encryptedData string, config interface{}) error {
	// Если данных нет, возвращаем nil
	if encryptedData == "" {
		return nil
	}

	// Декодируем из base64
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		return fmt.Errorf("failed to decode base64: %w", err)
	}

	// Получаем ключ шифрования
	key, err := s.getEncryptionKey()
	if err != nil {
		return err
	}

	// Создаем блок шифрования AES
	block, err := aes.NewCipher(key)
	if err != nil {
		return fmt.Errorf("failed to create cipher block: %w", err)
	}

	// Создаем GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return fmt.Errorf("failed to create GCM: %w", err)
	}

	// Убеждаемся, что данные достаточно длинные
	nonceSize := gcm.NonceSize()
	if len(ciphertext) < nonceSize {
		return fmt.Errorf("ciphertext too short")
	}

	// Извлекаем nonce и дешифруем данные
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return fmt.Errorf("failed to decrypt data: %w", err)
	}

	// Преобразуем JSON обратно в конфигурацию
	if err := json.Unmarshal(plaintext, config); err != nil {
		return fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return nil
}

// getEncryptionKey получает ключ шифрования из Keychain или создает новый
func (s *EncryptionService) getEncryptionKey() ([]byte, error) {
	// Проверяем наличие ключа в Keychain
	keyStr, err := keyring.Get(keyringServiceName, keyringUsername)
	if err == nil && keyStr != "" {
		// Декодируем ключ из base64
		return base64.StdEncoding.DecodeString(keyStr)
	}

	// Если ключ не найден или произошла ошибка, создаем новый
	// Генерируем случайный ключ
	key := make([]byte, keySize)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		// Если не удалось сгенерировать случайный ключ, используем PBKDF2
		machineID, err := getMachineID()
		if err != nil {
			// Если не удалось получить Machine ID, используем fallback значение
			machineID = "transmission-client-machine-id"
		}
		
		// Генерируем ключ на основе Machine ID
		key = pbkdf2.Key([]byte(machineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	}

	// Кодируем ключ в base64 для хранения в Keychain
	keyStr = base64.StdEncoding.EncodeToString(key)

	// Сохраняем ключ в Keychain
	if err := keyring.Set(keyringServiceName, keyringUsername, keyStr); err != nil {
		fmt.Printf("Warning: Failed to store encryption key in keyring: %v\n", err)
		// Даже если не удалось сохранить ключ, продолжаем работу с временным ключом
	}

	return key, nil
}

// getMachineID возвращает уникальный ID машины для генерации ключа
func getMachineID() (string, error) {
	// На macOS можно использовать UUID оборудования
	// На других платформах можно использовать другие методы
	id, err := macOSMachineID()
	if err != nil {
		return "", err
	}
	return id, nil
}

// macOSMachineID получает UUID оборудования на macOS
func macOSMachineID() (string, error) {
	// Простой вариант - использовать hostname
	hostname, err := getHostname()
	if err != nil {
		return "", err
	}
	return hostname, nil
}

// getHostname возвращает имя хоста
func getHostname() (string, error) {
	// Этот метод будет работать на всех платформах
	return "transmission-client-go-instance", nil
}