package main

import (
	"context"
	"encoding/json"
	"fmt"
	"transmission-client-go/internal/application"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
)

// App struct
type App struct {
	ctx          context.Context
	service      *application.TorrentService
	configService *infrastructure.ConfigService
}

// Error constants
const (
	ErrServiceNotInitialized = "service not initialized, configure connection first"
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		configService: infrastructure.NewConfigService(),
	}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	
	// Попробуем автоматически инициализировать с сохраненными настройками
	config, err := a.LoadConfig()
	if err == nil && config != nil {
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

	// Сохраняем конфигурацию
	if err := a.configService.SaveConfig(&config); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Создаем клиент с конфигурацией
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
	return nil
}

// LoadConfig загружает сохраненную конфигурацию если она существует
func (a *App) LoadConfig() (*domain.Config, error) {
	return a.configService.LoadConfig()
}

// GetTorrents возвращает все торренты
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetAllTorrents()
}

// AddTorrent добавляет новый торрент по URL
func (a *App) AddTorrent(url string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.AddTorrent(url)
}

// RemoveTorrent удаляет торрент по ID
func (a *App) RemoveTorrent(id int64, deleteData bool) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.RemoveTorrent(id, deleteData)
}

// TestConnection проверяет соединение с сервером Transmission
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

	// Пробуем получить торренты как тест соединения
	_, err = client.GetAll()
	return err
}
