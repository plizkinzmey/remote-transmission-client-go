package transmission

import (
	"context"
	"errors"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
)

func TestSetTorrentSpeedLimit(t *testing.T) {
	ctx := context.Background()
	testIDs := []int64{10}
	downLimit := int64(100) // KiB/s
	upLimit := int64(50)    // KiB/s

	t.Run("Success_BothLimits", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(true),
			DownloadLimit:   ptr(downLimit),
			UploadLimit:     ptr(upLimit),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetTorrentSpeedLimit(testIDs, downLimit, upLimit)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_DownloadLimitOnly", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(false), // Explicitly set UploadLimited to false
			DownloadLimit:   ptr(downLimit),
			// UploadLimit is not set when limit is 0
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetTorrentSpeedLimit(testIDs, downLimit, 0)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_UploadLimitOnly", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(false), // Explicitly set DownloadLimited to false
			UploadLimited:   ptr(true),
			// DownloadLimit is not set when limit is 0
			UploadLimit: ptr(upLimit),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetTorrentSpeedLimit(testIDs, 0, upLimit)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_NoLimits_Disable", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(false),
			UploadLimited:   ptr(false),
			// DownloadLimit and UploadLimit are not set
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetTorrentSpeedLimit(testIDs, 0, 0)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc set failed")
		// Payload doesn't matter much here, just needs IDs
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(true),
			DownloadLimit:   ptr(downLimit),
			UploadLimit:     ptr(upLimit),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(expectedErr).Once()

		err := client.SetTorrentSpeedLimit(testIDs, downLimit, upLimit)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		// Note: The function doesn't wrap the error currently
		// assert.Contains(t, err.Error(), "failed to set speed limit")
		mockRPC.AssertExpectations(t)
	})
}

func TestSetSpeedLimitFromConfig(t *testing.T) {
	ctx := context.Background()
	testIDs := []int64{20}
	configKiB := domain.Config{SlowSpeedLimit: 50, SlowSpeedUnit: "KiB/s"}
	configMiB := domain.Config{SlowSpeedLimit: 2, SlowSpeedUnit: "MiB/s"}
	limitKiB := int64(50)
	limitMiB := int64(2 * 1024) // 2 MiB/s in KiB/s

	t.Run("Success_SlowModeOn_KiB", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(true),
			DownloadLimit:   ptr(limitKiB),
			UploadLimit:     ptr(limitKiB),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetSpeedLimitFromConfig(testIDs, configKiB, true)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_SlowModeOn_MiB", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(true),
			DownloadLimit:   ptr(limitMiB),
			UploadLimit:     ptr(limitMiB),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetSpeedLimitFromConfig(testIDs, configMiB, true)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_SlowModeOff", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(false),
			UploadLimited:   ptr(false),
			// Limits not set
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		// Config values don't matter when isSlowMode is false
		err := client.SetSpeedLimitFromConfig(testIDs, configKiB, false)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc set failed during config apply")
		// Expected payload for slow mode on (KiB)
		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:             testIDs,
			DownloadLimited: ptr(true),
			UploadLimited:   ptr(true),
			DownloadLimit:   ptr(limitKiB),
			UploadLimit:     ptr(limitKiB),
		}
		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(expectedErr).Once()

		err := client.SetSpeedLimitFromConfig(testIDs, configKiB, true)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		// Note: The function doesn't wrap the error currently
		mockRPC.AssertExpectations(t)
	})
}
