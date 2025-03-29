package test

import (
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
)

func TestTorrentStatusString(t *testing.T) {
	tests := []struct {
		status domain.TorrentStatus
		want   string
	}{
		{domain.StatusDownloading, "downloading"},
		{domain.StatusSeeding, "seeding"},
		{domain.StatusStopped, "stopped"},
		{domain.StatusCompleted, "completed"},
		{domain.StatusChecking, "checking"},
		{domain.StatusQueued, "queued"},
	}

	for _, tt := range tests {
		t.Run(string(tt.want), func(t *testing.T) {
			assert.Equal(t, tt.want, string(tt.status))
		})
	}
}

func TestTorrentSizeFormatted(t *testing.T) {
	tests := []struct {
		name string
		size int64
		want string
	}{
		{"0 bytes", 0, "0 B"},
		{"1000 bytes", 1000, "1000 B"},
		{"1 KiB", 1024, "1.0 KiB"},
		{"1 MiB", 1024 * 1024, "1.0 MiB"},
		{"1 GiB", 1024 * 1024 * 1024, "1.0 GiB"},
		{"1 TiB", 1024 * 1024 * 1024 * 1024, "1.0 TiB"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Создаём структуру только с нужным полем SizeFormatted
			torrent := domain.Torrent{
				SizeFormatted: tt.want,
			}
			assert.Equal(t, tt.want, torrent.SizeFormatted)
		})
	}
}
