package transmission

import (
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
)

func TestMapStatus(t *testing.T) {
	// Test cases for mapStatus function to cover all branches
	testCases := []struct {
		name           string
		rpcStatus      transmissionrpc.TorrentStatus
		percentDone    *float64 // Use pointer to handle nil case if necessary
		expectedStatus domain.TorrentStatus
	}{
		{"Stopped_Completed", transmissionrpc.TorrentStatusStopped, ptr(1.0), domain.StatusCompleted},
		{"Stopped_Incomplete", transmissionrpc.TorrentStatusStopped, ptr(0.5), domain.StatusStopped},
		{"CheckWait", transmissionrpc.TorrentStatusCheckWait, ptr(0.1), domain.StatusQueuedCheck},
		{"Check", transmissionrpc.TorrentStatusCheck, ptr(0.2), domain.StatusChecking},
		{"DownloadWait", transmissionrpc.TorrentStatusDownloadWait, ptr(0.3), domain.StatusQueuedDown},
		{"Download", transmissionrpc.TorrentStatusDownload, ptr(0.4), domain.StatusDownloading},
		{"SeedWait", transmissionrpc.TorrentStatusSeedWait, ptr(1.0), domain.StatusQueued}, // Queued for seeding
		{"Seed", transmissionrpc.TorrentStatusSeed, ptr(1.0), domain.StatusSeeding},
		{"UnknownStatus", transmissionrpc.TorrentStatus(999), ptr(0.6), domain.StatusStopped}, // Default case
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create a minimal torrent struct needed for the logic
			torrent := transmissionrpc.Torrent{
				PercentDone: tc.percentDone,
				// Other fields are not relevant for mapStatus logic itself
			}
			actualStatus := mapStatus(tc.rpcStatus, torrent)
			assert.Equal(t, tc.expectedStatus, actualStatus)
		})
	}
}
