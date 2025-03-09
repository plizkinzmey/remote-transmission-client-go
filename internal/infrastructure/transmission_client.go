package infrastructure

import (
	"context"
	"fmt"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v2"
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
	client, err := transmissionrpc.New(config.Host, config.Username, config.Password,
		&transmissionrpc.AdvancedConfig{
			Port: uint16(config.Port),
		})
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

func (c *TransmissionClient) Add(url string) error {
	_, err := c.client.TorrentAdd(c.ctx, transmissionrpc.TorrentAddPayload{
		Filename: &url,
	})
	if err != nil {
		return fmt.Errorf("failed to add torrent: %w", err)
	}
	return nil
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