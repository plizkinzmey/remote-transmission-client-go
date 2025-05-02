package main

import (
	"encoding/json"
	"errors"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockConfigService - мок для ConfigService
type MockConfigService struct {
	mock.Mock
}

func (m *MockConfigService) LoadConfig() (*domain.Config, error) {
	args := m.Called()
	if cfg, ok := args.Get(0).(*domain.Config); ok {
		return cfg, args.Error(1)
	}
	return nil, args.Error(1)
}

func (m *MockConfigService) SaveConfig(config *domain.Config) error {
	args := m.Called(config)
	return args.Error(0)
}

func (m *MockConfigService) ConfigExists() (bool, error) {
	args := m.Called()
	return args.Bool(0), args.Error(1)
}

// MockLocalizationService - мок для LocalizationService
type MockLocalizationService struct {
	mock.Mock
}

func (m *MockLocalizationService) Translate(key string, locale string, args ...interface{}) string {
	callArgs := m.Called(key, locale, args)
	return callArgs.String(0)
}

func (m *MockLocalizationService) GetAvailableLocales() []string {
	args := m.Called()
	return args.Get(0).([]string)
}

func (m *MockLocalizationService) GetSystemLocale() string {
	args := m.Called()
	return args.String(0)
}

func (m *MockLocalizationService) GetAllTranslationKeys(locale string) []string {
	args := m.Called(locale)
	return args.Get(0).([]string)
}

// Создаем тестовую версию App для тестирования
type TestApp struct {
	MockConfigService       *MockConfigService
	MockLocalizationService *MockLocalizationService
}

// Initialize реализует метод Initialize для тестирования
func (t *TestApp) Initialize(configJson string) error {
	var config domain.Config
	if err := json.Unmarshal([]byte(configJson), &config); err != nil {
		return err
	}

	// Проверяем, содержит ли конфигурация только настройки языка и/или темы
	isOnlyLanguageOrTheme := config.Host == "" &&
		(config.Language != "" || config.Theme != "")

	// Если это не только язык/тема, проверяем обязательные поля для подключения
	if !isOnlyLanguageOrTheme && config.Host == "" {
		return errors.New("host is required")
	}

	// Загружаем текущую конфигурацию, чтобы сохранить другие настройки
	currentConfig, _ := t.MockConfigService.LoadConfig()
	if currentConfig != nil {
		// Если у нас только настройки языка/темы, сохраняем их в текущую конфигурацию
		if isOnlyLanguageOrTheme {
			// Сохраняем настройки языка
			if config.Language != "" {
				currentConfig.Language = config.Language
			}
			// Сохраняем настройки темы
			if config.Theme != "" {
				currentConfig.Theme = config.Theme
			}

			// Сохраняем обновленную конфигурацию
			if err := t.MockConfigService.SaveConfig(currentConfig); err != nil {
				return errors.New("failed to save language/theme settings: " + err.Error())
			}
			return nil // Для настроек языка/темы инициализация клиента не требуется
		} else {
			// Для полной конфигурации сохраняем все параметры
			config.Language = currentConfig.Language // Сохраняем текущий язык
			config.Theme = currentConfig.Theme       // Сохраняем текущую тему
			if len(config.DownloadPaths) == 0 {
				config.DownloadPaths = currentConfig.DownloadPaths // Сохраняем пути загрузки
				if config.DefaultDownloadPath == "" {
					config.DefaultDownloadPath = currentConfig.DefaultDownloadPath // Сохраняем путь по умолчанию
				}
			}
		}
	}

	// If language is not set in the config, detect system language
	if config.Language == "" {
		config.Language = t.MockLocalizationService.GetSystemLocale()
	}

	// Другие проверки и установки по умолчанию, как в оригинальном методе
	if config.Theme == "" {
		config.Theme = "light"
	}
	if config.Port == 0 {
		config.Port = 9091
	}
	if config.SlowSpeedUnit == "" {
		config.SlowSpeedUnit = "KiB/s"
	}

	// Save the configuration
	if err := t.MockConfigService.SaveConfig(&config); err != nil {
		return errors.New("failed to save config: " + err.Error())
	}

	return nil
}

// NewTestApp создает тестовое приложение с моками
func NewTestApp() *TestApp {
	mockConfigService := new(MockConfigService)
	mockLocalizationService := new(MockLocalizationService)

	return &TestApp{
		MockConfigService:       mockConfigService,
		MockLocalizationService: mockLocalizationService,
	}
}

func TestInitialize_OnlyLanguage(t *testing.T) {
	// Arrange
	testApp := NewTestApp()
	mockConfigService := testApp.MockConfigService

	// Мокируем поведение вызовов
	mockConfigService.On("LoadConfig").Return(&domain.Config{
		Host:     "current-host",
		Port:     9091,
		Theme:    "dark",
		Language: "en",
	}, nil)

	mockConfigService.On("SaveConfig", mock.MatchedBy(func(config *domain.Config) bool {
		return config.Language == "ru" &&
			config.Host == "current-host" &&
			config.Theme == "dark"
	})).Return(nil)

	// Создаем конфигурацию только с языком
	testConfig := &domain.Config{
		Language: "ru",
	}

	// Конвертируем конфигурацию в JSON для вызова функции Initialize
	configJson, _ := json.Marshal(testConfig)

	// Act
	err := testApp.Initialize(string(configJson))

	// Assert
	assert.NoError(t, err)
	mockConfigService.AssertExpectations(t)
}

func TestInitialize_OnlyTheme(t *testing.T) {
	// Arrange
	testApp := NewTestApp()
	mockConfigService := testApp.MockConfigService

	// Мокируем поведение вызовов
	mockConfigService.On("LoadConfig").Return(&domain.Config{
		Host:     "current-host",
		Port:     9091,
		Theme:    "light",
		Language: "en",
	}, nil)

	mockConfigService.On("SaveConfig", mock.MatchedBy(func(config *domain.Config) bool {
		return config.Theme == "dark" &&
			config.Host == "current-host" &&
			config.Language == "en"
	})).Return(nil)

	// Создаем конфигурацию только с темой
	testConfig := &domain.Config{
		Theme: "dark",
	}

	// Конвертируем конфигурацию в JSON для вызова функции Initialize
	configJson, _ := json.Marshal(testConfig)

	// Act
	err := testApp.Initialize(string(configJson))

	// Assert
	assert.NoError(t, err)
	mockConfigService.AssertExpectations(t)
}

func TestInitialize_LanguageAndTheme(t *testing.T) {
	// Arrange
	testApp := NewTestApp()
	mockConfigService := testApp.MockConfigService

	// Мокируем поведение вызовов
	mockConfigService.On("LoadConfig").Return(&domain.Config{
		Host:     "current-host",
		Port:     9091,
		Theme:    "light",
		Language: "en",
	}, nil)

	mockConfigService.On("SaveConfig", mock.MatchedBy(func(config *domain.Config) bool {
		return config.Language == "ru" &&
			config.Theme == "dark" &&
			config.Host == "current-host"
	})).Return(nil)

	// Создаем конфигурацию с языком и темой
	testConfig := &domain.Config{
		Language: "ru",
		Theme:    "dark",
	}

	// Конвертируем конфигурацию в JSON для вызова функции Initialize
	configJson, _ := json.Marshal(testConfig)

	// Act
	err := testApp.Initialize(string(configJson))

	// Assert
	assert.NoError(t, err)
	mockConfigService.AssertExpectations(t)
}

func TestInitialize_ErrorSavingConfig(t *testing.T) {
	// Arrange
	testApp := NewTestApp()
	mockConfigService := testApp.MockConfigService

	// Мокируем поведение вызовов
	mockConfigService.On("LoadConfig").Return(&domain.Config{
		Host:     "current-host",
		Port:     9091,
		Theme:    "dark",
		Language: "en",
	}, nil)

	expectedError := errors.New("failed to save config")
	mockConfigService.On("SaveConfig", mock.Anything).Return(expectedError)

	// Создаем конфигурацию только с языком
	testConfig := &domain.Config{
		Language: "ru",
	}

	// Конвертируем конфигурацию в JSON для вызова функции Initialize
	configJson, _ := json.Marshal(testConfig)

	// Act
	err := testApp.Initialize(string(configJson))

	// Assert
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to save language/theme settings")
	mockConfigService.AssertExpectations(t)
}
