package infrastructure

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log" // Добавляем стандартный пакет логирования
	"os"

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

// Определяем типы функций для мокирования
type keyringGetterFunc func(service, username string) (string, error)
type keyringSetterFunc func(service, username, password string) error
type machineIDGetterFunc func() (string, error)

// Переменные для хранения реальных или мок-функций
var (
	keyringGet      keyringGetterFunc   = keyring.Get
	keyringSet      keyringSetterFunc   = keyring.Set
	randReader      io.Reader           = rand.Reader
	machineIDGetter machineIDGetterFunc = getMachineID
)

// IEncryptionService defines the interface for encryption operations
type IEncryptionService interface {
	EncryptConfig(config interface{}) (string, error)
	DecryptConfig(encryptedData string, config interface{}) error
}

// EncryptionService предоставляет методы для шифрования и дешифрования данных
// Убедимся, что EncryptionService реализует IEncryptionService
var _ IEncryptionService = (*EncryptionService)(nil)

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
	if _, err := io.ReadFull(randReader, nonce); err != nil {
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
	// Проверяем наличие ключа в Keychain, используя переменную keyringGet
	keyStr, err := keyringGet(keyringServiceName, keyringUsername)
	if err == nil && keyStr != "" {
		// Декодируем ключ из base64
		keyBytes, decodeErr := base64.StdEncoding.DecodeString(keyStr)
		if decodeErr != nil {
			// Если ключ в keyring поврежден, генерируем новый
			log.Printf("Warning: Failed to decode key from keyring: %v. Generating new key.", decodeErr)
		} else {
			return keyBytes, nil
		}
	}
	// Игнорируем ошибку keyring.ErrNotFound, но логируем другие ошибки
	if err != nil && !errors.Is(err, keyring.ErrNotFound) {
		log.Printf("Warning: Failed to get key from keyring: %v. Generating new key.", err)
	}

	// Если ключ не найден или произошла ошибка, создаем новый
	// Генерируем случайный ключ, используя переменную randReader
	key := make([]byte, keySize)
	if _, errGen := io.ReadFull(randReader, key); errGen != nil {
		log.Printf("Warning: Failed to generate random key: %v. Using fallback PBKDF2 key.", errGen)
		// Если не удалось сгенерировать случайный ключ, используем PBKDF2
		// Используем переменную machineIDGetter
		machineID, errID := machineIDGetter()
		if errID != nil {
			log.Printf("Warning: Failed to get machine ID: %v. Using fallback machine ID.", errID)
			machineID = "transmission-client-machine-id"
		}

		// Генерируем ключ на основе Machine ID
		key = pbkdf2.Key([]byte(machineID), []byte(fallbackSalt), iterations, keySize, sha256.New)
	}

	// Кодируем ключ в base64 для хранения в Keychain
	keyStr = base64.StdEncoding.EncodeToString(key)

	// Сохраняем ключ в Keychain, используя переменную keyringSet
	if errSet := keyringSet(keyringServiceName, keyringUsername, keyStr); errSet != nil {
		log.Printf("Warning: Failed to store encryption key in keyring: %v", errSet)
	}

	return key, nil
}

// getMachineID возвращает уникальный ID машины для генерации ключа
func getMachineID() (string, error) {
	id, err := macOSMachineID()
	if err != nil {
		hostname, hostErr := getHostname()
		if hostErr != nil {
			return "", fmt.Errorf("failed to get macOS machine ID (%w) and hostname (%w)", err, hostErr)
		}
		return hostname, nil
	}
	return id, nil
}

// macOSMachineID получает UUID оборудования на macOS
func macOSMachineID() (string, error) {
	return "", errors.New("macOS UUID not implemented yet")
}

// getHostname возвращает имя хоста
func getHostname() (string, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return "", fmt.Errorf("failed to get hostname: %w", err)
	}
	return "tx-client-" + hostname, nil
}
