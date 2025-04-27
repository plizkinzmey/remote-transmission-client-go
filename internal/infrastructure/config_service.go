package infrastructure

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"transmission-client-go/internal/domain"
)

// ErrConfigNotExists возвращается, когда файл конфигурации не существует
var ErrConfigNotExists = errors.New("config file does not exist")

// ConfigFormat представляет формат файла конфигурации
type ConfigFormat struct {
	// Зашифрованные данные конфигурации
	EncryptedData string `json:"encryptedData"`
}

// configPathGetter defines the function signature for getting the config path
type configPathGetter func() (string, error)

// IConfigService defines the interface for config operations
type IConfigService interface {
	LoadConfig() (*domain.Config, error)
	SaveConfig(config *domain.Config) error
	ConfigExists() (bool, error)
}

// Переменные для мокирования OS функций (перенесены из _test.go)
var (
	osUserConfigDir = os.UserConfigDir
	osStat          = os.Stat
	osReadFile      = os.ReadFile
	osMkdirAll      = os.MkdirAll
	osWriteFile     = os.WriteFile
	// Переменная для мокирования json.MarshalIndent
	jsonMarshalIndent = json.MarshalIndent
)

// ConfigService предоставляет методы для работы с конфигурацией
// Убедимся, что ConfigService реализует IConfigService
var _ IConfigService = (*ConfigService)(nil)

type ConfigService struct {
	encryptionService IEncryptionService
	// Внедренная зависимость для получения пути
	pathGetter configPathGetter
}

// realGetConfigPath содержит реальную логику получения пути
func realGetConfigPath() (string, error) {
	// Используем переменную osUserConfigDir
	configDir, err := osUserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user config directory: %w", err)
	}
	return filepath.Join(configDir, "transmission-client", "config.json"), nil
}

// NewConfigService создает новый сервис конфигурации
func NewConfigService() *ConfigService { // Возвращаем конкретный тип, но он реализует интерфейс
	return &ConfigService{
		encryptionService: NewEncryptionService(),
		// Инициализируем реальной функцией
		pathGetter: realGetConfigPath,
	}
}

// LoadConfig загружает конфигурацию из файла
func (s *ConfigService) LoadConfig() (*domain.Config, error) {
	// Используем внедренный pathGetter
	configPath, err := s.pathGetter()
	if err != nil {
		return nil, fmt.Errorf("failed to determine config path: %w", err)
	}

	// Проверяем, существует ли файл конфигурации, используя переменную osStat
	if _, err := osStat(configPath); err != nil {
		if os.IsNotExist(err) {
			return nil, ErrConfigNotExists
		}
		// Возвращаем другую ошибку Stat как ошибку чтения
		return nil, fmt.Errorf("failed to stat config file: %w", err)
	}

	// Читаем файл конфигурации, используя переменную osReadFile
	data, err := osReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// Проверяем, является ли файл старым форматом (без шифрования)
	var config domain.Config
	if err := json.Unmarshal(data, &config); err == nil && config.Host != "" {
		// Это старый формат, сразу возвращаем его и мигрируем при следующем сохранении
		return &config, nil
	}

	// Парсим новый формат с шифрованием
	var configFormat ConfigFormat
	if err := json.Unmarshal(data, &configFormat); err != nil {
		// Если парсинг нового формата не удался, возможно, это старый формат, но с ошибкой
		// или просто поврежденный файл. Возвращаем ошибку парсинга.
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Если нет зашифрованных данных, возвращаем nil
	if configFormat.EncryptedData == "" {
		// Это может быть валидный, но пустой новый формат
		return &domain.Config{}, nil // Возвращаем пустой конфиг, а не nil
	}

	// Расшифровываем данные
	var decryptedConfig domain.Config
	if err := s.encryptionService.DecryptConfig(configFormat.EncryptedData, &decryptedConfig); err != nil {
		return nil, fmt.Errorf("failed to decrypt config: %w", err)
	}

	return &decryptedConfig, nil
}

// SaveConfig сохраняет конфигурацию в файл
func (s *ConfigService) SaveConfig(config *domain.Config) error {
	// Используем внедренный pathGetter
	configPath, err := s.pathGetter()
	if err != nil {
		return fmt.Errorf("failed to determine config path: %w", err)
	}

	// Создаем директорию для конфигурации, если она не существует, используя переменную osMkdirAll
	configDir := filepath.Dir(configPath)
	if err := osMkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	// Шифруем конфигурацию
	encryptedData, err := s.encryptionService.EncryptConfig(config)
	if err != nil {
		return fmt.Errorf("failed to encrypt config: %w", err)
	}

	// Создаем новый формат конфигурации
	configFormat := ConfigFormat{
		EncryptedData: encryptedData,
	}

	// Сериализуем конфигурацию в JSON, используя переменную jsonMarshalIndent
	data, err := jsonMarshalIndent(configFormat, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Записываем в файл, используя переменную osWriteFile
	if err := osWriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// ConfigExists проверяет существование файла конфигурации
// Возвращает три возможных состояния:
// - true, nil: файл существует
// - false, nil: файл не существует (ожидаемое отсутствие)
// - false, error: произошла ошибка при проверке (неожиданная ошибка)
func (s *ConfigService) ConfigExists() (bool, error) {
	// Используем внедренный pathGetter
	configPath, err := s.pathGetter()
	if err != nil {
		// Ошибка получения пути - это ошибка операции
		return false, fmt.Errorf("failed to determine config path: %w", err)
	}

	// Используем переменную osStat
	_, err = osStat(configPath)
	if err == nil {
		return true, nil // Файл существует
	}
	if os.IsNotExist(err) {
		return false, nil // Файл не существует, это не ошибка для этой функции
	}
	// Любая другая ошибка Stat означает, что мы не можем достоверно сказать, существует ли файл
	// Возвращаем false и саму ошибку Stat
	return false, fmt.Errorf("failed to check config file status: %w", err)
}
