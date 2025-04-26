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

// Helper function to create pointers for basic types, useful for transmissionrpc fields
func ptr[T any](v T) *T {
	return &v
}

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
				LeftUntilDone:  ptr(int64(128)),        // 256 * 0.5 = 128 Bytes left
				DownloadedEver: ptr(int64(128)),        // Added: 256 - 128 = 128 Bytes downloaded
				RateDownload:   ptr(int64(100)),
				RateUpload:     ptr(int64(50)),
				UploadedEver:   ptr(int64(64)),    // Example upload
				UploadRatio:    ptr(float64(0.5)), // 64 / 128 = 0.5
				PeersConnected: ptr(int64(5)),     // Corrected type: int64
				TrackerStats:   []transmissionrpc.TrackerStats{{SeederCount: 10, LeecherCount: 20}},
			},
			{
				ID:             ptr(int64(2)),
				Name:           ptr("Torrent Two - Seeding"),
				Status:         ptr(transmissionrpc.TorrentStatusSeed),
				PercentDone:    ptr(float64(1.0)),
				SizeWhenDone:   ptr(cunits.Bits(1024)), // 128 Bytes total
				LeftUntilDone:  ptr(int64(0)),
				DownloadedEver: ptr(int64(128)), // Added: 128 Bytes downloaded
				RateDownload:   ptr(int64(0)),
				RateUpload:     ptr(int64(200)),
				UploadedEver:   ptr(int64(256)), // 256 / 128 = 2.0 ratio
				UploadRatio:    ptr(float64(2.0)),
				PeersConnected: ptr(int64(8)), // Corrected type: int64
				TrackerStats:   []transmissionrpc.TrackerStats{{SeederCount: 5, LeecherCount: 15}},
				UploadLimited:  ptr(true),
			},
		}

		// Expected result after conversion - UPDATED
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     1,
				Name:                   "Torrent One",
				Status:                 domain.StatusDownloading,
				Progress:               50.0,
				Size:                   256,                 // Corrected: 2048 bits / 8 = 256 bytes
				SizeFormatted:          "128.0 B / 256.0 B", // Corrected: formatBytes(128) / formatBytes(256)
				UploadRatio:            0.5,
				SeedsConnected:         5, // Corrected: Matches PeersConnected from test data
				SeedsTotal:             10,
				PeersConnected:         5, // Corrected: Matches PeersConnected from test data
				PeersTotal:             20,
				UploadedBytes:          64,       // Corrected: Matches UploadedEver
				UploadedFormatted:      "64.0 B", // Corrected: Added .0
				DownloadSpeed:          100,
				UploadSpeed:            50,
				DownloadSpeedFormatted: "100.0 B/s", // Corrected: Added .0
				UploadSpeedFormatted:   "50.0 B/s",  // Corrected: Added .0
				IsSlowMode:             false,
			},
			{
				ID:                     2,
				Name:                   "Torrent Two - Seeding",
				Status:                 domain.StatusSeeding,
				Progress:               100.0,
				Size:                   128,       // Corrected: 1024 bits / 8 = 128 bytes
				SizeFormatted:          "128.0 B", // Corrected: formatBytes(128)
				UploadRatio:            2.0,
				SeedsConnected:         8, // Corrected: Matches PeersConnected from test data
				SeedsTotal:             5,
				PeersConnected:         8, // Corrected: Matches PeersConnected from test data
				PeersTotal:             15,
				UploadedBytes:          256,       // Corrected: Matches UploadedEver
				UploadedFormatted:      "256.0 B", // Corrected: formatBytes(256)
				DownloadSpeed:          0,
				UploadSpeed:            200,
				DownloadSpeedFormatted: "0 B/s",     // Corrected: formatBytes(0) is "0 B"
				UploadSpeedFormatted:   "200.0 B/s", // Corrected: Added .0
				IsSlowMode:             true,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, mock.Anything).Return(rpcTorrents, nil).Once()

		result, err := client.GetAll()

		assert.NoError(t, err)
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
				PercentDone:     ptr(float64(0.0)),      // Should be ignored
				SizeWhenDone:    ptr(cunits.Bits(1024)), // 128 Bytes
				LeftUntilDone:   ptr(int64(128)),        // Assuming 0 downloaded
				DownloadedEver:  ptr(int64(0)),          // Added: Bytes downloaded
				RateDownload:    ptr(int64(0)),
				RateUpload:      ptr(int64(0)),
				UploadedEver:    ptr(int64(0)),
				UploadRatio:     ptr(float64(0.0)),
				PeersConnected:  ptr(int64(0)), // Corrected type: int64
				TrackerStats:    []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result - UPDATED
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     3,
				Name:                   "Torrent Checking",
				Status:                 domain.StatusChecking,
				Progress:               75.0,      // Based on RecheckProgress
				Size:                   128,       // Corrected: 1024 bits / 8 = 128 bytes
				SizeFormatted:          "128.0 B", // Corrected: formatBytes(128)
				UploadRatio:            0.0,
				SeedsConnected:         0, // Corrected: Matches PeersConnected
				SeedsTotal:             0,
				PeersConnected:         0, // Corrected: Matches PeersConnected
				PeersTotal:             0,
				UploadedBytes:          0,
				UploadedFormatted:      "0 B", // Corrected: formatBytes(0)
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s", // Corrected: formatBytes(0) + "/s"
				UploadSpeedFormatted:   "0 B/s", // Corrected: formatBytes(0) + "/s"
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
				LeftUntilDone:  ptr(int64(0)),
				DownloadedEver: ptr(int64(128)), // Added: Bytes downloaded
				RateDownload:   ptr(int64(0)),
				RateUpload:     ptr(int64(0)),
				UploadedEver:   ptr(int64(64)),    // Example upload
				UploadRatio:    ptr(float64(0.5)), // 64 / 128 = 0.5
				PeersConnected: ptr(int64(0)),     // Corrected type: int64
				TrackerStats:   []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result - UPDATED
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     4,
				Name:                   "Torrent Completed",
				Status:                 domain.StatusCompleted,
				Progress:               100.0,
				Size:                   128,       // Corrected: 1024 bits / 8 = 128 bytes
				SizeFormatted:          "128.0 B", // Corrected: formatBytes(128)
				UploadRatio:            0.5,
				SeedsConnected:         0, // Corrected: Matches PeersConnected
				SeedsTotal:             0,
				PeersConnected:         0, // Corrected: Matches PeersConnected
				PeersTotal:             0,
				UploadedBytes:          64,       // Corrected: Matches UploadedEver
				UploadedFormatted:      "64.0 B", // Corrected: Added .0
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s", // Corrected: formatBytes(0) + "/s"
				UploadSpeedFormatted:   "0 B/s", // Corrected: formatBytes(0) + "/s"
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
				LeftUntilDone:  ptr(int64(26)),         // 128 * 0.2 = 25.6 -> ~26 bytes left
				DownloadedEver: ptr(int64(102)),        // Added: 128 - 26 = 102 bytes downloaded
				RateDownload:   ptr(int64(0)),
				RateUpload:     ptr(int64(0)),
				UploadedEver:   ptr(int64(100)),
				UploadRatio:    ptr(float64(0.98)), // 100 / 102 ~ 0.98
				PeersConnected: ptr(int64(0)),      // Corrected type: int64
				TrackerStats:   []transmissionrpc.TrackerStats{},
			},
		}

		// Expected result - UPDATED
		expectedDomainTorrents := []domain.Torrent{
			{
				ID:                     5,
				Name:                   "Torrent Stopped",
				Status:                 domain.StatusStopped,
				Progress:               80.0,
				Size:                   128,       // Corrected: 1024 bits / 8 = 128 bytes
				SizeFormatted:          "128.0 B", // Corrected: formatBytes(128)
				UploadRatio:            0.98,      // Corrected based on Uploaded/Downloaded
				SeedsConnected:         0,         // Corrected: Matches PeersConnected
				SeedsTotal:             0,
				PeersConnected:         0, // Corrected: Matches PeersConnected
				PeersTotal:             0,
				UploadedBytes:          100,
				UploadedFormatted:      "100.0 B", // Corrected: Added .0
				DownloadSpeed:          0,
				UploadSpeed:            0,
				DownloadSpeedFormatted: "0 B/s", // Corrected: formatBytes(0) + "/s"
				UploadSpeedFormatted:   "0 B/s", // Corrected: formatBytes(0) + "/s"
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
