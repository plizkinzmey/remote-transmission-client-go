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
	ctx     context.Context
	service *application.TorrentService
}

type Config struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// Initialize initializes the transmission client with the given configuration
func (a *App) Initialize(config string) error {
	var cfg infrastructure.TransmissionConfig
	if err := json.Unmarshal([]byte(config), &cfg); err != nil {
		return err
	}

	client, err := infrastructure.NewTransmissionClient(cfg)
	if err != nil {
		return err
	}

	a.service = application.NewTorrentService(client)
	return nil
}

// GetTorrents returns all torrents
func (a *App) GetTorrents() ([]domain.Torrent, error) {
	return a.service.GetAllTorrents()
}

// AddTorrent adds a new torrent by URL
func (a *App) AddTorrent(url string) error {
	return a.service.AddTorrent(url)
}

// RemoveTorrent removes a torrent by ID
func (a *App) RemoveTorrent(id int64, deleteData bool) error {
	return a.service.RemoveTorrent(id, deleteData)
}
