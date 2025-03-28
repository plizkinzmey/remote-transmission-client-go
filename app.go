package main

import (
	"context"
	"encoding/json"
	"errors" // добавлено
	"fmt"
	"log"
	"strings"
	"time" // уже добавлено
	"transmission-client-go/internal/application"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
	"transmission-client-go/internal/infrastructure/transmission"

	"encoding/base64" // добавлено
	"os"              // добавлено

	"github.com/wailsapp/wails/v2/pkg/runtime" // добавлено
)

// App struct
type App struct {
	ctx                 context.Context
	service             *application.TorrentService
	configService       *infrastructure.ConfigService
	localizationService *infrastructure.LocalizationService
	pendingTorrentFile  string
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

	// Независимо от состояния сервиса, через 1 сек решил отправить событие, если pendingTorrentFile установлен.
	go func() {
		time.Sleep(1 * time.Second) // задержка 1 секунда
		if a.pendingTorrentFile != "" {
			runtime.EventsEmit(a.ctx, "torrent-opened", a.pendingTorrentFile)
			a.pendingTorrentFile = ""
		}
	}()

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
	client, err := transmission.NewTransmissionClient(transmission.TransmissionConfig{
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
		return nil, errors.New(ErrServiceNotInitialized) // заменено
	}
	return a.service.GetSessionStats()
}

// GetTorrents returns all torrents
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	if a.service == nil {
		return nil, errors.New(ErrServiceNotInitialized)
	}
	return a.service.GetAllTorrents()
}

// AddTorrent adds a new torrent by URL
func (a *App) AddTorrent(url string, downloadDir string) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.AddTorrent(url, downloadDir)
}

// AddTorrentFile adds a torrent from a base64-encoded file
func (a *App) AddTorrentFile(base64Content string, downloadDir string) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
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
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.RemoveTorrent(id, deleteData)
}

// StartTorrents starts the selected torrents
func (a *App) StartTorrents(ids []int64) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.StartTorrents(ids)
}

// StopTorrents stops the selected torrents
func (a *App) StopTorrents(ids []int64) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.StopTorrents(ids)
}

// TestConnection tests the connection to the Transmission server
func (a *App) TestConnection(configJson string) error {
	var config domain.Config
	if err := json.Unmarshal([]byte(configJson), &config); err != nil {
		return err
	}

	client, err := transmission.NewTransmissionClient(transmission.TransmissionConfig{
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
		return nil, errors.New(ErrServiceNotInitialized)
	}
	return a.service.GetTorrentFiles(id)
}

// SetFilesWanted sets whether files should be downloaded
func (a *App) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.SetFilesWanted(id, fileIds, wanted)
}

// SetTorrentSpeedLimit sets the speed limit for the given torrents
func (a *App) SetTorrentSpeedLimit(ids []int64, isSlowMode bool) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.SetTorrentSpeedLimit(ids, isSlowMode)
}

// GetDefaultDownloadDir возвращает каталог загрузки по умолчанию из Transmission
func (a *App) GetDefaultDownloadDir() (string, error) {
	if a.service == nil {
		return "", errors.New(ErrServiceNotInitialized)
	}
	return a.service.GetDefaultDownloadDir()
}

// SaveDownloadPath сохраняет путь в историю путей скачивания
func (a *App) SaveDownloadPath(path string) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.SaveDownloadPath(path)
}

// GetDownloadPaths возвращает список всех сохраненных путей скачивания
func (a *App) GetDownloadPaths() ([]string, error) {
	if a.service == nil {
		return nil, errors.New(ErrServiceNotInitialized)
	}
	return a.service.GetDownloadPaths()
}

// RemoveDownloadPath удаляет путь из истории путей скачивания
func (a *App) RemoveDownloadPath(path string) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.RemoveDownloadPath(path)
}

// getLocalizedError возвращает локализованное сообщение об ошибке
func (a *App) getLocalizedError(err error) string {
	if locErr, ok := err.(*transmission.LocalizedError); ok {
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
		return errors.New(ErrServiceNotInitialized)
	}
	if err := a.service.ValidateDownloadPath(path); err != nil {
		// Возвращаем локализованное сообщение об ошибке
		return errors.New(a.getLocalizedError(err)) // заменено
	}
	return nil
}

// handleFileOpen обрабатывает открытие файла через систему
func (a *App) handleFileOpen(filePath string) {
	if strings.HasSuffix(strings.ToLower(filePath), ".torrent") {
		log.Print("Получен торрент файл: ", filePath)
		// Устанавливаем pendingTorrentFile для обработки при запуске
		a.pendingTorrentFile = filePath
		// Генерируем событие torrent-opened, если приложение уже запущено
		if a.ctx != nil {
			runtime.EventsEmit(a.ctx, "torrent-opened", filePath)
		}
	}
}

// ReadFile читает содержимое файла и возвращает его в формате Base64
func (a *App) ReadFile(filePath string) (string, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("не удалось прочитать файл: %w", err)
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// VerifyTorrent запускает проверку целостности торрента
func (a *App) VerifyTorrent(id int64) error {
	if a.service == nil {
		return errors.New(ErrServiceNotInitialized)
	}
	return a.service.VerifyTorrent(id)
}
