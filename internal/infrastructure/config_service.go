package infrastructure

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"transmission-client-go/internal/domain"
)

// ConfigFormat представляет формат файла конфигурации
type ConfigFormat struct {
	// Зашифрованные данные конфигурации
	EncryptedData string `json:"encryptedData"`
}

// ConfigService предоставляет методы для работы с конфигурацией
type ConfigService struct {
	encryptionService *EncryptionService
}

// NewConfigService создает новый сервис конфигурации
func NewConfigService() *ConfigService {
	return &ConfigService{
		encryptionService: NewEncryptionService(),
	}
}

// LoadConfig загружает конфигурацию из файла
func (s *ConfigService) LoadConfig() (*domain.Config, error) {
	configPath, err := s.getConfigPath()
	if err != nil {
		return nil, err
	}

	// Проверяем, существует ли файл конфигурации
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Если файла нет, возвращаем nil (используем дефолтные настройки)
		return nil, nil
	}

	// Читаем файл конфигурации
	data, err := os.ReadFile(configPath)
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
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Если нет зашифрованных данных, возвращаем nil
	if configFormat.EncryptedData == "" {
		return nil, nil
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
	configPath, err := s.getConfigPath()
	if err != nil {
		return err
	}

	// Создаем директорию для конфигурации, если она не существует
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0700); err != nil {
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

	// Сериализуем конфигурацию в JSON
	data, err := json.MarshalIndent(configFormat, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	// Записываем в файл
	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

// getConfigPath возвращает путь к файлу конфигурации
func (s *ConfigService) getConfigPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to get user config directory: %w", err)
	}

	return filepath.Join(configDir, "transmission-client", "config.json"), nil
}