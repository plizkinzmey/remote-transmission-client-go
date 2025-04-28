package transmission

import (
	"context"
	"errors"
	"testing"

	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
)

func TestRemove(t *testing.T) {
	ctx := context.Background()
	testID := int64(123)

	t.Run("Success_DeleteDataTrue", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentRemovePayload{
			IDs:             []int64{testID},
			DeleteLocalData: true,
		}
		mockRPC.On("TorrentRemove", ctx, expectedPayload).Return(nil).Once()

		err := client.Remove(testID, true)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_DeleteDataFalse", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedPayload := transmissionrpc.TorrentRemovePayload{
			IDs:             []int64{testID},
			DeleteLocalData: false,
		}
		mockRPC.On("TorrentRemove", ctx, expectedPayload).Return(nil).Once()

		err := client.Remove(testID, false)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		expectedErr := errors.New("rpc remove failed")
		expectedPayload := transmissionrpc.TorrentRemovePayload{
			IDs:             []int64{testID},
			DeleteLocalData: true, // Value doesn't matter for error case
		}
		mockRPC.On("TorrentRemove", ctx, expectedPayload).Return(expectedErr).Once()

		err := client.Remove(testID, true)
		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to remove torrent")
		mockRPC.AssertExpectations(t)
	})
}
