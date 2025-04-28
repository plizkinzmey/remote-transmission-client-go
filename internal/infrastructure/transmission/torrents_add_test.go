package transmission

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/hekmon/cunits/v2"
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestAdd(t *testing.T) {
	ctx := context.Background()
	testURL := "magnet:?xt=urn:btih:examplehash"
	testDir := "/downloads/valid"
	parentDir := filepath.Dir(testDir) // "/downloads"
	invalidDir := "/invalid/path"
	invalidParentDir := filepath.Dir(invalidDir) // "/" or "."
	base64Data := "dGVzdCB0b3JyZW50IGRhdGE="     // "test torrent data"
	base64URL := "data:application/x-bittorrent;base64," + base64Data

	// Helper to create client with mock RPC
	createClient := func() (*TransmissionClient, *MockRPCClient) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		return client, mockRPC
	}

	t.Run("Success_URL_NoDir", func(t *testing.T) {
		client, mockRPC := createClient()
		// No validation (FreeSpace) call expected
		expectedPayload := transmissionrpc.TorrentAddPayload{
			Filename: ptr(testURL),
		}
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, nil).Once()

		err := client.Add(testURL, "")
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_URL_WithDir", func(t *testing.T) {
		client, mockRPC := createClient()
		// Expect successful validation via FreeSpace on parentDir
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			Filename:    ptr(testURL),
			DownloadDir: ptr(testDir),
		}
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, nil).Once()

		err := client.Add(testURL, testDir)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_Base64", func(t *testing.T) {
		client, mockRPC := createClient()
		// Expect successful validation via FreeSpace on parentDir
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Data),
			DownloadDir: ptr(testDir),
		}
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, nil).Once()

		err := client.Add(base64URL, testDir)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	// --- Test Validation Failures (by mocking FreeSpace errors) ---

	t.Run("Error_ValidateDownloadPath_PermissionDenied", func(t *testing.T) {
		client, mockRPC := createClient()
		validationErr := errors.New(errPermissionDenied) // Error returned by FreeSpace

		// Expect FreeSpace call on the PARENT directory to fail
		mockRPC.On("FreeSpace", ctx, invalidParentDir).Return(cunits.Bits(0), cunits.Bits(0), validationErr).Once()

		err := client.Add(testURL, invalidDir) // Use invalidDir

		// Assert that Add returns the specific localized error from checkAccessibility, wrapped
		assert.Error(t, err)
		var localizedErr *LocalizedError
		require.ErrorAs(t, err, &localizedErr)
		assert.Equal(t, "errors.directoryAccessDenied", localizedErr.key)
		assert.Contains(t, err.Error(), "invalid download directory") // Check wrapping message

		mockRPC.AssertExpectations(t)
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
	})

	t.Run("Error_ValidateDownloadPath_NoSuchDirectory", func(t *testing.T) {
		client, mockRPC := createClient()
		validationErr := errors.New(errNoSuchFileOrDirectory) // Error returned by FreeSpace

		// Expect FreeSpace call on the PARENT directory to fail
		mockRPC.On("FreeSpace", ctx, invalidParentDir).Return(cunits.Bits(0), cunits.Bits(0), validationErr).Once()

		err := client.Add(testURL, invalidDir) // Use invalidDir

		assert.Error(t, err)
		var localizedErr *LocalizedError
		require.ErrorAs(t, err, &localizedErr)
		assert.Equal(t, "errors.parentDirectoryNotExists", localizedErr.key)
		assert.Contains(t, err.Error(), "invalid download directory") // Check wrapping message

		mockRPC.AssertExpectations(t)
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
	})

	t.Run("Error_ValidateDownloadPath_GenericFreeSpaceError", func(t *testing.T) {
		client, mockRPC := createClient()
		validationErr := errors.New("some generic freespace error") // Error returned by FreeSpace

		// Expect FreeSpace call on the PARENT directory to fail
		mockRPC.On("FreeSpace", ctx, invalidParentDir).Return(cunits.Bits(0), cunits.Bits(0), validationErr).Once()

		err := client.Add(testURL, invalidDir) // Use invalidDir

		assert.Error(t, err)
		var localizedErr *LocalizedError
		require.ErrorAs(t, err, &localizedErr)
		assert.Equal(t, "errors.directoryNotAccessible", localizedErr.key)
		assert.Contains(t, err.Error(), "invalid download directory") // Check wrapping message

		mockRPC.AssertExpectations(t)
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
	})

	// Note: Testing validatePath errors (like empty path) directly on ValidateDownloadPath might be better
	// as Add skips validation for empty downloadDir.

	// --- Test TorrentAdd Failures (after successful validation) ---

	t.Run("Error_RPC_PermissionDenied", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New(errPermissionDenied)

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			Filename:    ptr(testURL),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.Add(testURL, testDir)

		assert.Error(t, err)
		// Check the specific error handling in Add for this RPC error
		assert.EqualError(t, err, fmt.Sprintf(errPermissionDeniedForPath, testDir))
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC_NoSuchFile", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New(errNoSuchFileOrDirectory)

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			Filename:    ptr(testURL),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.Add(testURL, testDir)

		assert.Error(t, err)
		// Check the specific error handling in Add for this RPC error
		assert.EqualError(t, err, fmt.Sprintf(errDirectoryDoesNotExist, testDir))
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC_Generic", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New("some other rpc error")

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			Filename:    ptr(testURL),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.Add(testURL, testDir)

		assert.Error(t, err)
		assert.ErrorIs(t, err, rpcErr)                           // Check underlying error
		assert.Contains(t, err.Error(), "failed to add torrent") // Check wrapping message
		mockRPC.AssertExpectations(t)
	})

	// --- Test Base64 Specific Errors (after successful validation) ---

	t.Run("Error_Base64_InvalidFormat", func(t *testing.T) {
		client, mockRPC := createClient()
		invalidBase64URL := "data:invalidstuff"

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		err := client.Add(invalidBase64URL, testDir)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid data URL format")
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
		mockRPC.AssertCalled(t, "FreeSpace", ctx, parentDir) // Verify validation was attempted
	})

	t.Run("Error_Base64_DecodeError", func(t *testing.T) {
		client, mockRPC := createClient()
		invalidBase64URL := "data:application/x-bittorrent;base64,invalid-base64!"

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		err := client.Add(invalidBase64URL, testDir)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "failed to decode base64 data")
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
		mockRPC.AssertCalled(t, "FreeSpace", ctx, parentDir) // Verify validation was attempted
	})

	t.Run("Error_Base64_RPCError", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New("rpc failed during base64 add")

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Data),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.Add(base64URL, testDir)
		assert.Error(t, err)
		assert.ErrorIs(t, err, rpcErr)                           // Check underlying error
		assert.Contains(t, err.Error(), "failed to add torrent") // Check wrapping message
		mockRPC.AssertExpectations(t)
	})
}

func TestAddFile(t *testing.T) {
	ctx := context.Background()
	testDir := "/downloads/valid"
	parentDir := filepath.Dir(testDir)
	invalidDir := "/invalid/path"
	invalidParentDir := filepath.Dir(invalidDir)
	torrentContent := []byte("d10:announceliste13:udp://tracker1ee13:udp://tracker2ee")
	base64Content := base64.StdEncoding.EncodeToString(torrentContent)

	// Create a temporary torrent file
	tmpDir := t.TempDir()
	validFilePath := filepath.Join(tmpDir, "test.torrent")
	err := os.WriteFile(validFilePath, torrentContent, 0644)
	require.NoError(t, err, "Failed to create temp torrent file")

	nonExistentFilePath := filepath.Join(tmpDir, "not_exists.torrent")

	// Helper to create client with mock RPC
	createClient := func() (*TransmissionClient, *MockRPCClient) {
		mockRPC := new(MockRPCClient)
		client := &TransmissionClient{client: mockRPC, ctx: ctx}
		return client, mockRPC
	}

	t.Run("Success_NoDir", func(t *testing.T) {
		client, mockRPC := createClient()
		// No validation (FreeSpace) call expected
		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo: ptr(base64Content),
		}
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, nil).Once()

		err := client.AddFile(validFilePath, "")
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_WithDir", func(t *testing.T) {
		client, mockRPC := createClient()
		// Expect successful validation via FreeSpace on parentDir
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Content),
			DownloadDir: ptr(testDir),
		}
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, nil).Once()

		err := client.AddFile(validFilePath, testDir)
		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	// --- Test Validation Failures (by mocking FreeSpace errors) ---

	t.Run("Error_ValidateDownloadPath_PermissionDenied", func(t *testing.T) {
		client, mockRPC := createClient()
		validationErr := errors.New(errPermissionDenied)

		// Expect FreeSpace call on the PARENT directory to fail
		mockRPC.On("FreeSpace", ctx, invalidParentDir).Return(cunits.Bits(0), cunits.Bits(0), validationErr).Once()

		err := client.AddFile(validFilePath, invalidDir) // Use invalidDir

		assert.Error(t, err)
		var localizedErr *LocalizedError
		require.ErrorAs(t, err, &localizedErr)
		assert.Equal(t, "errors.directoryAccessDenied", localizedErr.key)
		assert.Contains(t, err.Error(), "invalid download directory") // Check wrapping message

		mockRPC.AssertExpectations(t)
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
	})

	t.Run("Error_ValidateDownloadPath_NoSuchDirectory", func(t *testing.T) {
		client, mockRPC := createClient()
		validationErr := errors.New(errNoSuchFileOrDirectory)

		// Expect FreeSpace call on the PARENT directory to fail
		mockRPC.On("FreeSpace", ctx, invalidParentDir).Return(cunits.Bits(0), cunits.Bits(0), validationErr).Once()

		err := client.AddFile(validFilePath, invalidDir) // Use invalidDir

		assert.Error(t, err)
		var localizedErr *LocalizedError
		require.ErrorAs(t, err, &localizedErr)
		assert.Equal(t, "errors.parentDirectoryNotExists", localizedErr.key)
		assert.Contains(t, err.Error(), "invalid download directory") // Check wrapping message

		mockRPC.AssertExpectations(t)
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
	})

	// --- Test File Read Error (after successful validation) ---

	t.Run("Error_FileReadError", func(t *testing.T) {
		client, mockRPC := createClient()
		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		err := client.AddFile(nonExistentFilePath, testDir) // Use non-existent file

		assert.Error(t, err)
		assert.ErrorIs(t, err, os.ErrNotExist)                         // Check underlying error
		assert.Contains(t, err.Error(), "failed to read torrent file") // Check wrapping message
		mockRPC.AssertNotCalled(t, "TorrentAdd", mock.Anything, mock.Anything)
		mockRPC.AssertCalled(t, "FreeSpace", ctx, parentDir) // Verify validation was attempted
	})

	// --- Test TorrentAdd Failures (after successful validation and file read) ---

	t.Run("Error_RPC_PermissionDenied", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New(errPermissionDenied)

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Content),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.AddFile(validFilePath, testDir)

		assert.Error(t, err)
		// Check the specific error handling in AddFile for this RPC error
		assert.EqualError(t, err, fmt.Sprintf(errPermissionDeniedForPath, testDir))
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC_NoSuchFile", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New(errNoSuchFileOrDirectory)

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Content),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.AddFile(validFilePath, testDir)

		assert.Error(t, err)
		// Check the specific error handling in AddFile for this RPC error
		assert.EqualError(t, err, fmt.Sprintf(errDirectoryDoesNotExist, testDir))
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC_Generic", func(t *testing.T) {
		client, mockRPC := createClient()
		rpcErr := errors.New("some other rpc error")

		// Expect successful validation via FreeSpace
		mockRPC.On("FreeSpace", ctx, parentDir).Return(cunits.Bits(1024*1024*1024), cunits.Bits(2048*1024*1024), nil).Once()

		expectedPayload := transmissionrpc.TorrentAddPayload{
			MetaInfo:    ptr(base64Content),
			DownloadDir: ptr(testDir),
		}
		// TorrentAdd fails
		mockRPC.On("TorrentAdd", ctx, expectedPayload).Return(transmissionrpc.Torrent{}, rpcErr).Once()

		err := client.AddFile(validFilePath, testDir)

		assert.Error(t, err)
		assert.ErrorIs(t, err, rpcErr)                                     // Check underlying error
		assert.Contains(t, err.Error(), "failed to add torrent from file") // Check wrapping message
		mockRPC.AssertExpectations(t)
	})
}
