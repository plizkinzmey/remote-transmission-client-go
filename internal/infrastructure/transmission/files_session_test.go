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

// Helper to create client with mock RPC for session/path tests
func createClientForSessionTests() (*TransmissionClient, *MockRPCClient) {
	mockRPC := new(MockRPCClient)
	client := &TransmissionClient{client: mockRPC, ctx: context.Background()}
	return client, mockRPC
}

func TestGetDefaultDownloadDir(t *testing.T) {
	ctx := context.Background()
	expectedFields := []string{"download-dir"}

	t.Run("Success", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()
		expectedDir := "/data/downloads"
		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: ptr(expectedDir),
		}

		mockRPC.On("SessionArgumentsGet", ctx, expectedFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDefaultDownloadDir()

		assert.NoError(t, err)
		assert.Equal(t, expectedDir, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()
		expectedErr := errors.New("rpc session get error")

		mockRPC.On("SessionArgumentsGet", ctx, expectedFields).Return(transmissionrpc.SessionArguments{}, expectedErr).Once()

		result, err := client.GetDefaultDownloadDir()

		assert.Error(t, err)
		assert.Empty(t, result)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to get default download directory")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_DownloadDirNil", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()
		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: nil, // Simulate missing field
		}

		mockRPC.On("SessionArgumentsGet", ctx, expectedFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDefaultDownloadDir()

		assert.Error(t, err)
		assert.Empty(t, result)
		assert.EqualError(t, err, "default download directory not available")
		mockRPC.AssertExpectations(t)
	})
}

func TestGetSessionStats(t *testing.T) {
	ctx := context.Background()
	sessionFields := []string{"download-dir", "version"}
	testDownloadDir := "/data/downloads"
	testVersion := "4.0.0"

	t.Run("Success", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()

		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: ptr(testDownloadDir),
			Version:     ptr(testVersion),
		}
		mockStats := transmissionrpc.SessionStats{
			DownloadSpeed: 1000, // Bytes/s
			UploadSpeed:   500,  // Bytes/s
		}
		mockFreeSpace := cunits.Bits(1024 * 1024 * 1024 * 8) // 1 GiB in bits

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()
		mockRPC.On("SessionStats", ctx).Return(mockStats, nil).Once()
		mockRPC.On("FreeSpace", ctx, testDownloadDir).Return(mockFreeSpace, cunits.Bits(0), nil).Once() // Total size doesn't matter here

		expectedResult := &domain.SessionStats{
			TotalDownloadSpeed:  1000,
			TotalUploadSpeed:    500,
			FreeSpace:           1024 * 1024 * 1024, // Expected in Bytes
			TransmissionVersion: testVersion,
		}

		result, err := client.GetSessionStats()

		assert.NoError(t, err)
		assert.Equal(t, expectedResult, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_SessionArgumentsGet", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()
		expectedErr := errors.New("rpc session args error")

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(transmissionrpc.SessionArguments{}, expectedErr).Once()

		result, err := client.GetSessionStats()

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to get session info")
		mockRPC.AssertNotCalled(t, "SessionStats", mock.Anything)
		mockRPC.AssertNotCalled(t, "FreeSpace", mock.Anything, mock.Anything)
	})

	t.Run("Error_SessionStats", func(t *testing.T) {
		client, mockRPC := createClientForSessionTests()
		expectedErr := errors.New("rpc session stats error")
		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: ptr(testDownloadDir),
			Version:     ptr(testVersion),
		}

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()
		mockRPC.On("SessionStats", ctx).Return(transmissionrpc.SessionStats{}, expectedErr).Once()

		result, err := client.GetSessionStats()

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to get session stats")
		mockRPC.AssertNotCalled(t, "FreeSpace", mock.Anything, mock.Anything)
		mockRPC.AssertExpectations(t) // SessionArgumentsGet and SessionStats were called
	})

	t.Run("Error_FreeSpace", func(t *testing.T) {
		// FreeSpace error should not prevent returning stats, just sets FreeSpace to 0
		client, mockRPC := createClientForSessionTests()
		expectedErr := errors.New("rpc freespace error")

		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: ptr(testDownloadDir),
			Version:     ptr(testVersion),
		}
		mockStats := transmissionrpc.SessionStats{
			DownloadSpeed: 2000,
			UploadSpeed:   1000,
		}

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()
		mockRPC.On("SessionStats", ctx).Return(mockStats, nil).Once()
		mockRPC.On("FreeSpace", ctx, testDownloadDir).Return(cunits.Bits(0), cunits.Bits(0), expectedErr).Once() // FreeSpace fails

		expectedResult := &domain.SessionStats{
			TotalDownloadSpeed:  2000,
			TotalUploadSpeed:    1000,
			FreeSpace:           0, // Expect 0 on FreeSpace error
			TransmissionVersion: testVersion,
		}

		// We don't check the error here, as the function logs it but continues
		result, err := client.GetSessionStats()

		assert.NoError(t, err) // The function itself doesn't return the FreeSpace error
		assert.Equal(t, expectedResult, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_MissingDownloadDir", func(t *testing.T) {
		// Missing DownloadDir should result in FreeSpace 0, but otherwise succeed
		client, mockRPC := createClientForSessionTests()

		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: nil, // Missing
			Version:     ptr(testVersion),
		}
		mockStats := transmissionrpc.SessionStats{
			DownloadSpeed: 3000,
			UploadSpeed:   1500,
		}

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()
		mockRPC.On("SessionStats", ctx).Return(mockStats, nil).Once()
		// FreeSpace should NOT be called if DownloadDir is nil

		expectedResult := &domain.SessionStats{
			TotalDownloadSpeed:  3000,
			TotalUploadSpeed:    1500,
			FreeSpace:           0, // Expect 0 when DownloadDir is nil
			TransmissionVersion: testVersion,
		}

		result, err := client.GetSessionStats()

		assert.NoError(t, err)
		assert.Equal(t, expectedResult, result)
		mockRPC.AssertNotCalled(t, "FreeSpace", mock.Anything, mock.Anything)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_MissingVersion", func(t *testing.T) {
		// Missing Version should result in "unknown" version string
		client, mockRPC := createClientForSessionTests()

		mockSessionArgs := transmissionrpc.SessionArguments{
			DownloadDir: ptr(testDownloadDir),
			Version:     nil, // Missing
		}
		mockStats := transmissionrpc.SessionStats{
			DownloadSpeed: 4000,
			UploadSpeed:   2000,
		}
		mockFreeSpace := cunits.Bits(512 * 1024 * 1024 * 8) // 512 MiB in bits

		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()
		mockRPC.On("SessionStats", ctx).Return(mockStats, nil).Once()
		mockRPC.On("FreeSpace", ctx, testDownloadDir).Return(mockFreeSpace, cunits.Bits(0), nil).Once()

		expectedResult := &domain.SessionStats{
			TotalDownloadSpeed:  4000,
			TotalUploadSpeed:    2000,
			FreeSpace:           512 * 1024 * 1024, // Bytes
			TransmissionVersion: "unknown",         // Expect "unknown"
		}

		result, err := client.GetSessionStats()

		assert.NoError(t, err)
		assert.Equal(t, expectedResult, result)
		mockRPC.AssertExpectations(t)
	})
}

// --- Add tests for SaveDownloadPath, RemoveDownloadPath, etc. in files_paths_test.go ---
