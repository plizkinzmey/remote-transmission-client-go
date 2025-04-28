package transmission

import (
	"context"
	"errors"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/cunits/v2"
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGetAll(t *testing.T) {
	ctx := context.Background()

	// Define expected fields for TorrentGet call
	expectedFields := []string{
		"id", "name", "status", "percentDone",
		"uploadRatio", "peersConnected", "trackerStats", "uploadedEver",
		"leftUntilDone", "desiredAvailable", "haveValid", "sizeWhenDone",
		"rateDownload", "rateUpload", "downloadedEver",
		"downloadLimit", "uploadLimit", "downloadLimited", "uploadLimited",
		"recheckProgress",
	}

	t.Run("Success", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}

		// Sample data returned by the RPC mock
		rpcTorrents := []transmissionrpc.Torrent{
			{
				ID:             ptr(int64(1)),
				Name:           ptr("Torrent One"),
				Status:         ptr(transmissionrpc.TorrentStatusDownload),
				PercentDone:    ptr(float64(0.5)),
				SizeWhenDone:   ptr(cunits.Bits(2048)), // 256 Bytes total
				LeftUntilDone:  ptr(int64(1024)),       // Corrected: transmission uses bytes for LeftUntilDone. 256 * 0.5 = 128 bytes left. Let's assume API gives bits here for consistency with SizeWhenDone? No, docs say bytes. Let's use bytes. 128 bytes = 1024 bits.
				DownloadedEver: ptr(int64(128)),        // Bytes downloaded
				RateDownload:   ptr(int64(100)),        // Bytes/s
				RateUpload:     ptr(int64(50)),         // Bytes/s
				UploadedEver:   ptr(int64(64)),         // Bytes uploaded
				UploadRatio:    ptr(float64(0.5)),      // 64 / 128 = 0.5
				PeersConnected: ptr(int64(5)),
				TrackerStats:   []transmissionrpc.TrackerStats{{SeederCount: 10, LeecherCount: 20}},
			},
			{
				ID:             ptr(int64(2)),
				Name:           ptr("Torrent Two - Seeding"),
				Status:         ptr(transmissionrpc.TorrentStatusSeed),
				PercentDone:    ptr(float64(1.0)),
				SizeWhenDone:   ptr(cunits.Bits(1024)), // 128 Bytes total
				LeftUntilDone:  ptr(int64(0)),          // Bytes
				DownloadedEver: ptr(int64(128)),        // Bytes downloaded
				RateDownload:   ptr(int64(0)),          // Bytes/s
				RateUpload:     ptr(int64(200)),        // Bytes/s
				UploadedEver:   ptr(int64(256)),        // Bytes uploaded (256 / 128 = 2.0 ratio)
				UploadRatio:    ptr(float64(2.0)),
				PeersConnected: ptr(int64(8)),
				TrackerStats:   []transmissionrpc.TrackerStats{{SeederCount: 5, LeecherCount: 15}},
				UploadLimited:  ptr(true),
			},
		}

		// Expected result after conversion using utils.go helpers
		// Assumes utils.go correctly converts SizeWhenDone (bits) to bytes (total=SizeWhenDone/8)
		// and uses DownloadedEver (bytes) directly.
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     1,
				Name:                   "Torrent One",            // Added missing Name
				Status:                 domain.StatusDownloading, // Added missing Status
				Progress:               50.0,                     // Added missing Progress
				Size:                   256,                      // 2048 / 8
				SizeFormatted:          "128.0 B / 256.0 B",      // Based on downloaded=128, total=256
				UploadRatio:            0.5,
				SeedsConnected:         5,
				SeedsTotal:             10,
				PeersConnected:         5,
				PeersTotal:             20,
				UploadedBytes:          64,
				UploadedFormatted:      "64.0 B",
				DownloadSpeed:          100,
				UploadSpeed:            50,
				DownloadSpeedFormatted: "100.0 B/s",
				UploadSpeedFormatted:   "50.0 B/s",
				IsSlowMode:             false,
			},
			{
				ID:                     2,
				Name:                   "Torrent Two - Seeding",
				Status:                 domain.StatusSeeding,
				Progress:               100.0,
				Size:                   128,       // 1024 / 8
				SizeFormatted:          "128.0 B", // Based on total=128
				UploadRatio:            2.0,
				SeedsConnected:         8,
				SeedsTotal:             5,
				PeersConnected:         8,
				PeersTotal:             15,
				UploadedBytes:          256,
				UploadedFormatted:      "256.0 B",
				DownloadSpeed:          0,
				UploadSpeed:            200,
				DownloadSpeedFormatted: "0 B/s",
				UploadSpeedFormatted:   "200.0 B/s",
				IsSlowMode:             true,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(rpcTorrents, nil).Once()

		result, err := client.GetAll()

		assert.NoError(t, err)
		// Use ElementsMatch for slice comparison where order might not be guaranteed
		// or if subtle differences exist. For exact match, Equal is fine.
		assert.Equal(t, expectedDomainTorrents, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("RPCError", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedError := errors.New("rpc connection failed")

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(nil, expectedError).Once()

		result, err := client.GetAll()

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "failed to get torrents")
		assert.ErrorIs(t, err, expectedError)
		mockRPC.AssertExpectations(t)
	})

	t.Run("AuthError", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		authError := errors.New("server error 401: Unauthorized access")

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(nil, authError).Once()

		result, err := client.GetAll()

		assert.Error(t, err)
		assert.Nil(t, result)
		var authErr *AuthenticationError
		assert.ErrorAs(t, err, &authErr)
		assert.Equal(t, errAuthenticationRequired, authErr.Error())
		mockRPC.AssertExpectations(t)
	})

	t.Run("CheckingStatus", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}

		rpcTorrents := []transmissionrpc.Torrent{
			{
				ID:              ptr(int64(3)),
				Name:            ptr("Torrent Checking"),
				Status:          ptr(transmissionrpc.TorrentStatusCheck),
				RecheckProgress: ptr(float64(0.75)),
				PercentDone:     ptr(float64(0.0)),      // Should be ignored by GetAll logic
				SizeWhenDone:    ptr(cunits.Bits(1024)), // 128 Bytes
				LeftUntilDone:   ptr(int64(128)),        // Bytes
				DownloadedEver:  ptr(int64(0)),          // Bytes downloaded
				RateDownload:    ptr(int64(0)),
				RateUpload:      ptr(int64(0)),
				UploadedEver:    ptr(int64(0)),
				UploadRatio:     ptr(float64(0.0)),
				PeersConnected:  ptr(int64(0)),
				TrackerStats:    []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     3,
				Name:                   "Torrent Checking",
				Status:                 domain.StatusChecking,
				Progress:               75.0,      // Based on RecheckProgress
				Size:                   128,       // 1024 / 8
				SizeFormatted:          "128.0 B", // Based on total=128
				UploadRatio:            0.0,
				SeedsConnected:         0,
				SeedsTotal:             0,
				PeersConnected:         0,
				PeersTotal:             0,
				UploadedBytes:          0,
				UploadedFormatted:      "0 B",
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s",
				UploadSpeedFormatted:   "0 B/s",
				IsSlowMode:             false,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(rpcTorrents, nil).Once()

		result, err := client.GetAll()

		assert.NoError(t, err)
		assert.Equal(t, expectedDomainTorrents, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("CompletedStatus", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}

		rpcTorrents := []transmissionrpc.Torrent{
			{
				ID:             ptr(int64(4)),
				Name:           ptr("Torrent Completed"),
				Status:         ptr(transmissionrpc.TorrentStatusStopped),
				PercentDone:    ptr(float64(1.0)),
				SizeWhenDone:   ptr(cunits.Bits(1024)), // 128 Bytes
				LeftUntilDone:  ptr(int64(0)),          // Bytes
				DownloadedEver: ptr(int64(128)),        // Bytes downloaded
				RateDownload:   ptr(int64(0)),
				RateUpload:     ptr(int64(0)),
				UploadedEver:   ptr(int64(64)),    // Bytes uploaded
				UploadRatio:    ptr(float64(0.5)), // 64 / 128 = 0.5
				PeersConnected: ptr(int64(0)),
				TrackerStats:   []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     4,
				Name:                   "Torrent Completed",
				Status:                 domain.StatusCompleted,
				Progress:               100.0,
				Size:                   128,       // 1024 / 8
				SizeFormatted:          "128.0 B", // Based on total=128
				UploadRatio:            0.5,
				SeedsConnected:         0,
				SeedsTotal:             0,
				PeersConnected:         0,
				PeersTotal:             0,
				UploadedBytes:          64,
				UploadedFormatted:      "64.0 B",
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s",
				UploadSpeedFormatted:   "0 B/s",
				IsSlowMode:             false,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(rpcTorrents, nil).Once()

		result, err := client.GetAll()

		assert.NoError(t, err)
		assert.Equal(t, expectedDomainTorrents, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("StoppedStatus", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}

		rpcTorrents := []transmissionrpc.Torrent{
			{
				ID:             ptr(int64(5)),
				Name:           ptr("Torrent Stopped"),
				Status:         ptr(transmissionrpc.TorrentStatusStopped),
				PercentDone:    ptr(float64(0.8)),      // 80%
				SizeWhenDone:   ptr(cunits.Bits(1024)), // 128 Bytes
				LeftUntilDone:  ptr(int64(26)),         // Bytes left (approx 128 * 0.2)
				DownloadedEver: ptr(int64(102)),        // Bytes downloaded (128 - 26)
				RateDownload:   ptr(int64(0)),
				RateUpload:     ptr(int64(0)),
				UploadedEver:   ptr(int64(100)),    // Bytes uploaded
				UploadRatio:    ptr(float64(0.98)), // 100 / 102 ~ 0.98
				PeersConnected: ptr(int64(0)),
				TrackerStats:   []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     5,
				Name:                   "Torrent Stopped",
				Status:                 domain.StatusStopped,
				Progress:               80.0,
				Size:                   128,       // 1024 / 8
				SizeFormatted:          "128.0 B", // Based on total=128
				UploadRatio:            0.98,
				SeedsConnected:         0,
				SeedsTotal:             0,
				PeersConnected:         0,
				PeersTotal:             0,
				UploadedBytes:          100,
				UploadedFormatted:      "100.0 B",
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s",
				UploadSpeedFormatted:   "0 B/s",
				IsSlowMode:             false,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(rpcTorrents, nil).Once()

		result, err := client.GetAll()

		assert.NoError(t, err)
		assert.Equal(t, expectedDomainTorrents, result)
		mockRPC.AssertExpectations(t)
	})
}
