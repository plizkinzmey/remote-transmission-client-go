package transmission

import (
	"context"
	"errors"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStart(t *testing.T) {
	ctx := context.Background()
	testIDs := []int64{1, 2, 3}

	t.Run("Success", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		mockRPC.On("TorrentStartIDs", ctx, testIDs).Return(nil).Once()

		err := client.Start(testIDs)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc start failed")
		mockRPC.On("TorrentStartIDs", ctx, testIDs).Return(expectedErr).Once()

		err := client.Start(testIDs)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to start torrents")
		mockRPC.AssertExpectations(t)
	})
}

func TestStop(t *testing.T) {
	ctx := context.Background()
	testIDs := []int64{4, 5}

	t.Run("Success", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		mockRPC.On("TorrentStopIDs", ctx, testIDs).Return(nil).Once()

		err := client.Stop(testIDs)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc stop failed")
		mockRPC.On("TorrentStopIDs", ctx, testIDs).Return(expectedErr).Once()

		err := client.Stop(testIDs)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to stop torrents")
		mockRPC.AssertExpectations(t)
	})
}

func TestVerifyTorrent(t *testing.T) {
	ctx := context.Background()
	testID := int64(30)

	t.Run("Success", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		mockRPC.On("TorrentVerifyIDs", ctx, []int64{testID}).Return(nil).Once()

		err := client.VerifyTorrent(testID)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc verify failed")
		mockRPC.On("TorrentVerifyIDs", ctx, []int64{testID}).Return(expectedErr).Once()

		err := client.VerifyTorrent(testID)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to verify torrent")
		mockRPC.AssertExpectations(t)
	})
}
