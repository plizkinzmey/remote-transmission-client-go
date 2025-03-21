package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"transmission-client-go/internal/application"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
)

// App struct
type App struct {
	ctx                 context.Context
	service             *application.TorrentService
	configService       *infrastructure.ConfigService
	localizationService *infrastructure.LocalizationService
}

// Error constants
const (
	ErrServiceNotInitialized = "service not initialized, configure connection first"
)

// NewApp creates a new App application struct
func NewApp() *App {
	// Initialize localization service
	locService, err := infrastructure.NewLocalizationService()
	if err != nil {
		// If we can't initialize localization, fall back to a basic implementation
		fmt.Printf("Failed to initialize localization: %v\n", err)
		locService = &infrastructure.LocalizationService{}
	}

	return &App{
		configService:       infrastructure.NewConfigService(),
		localizationService: locService,
	}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Try to initialize with saved settings
	config, err := a.LoadConfig()
	if err == nil && config != nil {
		// If language is not set in config, detect system language
		if config.Language == "" {
			config.Language = a.localizationService.GetSystemLocale()
			// Save the detected language to config
			_ = a.configService.SaveConfig(config)
		}

		jsonConfig, _ := json.Marshal(config)
		_ = a.Initialize(string(jsonConfig))
	}
}

// Initialize initializes the transmission client with the given configuration
func (a *App) Initialize(configJson string) error {
	var config domain.Config
	if err := json.Unmarshal([]byte(configJson), &config); err != nil {
		return err
	}

	// If language is not set in the config, detect system language
	if config.Language == "" {
		config.Language = a.localizationService.GetSystemLocale()
	}

	// Save the configuration
	if err := a.configService.SaveConfig(&config); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Create client with config
	client, err := infrastructure.NewTransmissionClient(infrastructure.TransmissionConfig{
		Host:     config.Host,
		Port:     config.Port,
		Username: config.Username,
		Password: config.Password,
	})
	if err != nil {
		return err
	}

	a.service = application.NewTorrentService(client)
	// Обновляем конфигурацию в сервисе
	a.service.UpdateConfig(&config)
	return nil
}

// LoadConfig loads saved configuration if it exists
func (a *App) LoadConfig() (*domain.Config, error) {
	return a.configService.LoadConfig()
}

// GetTranslation returns a translated string for the given key and locale with optional parameters
func (a *App) GetTranslation(key string, locale string, args []any) string {
	// Передаем массив аргументов напрямую, без разворачивания через varargs
	return a.localizationService.Translate(key, locale, args...)
}

// GetAvailableLanguages returns all available languages
func (a *App) GetAvailableLanguages() []string {
	return a.localizationService.GetAvailableLocales()
}

// GetSystemLanguage returns the detected system language
func (a *App) GetSystemLanguage() string {
	return a.localizationService.GetSystemLocale()
}

// GetSessionStats returns statistics about the current session
func (a *App) GetSessionStats() (*domain.SessionStats, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetSessionStats()
}

// GetTorrents returns all torrents
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetAllTorrents()
}

// AddTorrent adds a new torrent by URL
func (a *App) AddTorrent(url string, downloadDir string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.AddTorrent(url, downloadDir)
}

// AddTorrentFile adds a torrent from a base64-encoded file
func (a *App) AddTorrentFile(base64Content string, downloadDir string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	// Add the data URL prefix if it doesn't exist
	if !strings.HasPrefix(base64Content, "data:") {
		base64Content = "data:application/x-bittorrent;base64," + base64Content
	}
	return a.service.AddTorrent(base64Content, downloadDir)
}

// RemoveTorrent removes a torrent by ID
func (a *App) RemoveTorrent(id int64, deleteData bool) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.RemoveTorrent(id, deleteData)
}

// StartTorrents starts the selected torrents
func (a *App) StartTorrents(ids []int64) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.StartTorrents(ids)
}

// StopTorrents stops the selected torrents
func (a *App) StopTorrents(ids []int64) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.StopTorrents(ids)
}

// TestConnection tests the connection to the Transmission server
func (a *App) TestConnection(configJson string) error {
	var config domain.Config
	if err := json.Unmarshal([]byte(configJson), &config); err != nil {
		return err
	}

	client, err := infrastructure.NewTransmissionClient(infrastructure.TransmissionConfig{
		Host:     config.Host,
		Port:     config.Port,
		Username: config.Username,
		Password: config.Password,
	})
	if err != nil {
		return err
	}
	// Try to get torrents as a connection test
	_, err = client.GetAll()
	return err
}

// GetTorrentFiles returns the list of files in a torrent
func (a *App) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetTorrentFiles(id)
}

// SetFilesWanted sets whether files should be downloaded
func (a *App) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.SetFilesWanted(id, fileIds, wanted)
}

// SetTorrentSpeedLimit sets the speed limit for the given torrents
func (a *App) SetTorrentSpeedLimit(ids []int64, isSlowMode bool) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.SetTorrentSpeedLimit(ids, isSlowMode)
}

// GetDefaultDownloadDir возвращает каталог загрузки по умолчанию из Transmission
func (a *App) GetDefaultDownloadDir() (string, error) {
	if a.service == nil {
		return "", fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetDefaultDownloadDir()
}

// SaveDownloadPath сохраняет путь в историю путей скачивания
func (a *App) SaveDownloadPath(path string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.SaveDownloadPath(path)
}

// GetDownloadPaths возвращает список всех сохраненных путей скачивания
func (a *App) GetDownloadPaths() ([]string, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetDownloadPaths()
}

// RemoveDownloadPath удаляет путь из истории путей скачивания
func (a *App) RemoveDownloadPath(path string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.RemoveDownloadPath(path)
}

// getLocalizedError возвращает локализованное сообщение об ошибке
func (a *App) getLocalizedError(err error) string {
	if locErr, ok := err.(*infrastructure.LocalizedError); ok {
		// Получаем локализованное сообщение используя метод Translate
		currentConfig, configErr := a.LoadConfig()
		if configErr != nil {
			return err.Error()
		}
		return a.localizationService.Translate(locErr.Error(), currentConfig.Language)
	}
	return err.Error()
}

// ValidateDownloadPath проверяет существование и доступность пути для скачивания
func (a *App) ValidateDownloadPath(path string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	if err := a.service.ValidateDownloadPath(path); err != nil {
		// Возвращаем локализованное сообщение об ошибке
		return fmt.Errorf(a.getLocalizedError(err))
	}
	return nil
}

// handleFileOpen обрабатывает открытие файла через систему
func (a *App) handleFileOpen(filePath string) {
	if a.service == nil {
		fmt.Println("Сервис не инициализирован, файл не будет обработан")
		return
	}

	if strings.HasSuffix(strings.ToLower(filePath), ".torrent") {
		fmt.Printf("Обработка торрент файла: %s\n", filePath)

		// Получаем путь загрузки по умолчанию
		defaultDir, err := a.GetDefaultDownloadDir()
		if err != nil {
			fmt.Printf("Ошибка получения директории по умолчанию: %v\n", err)
			defaultDir = "" // Будет использован стандартный путь Transmission
		}

		// Проверяем путь перед добавлением торрента
		if defaultDir != "" {
			if err := a.ValidateDownloadPath(defaultDir); err != nil {
				fmt.Printf("Ошибка валидации пути по умолчанию: %v\n", err)
				defaultDir = "" // Будет использован стандартный путь Transmission
			}
		}

		// Добавляем торрент файл напрямую через сервис
		err = a.service.AddTorrentFile(filePath, defaultDir)
		if err != nil {
			fmt.Printf("Ошибка добавления торрент файла: %v\n", err)
		} else {
			fmt.Printf("Торрент файл успешно добавлен: %s\n", filePath)
		}
	}
}
