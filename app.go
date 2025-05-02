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

	// для запуска Swift-хелпера
	goruntime "runtime" // стандартный runtime с псевдонимом

	"github.com/gen2brain/beeep"                            // Добавлено для уведомлений
	wailsRuntime "github.com/wailsapp/wails/v2/pkg/runtime" // добавлено
)

// App struct
type App struct {
	ctx                 context.Context
	service             *application.TorrentService
	configService       *infrastructure.ConfigService
	localizationService *infrastructure.LocalizationService
	pendingTorrentFiles []string // Массив для хранения путей к торрент-файлам
	logger              *log.Logger
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
		logger:              log.Default(), // добавлено для логирования
	}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Отправляем события для всех отложенных торрент-файлов
	go func() {
		time.Sleep(1 * time.Second) // задержка 1 секунда

		// Обрабатываем массив путей к торрент-файлам
		for _, file := range a.pendingTorrentFiles {
			wailsRuntime.EventsEmit(a.ctx, "torrent-opened", file)
		}
		// Очищаем массив после обработки
		a.pendingTorrentFiles = nil
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

	// Проверяем, содержит ли конфигурация только настройки языка и/или темы
	isOnlyLanguageOrTheme := config.Host == "" &&
		(config.Language != "" || config.Theme != "")

	// Если это не только язык/тема, проверяем обязательные поля для подключения
	if !isOnlyLanguageOrTheme && config.Host == "" {
		return fmt.Errorf("host is required")
	}

	// Загружаем текущую конфигурацию, чтобы сохранить другие настройки
	currentConfig, _ := a.configService.LoadConfig()
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
			if err := a.configService.SaveConfig(currentConfig); err != nil {
				return fmt.Errorf("failed to save language/theme settings: %w", err)
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
		config.Language = a.localizationService.GetSystemLocale()
	}

	// If theme is not set, use default
	if config.Theme == "" {
		config.Theme = "light"
	}

	// Ensure default values for optional fields
	if config.Port == 0 {
		config.Port = 9091
	}
	if config.SlowSpeedUnit == "" {
		config.SlowSpeedUnit = "KiB/s"
	}

	// Save the configuration
	if err := a.configService.SaveConfig(&config); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Если это только настройки языка/темы, не инициализируем клиент
	if isOnlyLanguageOrTheme {
		return nil
	}

	// Create client with config for full configuration
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

// GetAllTranslationKeys returns all translation keys for the specified locale
func (a *App) GetAllTranslationKeys(locale string) []string {
	return a.localizationService.GetAllTranslationKeys(locale)
}

// GetSessionStats returns statistics about the current session
func (a *App) GetSessionStats() (*domain.SessionStats, error) {
	if a.service == nil {
		return nil, transmission.NewServiceNotInitializedError()
	}
	return a.service.GetSessionStats()
}

// GetTorrents returns all torrents
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	if a.service == nil {
		return nil, transmission.NewServiceNotInitializedError()
	}
	return a.service.GetAllTorrents()
}

// AddTorrent adds a new torrent by URL
func (a *App) AddTorrent(url string, downloadDir string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.AddTorrent(url, downloadDir)
}

// AddTorrentFile adds a torrent from a base64-encoded file
func (a *App) AddTorrentFile(base64Content string, downloadDir string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
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
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.RemoveTorrent(id, deleteData)
}

// StartTorrents starts the selected torrents
func (a *App) StartTorrents(ids []int64) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.StartTorrents(ids)
}

// StopTorrents stops the selected torrents
func (a *App) StopTorrents(ids []int64) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
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
	if err != nil {
		// Проверяем на ошибку аутентификации
		if _, ok := err.(*transmission.AuthenticationError); ok {
			// Возвращаем локализованную ошибку для UI
			return errors.New("errors.connectionAuthRequired")
		}
		return err
	}
	return nil
}

// GetTorrentFiles returns the list of files in a torrent
func (a *App) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	if a.service == nil {
		return nil, transmission.NewServiceNotInitializedError()
	}
	return a.service.GetTorrentFiles(id)
}

// SetFilesWanted sets whether files should be downloaded
func (a *App) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.SetFilesWanted(id, fileIds, wanted)
}

// SetTorrentSpeedLimit sets the speed limit for the given torrents
func (a *App) SetTorrentSpeedLimit(ids []int64, isSlowMode bool) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.SetTorrentSpeedLimit(ids, isSlowMode)
}

// GetDefaultDownloadDir возвращает каталог загрузки по умолчанию из Transmission
func (a *App) GetDefaultDownloadDir() (string, error) {
	if a.service == nil {
		return "", transmission.NewServiceNotInitializedError()
	}
	return a.service.GetDefaultDownloadDir()
}

// SetDefaultDownloadPath устанавливает указанный путь как путь загрузки по умолчанию
func (a *App) SetDefaultDownloadPath(path string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.SetDefaultDownloadPath(path)
}

// SaveDownloadPath сохраняет путь в историю путей скачивания
func (a *App) SaveDownloadPath(path string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.SaveDownloadPath(path)
}

// GetDownloadPaths возвращает список всех сохраненных путей скачивания
func (a *App) GetDownloadPaths() ([]string, error) {
	if a.service == nil {
		return nil, transmission.NewServiceNotInitializedError()
	}
	return a.service.GetDownloadPaths()
}

// RemoveDownloadPath удаляет путь из истории путей скачивания
func (a *App) RemoveDownloadPath(path string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.RemoveDownloadPath(path)
}

// SavePathsChanges сохраняет изменения путей атомарно
func (a *App) SavePathsChanges(pathsToAdd []string, pathsToRemove []string, defaultPath string) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.SavePaths(pathsToAdd, pathsToRemove, defaultPath)
}

// GetPathsState возвращает текущее состояние путей
func (a *App) GetPathsState() (*domain.PathsState, error) {
	if a.service == nil {
		return nil, transmission.NewServiceNotInitializedError()
	}
	return a.service.GetPathsState()
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
		return transmission.NewServiceNotInitializedError()
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

		// Сохраняем путь к файлу или сразу отправляем событие
		if a.ctx != nil {
			wailsRuntime.EventsEmit(a.ctx, "torrent-opened", filePath)
		} else {
			a.pendingTorrentFiles = append(a.pendingTorrentFiles, filePath)
		}
	}
}

// HandleFilesOpen обрабатывает открытие файлов через систему
func (a *App) HandleFilesOpen(files []string) {
	if len(files) == 0 {
		return
	}

	a.logger.Printf("Handling files open request, count: %d\n", len(files))

	// Проверка на инициализированность контекста
	if a.ctx == nil {
		a.logger.Printf("Context is not initialized, caching file paths for later processing\n")
		// Сохраняем пути к файлам для последующей обработки
		for _, file := range files {
			if a.isTorrentFile(file) {
				a.pendingTorrentFiles = append(a.pendingTorrentFiles, file)
				a.logger.Printf("Cached torrent file path: %s\n", file)
			}
		}
		return
	}

	for _, file := range files {
		if a.isTorrentFile(file) {
			a.logger.Printf("Processing torrent file: %s\n", file)
			// Эмитируем событие с явным указанием контекста
			wailsRuntime.EventsEmit(a.ctx, "torrent-opened", file)
			a.logger.Printf("Emitted torrent-opened event: %s\n", file)
		}
	}
}

// isTorrentFile проверяет, является ли файл торрент-файлом
func (a *App) isTorrentFile(path string) bool {
	return strings.HasSuffix(strings.ToLower(path), ".torrent")
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
		return transmission.NewServiceNotInitializedError()
	}
	return a.service.VerifyTorrent(id)
}

// SaveAllSettings сохраняет все настройки в одной транзакции
func (a *App) SaveAllSettings(connectionSettings map[string]interface{}, pathChanges map[string]interface{}) error {
	if a.service == nil {
		return transmission.NewServiceNotInitializedError()
	}

	// Создаем конфиг из полученных данных
	config := domain.ConnectionConfig{}

	if host, ok := connectionSettings["host"].(string); ok {
		config.Host = host
	}
	if port, ok := connectionSettings["port"].(float64); ok {
		config.Port = int(port)
	}
	if username, ok := connectionSettings["username"].(string); ok {
		config.Username = username
	}
	if password, ok := connectionSettings["password"].(string); ok {
		config.Password = password
	}
	if ratio, ok := connectionSettings["maxUploadRatio"].(float64); ok {
		config.MaxUploadRatio = ratio
	}
	if limit, ok := connectionSettings["slowSpeedLimit"].(float64); ok {
		config.SlowSpeedLimit = int(limit)
	}
	if unit, ok := connectionSettings["slowSpeedUnit"].(string); ok {
		config.SlowSpeedUnit = unit
	}
	if language, ok := connectionSettings["language"].(string); ok {
		config.Language = language
	}
	if theme, ok := connectionSettings["theme"].(string); ok {
		config.Theme = theme
	}

	// Извлекаем изменения путей
	var pathsToAdd, pathsToRemove []string
	var defaultPath string

	if pathChanges != nil {
		if pathsToAddAny, ok := pathChanges["pathsToAdd"]; ok && pathsToAddAny != nil {
			if pathsToAddList, ok := pathsToAddAny.([]interface{}); ok {
				pathsToAdd = make([]string, len(pathsToAddList))
				for i, p := range pathsToAddList {
					if pStr, ok := p.(string); ok {
						pathsToAdd[i] = pStr
					}
				}
			}
		}

		if pathsToRemoveAny, ok := pathChanges["pathsToRemove"]; ok && pathsToRemoveAny != nil {
			if pathsToRemoveList, ok := pathsToRemoveAny.([]interface{}); ok {
				pathsToRemove = make([]string, len(pathsToRemoveList))
				for i, p := range pathsToRemoveList {
					if pStr, ok := p.(string); ok {
						pathsToRemove[i] = pStr
					}
				}
			}
		}

		if defaultPathAny, ok := pathChanges["defaultPath"]; ok && defaultPathAny != nil {
			if dpStr, ok := defaultPathAny.(string); ok {
				defaultPath = dpStr
			}
		}
	}

	return a.service.SaveSettingsWithPaths(config, pathsToAdd, pathsToRemove, defaultPath)
}

// GetTorrentDownloadDirectory возвращает каталог, в который загружается/загружен торрент
func (a *App) GetTorrentDownloadDirectory(id int64) (string, error) {
	if a.service == nil {
		return "", transmission.NewServiceNotInitializedError()
	}
	return a.service.GetTorrentDownloadDirectory(id)
}

// ShowNotification displays a native OS notification.
func (a *App) ShowNotification(title string, message string, level string) error {
	log.Printf("Showing notification: Level=%s, Title=%s, Message=%s", level, title, message)

	iconPath := a.getNotificationIconPath(level)

	// Для UserNotifications нужен минимум macOS 10.14

	// Используем нативный bridge только на macOS
	if goruntime.GOOS == "darwin" {
		showNativeNotification(title, message, iconPath)
		return nil
	}

	// Для других ОС используем beeep
	err := beeep.Notify(title, message, iconPath)
	if err != nil {
		log.Printf("Failed to send notification: %v", err)
		return fmt.Errorf("failed to send notification: %w", err)
	}
	return nil
}

// getNotificationIconPath возвращает путь к иконке в зависимости от уровня уведомления.
// Пока возвращает пустую строку (без иконки).
// TODO: Реализовать логику выбора иконки, если это необходимо.
// Иконки должны быть включены в сборку приложения.
func (a *App) getNotificationIconPath(level string) string {
	// Примерная логика для выбора иконки в зависимости от level
	switch level {
	case "success":
		return "" // В будущем: "assets/icons/success.png" - путь к иконке успеха
	case "error":
		return "" // В будущем: "assets/icons/error.png" - путь к иконке ошибки
	case "warning":
		return "" // В будущем: "assets/icons/warning.png" - путь к иконке предупреждения
	case "info":
		return "" // В будущем: "assets/icons/info.png" - путь к иконке информации
	default:
		return "" // Иконка по умолчанию или без иконки
	}
}

// SaveLanguage сохраняет выбранный пользователем язык
func (a *App) SaveLanguage(language string) error {
	// Загружаем текущую конфигурацию
	config, err := a.configService.LoadConfig()
	if err != nil {
		// Если конфигурация отсутствует, создаем новую
		config = &domain.Config{
			Language: language,
			Theme:    "light", // Значение по умолчанию
		}
	} else {
		// Обновляем язык
		config.Language = language
	}

	// Сохраняем обновленную конфигурацию
	if err := a.configService.SaveConfig(config); err != nil {
		return fmt.Errorf("failed to save language setting: %w", err)
	}

	return nil
}
