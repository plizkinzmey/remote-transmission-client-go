package infrastructure

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
)

type TransmissionConfig struct {
	Host     string
	Port     int
	Username string
	Password string
}

type TransmissionClient struct {
	client *transmissionrpc.Client
	ctx    context.Context
}

func NewTransmissionClient(config TransmissionConfig) (*TransmissionClient, error) {
	// Формируем URL для подключения
	var endpoint url.URL
	endpoint.Scheme = "http"
	if strings.HasPrefix(config.Host, "https://") {
		endpoint.Scheme = "https"
	}

	// Очищаем хост от протокола
	host := strings.TrimPrefix(config.Host, "http://")
	host = strings.TrimPrefix(host, "https://")
	
	// Убираем любой path из хоста, если он есть
	if idx := strings.Index(host, "/"); idx != -1 {
		host = host[:idx]
	}
	
	endpoint.Host = fmt.Sprintf("%s:%d", host, config.Port)
	
	// Добавляем стандартный RPC path
	endpoint.Path = "/transmission/rpc"

	// Добавляем учетные данные в URL, если они предоставлены
	if config.Username != "" {
		endpoint.User = url.UserPassword(config.Username, config.Password)
	}

	// Создаем клиент
	client, err := transmissionrpc.New(&endpoint, &transmissionrpc.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create transmission client: %w", err)
	}

	return &TransmissionClient{
		client: client,
		ctx:    context.Background(),
	}, nil
}

func (c *TransmissionClient) GetAll() ([]domain.Torrent, error) {
	torrents, err := c.client.TorrentGet(c.ctx, []string{
		"id", "name", "status", "percentDone", "totalSize",
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get torrents: %w", err)
	}

	result := make([]domain.Torrent, len(torrents))
	for i, t := range torrents {
		status := mapStatus(*t.Status)
		result[i] = domain.Torrent{
			ID:       *t.ID,
			Name:     *t.Name,
			Status:   status,
			Progress: *t.PercentDone * 100,
			Size:     int64(t.TotalSize.Byte()),
		}
	}
	return result, nil
}

func (c *TransmissionClient) Start(ids []int64) error {
	err := c.client.TorrentStartIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to start torrents: %w", err)
	}
	return nil
}

func (c *TransmissionClient) Stop(ids []int64) error {
	err := c.client.TorrentStopIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to stop torrents: %w", err)
	}
	return nil
}

func (c *TransmissionClient) Add(url string) error {
	if strings.HasPrefix(url, "data:") {
		// Если это base64-закодированный файл
		return c.addFromBase64(url)
	}

	// Обычная ссылка или магнет-ссылка
	_, err := c.client.TorrentAdd(c.ctx, transmissionrpc.TorrentAddPayload{
		Filename: &url,
	})
	if err != nil {
		return fmt.Errorf("failed to add torrent: %w", err)
	}
	return nil
}

func (c *TransmissionClient) AddFile(filepath string) error {
	// Используем TorrentAddFile для добавления локального файла
	_, err := c.client.TorrentAddFile(c.ctx, filepath)
	if err != nil {
		return fmt.Errorf("failed to add torrent from file: %w", err)
	}
	return nil
}

// addFromBase64 обрабатывает base64-закодированный торрент файл
func (c *TransmissionClient) addFromBase64(dataUrl string) error {
	// Извлекаем base64-данные из data URL
	parts := strings.Split(dataUrl, ",")
	if len(parts) != 2 {
		return fmt.Errorf("invalid data URL format")
	}

	// Декодируем base64
	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}

	// Создаем временный файл
	tmpDir, err := os.MkdirTemp("", "transmission-client")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	tmpFile := filepath.Join(tmpDir, "temp.torrent")
	if err := os.WriteFile(tmpFile, data, 0600); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	// Используем TorrentAddFile для добавления временного файла
	return c.AddFile(tmpFile)
}

func (c *TransmissionClient) Remove(id int64, deleteData bool) error {
	payload := transmissionrpc.TorrentRemovePayload{
		IDs:             []int64{id},
		DeleteLocalData: deleteData,
	}
	err := c.client.TorrentRemove(c.ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to remove torrent: %w", err)
	}
	return nil
}

func mapStatus(status transmissionrpc.TorrentStatus) domain.TorrentStatus {
	switch status {
	case transmissionrpc.TorrentStatusStopped:
		return domain.StatusStopped
	case transmissionrpc.TorrentStatusDownload:
		return domain.StatusDownloading
	case transmissionrpc.TorrentStatusSeed:
		return domain.StatusSeeding
	default:
		return domain.StatusStopped
	}
}
