package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"transmission-client-go/internal/application"
	"transmission-client-go/internal/domain"
	"transmission-client-go/internal/infrastructure"
)

// App struct
type App struct {
	ctx     context.Context
	service *application.TorrentService
}

// Error constants
const (
	ErrServiceNotInitialized = "service not initialized, configure connection first"
)

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Initialize initializes the transmission client with the given configuration
func (a *App) Initialize(configJson string) error {
	var config domain.Config
	if err := json.Unmarshal([]byte(configJson), &config); err != nil {
		return err
	}

	// Save the configuration
	if err := a.SaveConfig(&config); err != nil {
		return fmt.Errorf("failed to save config: %w", err)
	}

	// Create a client with the configuration
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

// LoadConfig loads the saved configuration if it exists
func (a *App) LoadConfig() (*domain.Config, error) {
	configPath, err := a.getConfigPath()
	if err != nil {
		return nil, err
	}

	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil // Config does not exist
		}
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var config domain.Config
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to parse config: %w", err)
	}

	return &config, nil
}

// SaveConfig saves the configuration to disk
func (a *App) SaveConfig(config *domain.Config) error {
	configPath, err := a.getConfigPath()
	if err != nil {
		return err
	}

	// Create the config directory if it does not exist
	configDir := filepath.Dir(configPath)
	if err := os.MkdirAll(configDir, 0700); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}

	data, err := json.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(configPath, data, 0600); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	return nil
}

// getConfigPath returns the path to the config file
func (a *App) getConfigPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("failed to get config directory: %w", err)
	}

	return filepath.Join(configDir, "transmission-client", "config.json"), nil
}

// GetTorrents returns all torrents
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	if a.service == nil {
		return nil, fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.GetAllTorrents()
}

// AddTorrent adds a new torrent by URL
func (a *App) AddTorrent(url string) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.AddTorrent(url)
}

// RemoveTorrent removes a torrent by ID
func (a *App) RemoveTorrent(id int64, deleteData bool) error {
	if a.service == nil {
		return fmt.Errorf(ErrServiceNotInitialized)
	}
	return a.service.RemoveTorrent(id, deleteData)
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
