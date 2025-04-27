package transmission

import (
	"context"
	"errors"
	"fmt" // Import fmt
	"testing"
	"transmission-client-go/internal/domain"

	// Ensure cunits is imported
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/assert"
)

// Helper to create client with mock RPC for file tests
func createClientForFileTests() (*TransmissionClient, *MockRPCClient) {
	mockRPC := new(MockRPCClient)
	client := &TransmissionClient{client: mockRPC, ctx: context.Background()}
	return client, mockRPC
}

func TestGetTorrentFiles(t *testing.T) {
	ctx := context.Background()
	testID := int64(1)
	expectedFields := []string{"files", "fileStats", "name"}

	t.Run("Success", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()

		mockFiles := []transmissionrpc.TorrentFile{
			{Name: "/path/to/file1.mkv", Length: 1024},
			{Name: "/path/to/subdir/file2.txt", Length: 512},
			{Name: "/path/to/file3.zero", Length: 0}, // Zero length file
		}
		mockStats := []transmissionrpc.TorrentFileStat{
			{BytesCompleted: 512, Wanted: true},
			{BytesCompleted: 512, Wanted: true},
			{BytesCompleted: 0, Wanted: false}, // Zero length file, not wanted
		}
		mockTorrents := []transmissionrpc.Torrent{
			{
				Name:      ptr("Test Torrent"),
				Files:     mockFiles,
				FileStats: mockStats,
			},
		}

		expectedResult := []domain.TorrentFile{
			{ID: 0, Name: "file1.mkv", Path: "/path/to/file1.mkv", Size: 1024, Progress: 50.0, Wanted: true},
			{ID: 1, Name: "file2.txt", Path: "/path/to/subdir/file2.txt", Size: 512, Progress: 100.0, Wanted: true},
			{ID: 2, Name: "file3.zero", Path: "/path/to/file3.zero", Size: 0, Progress: 0.0, Wanted: false},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.NoError(t, err)
		assert.Equal(t, expectedResult, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_NoFiles", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()

		mockTorrents := []transmissionrpc.Torrent{
			{
				Name:      ptr("Empty Torrent"),
				Files:     []transmissionrpc.TorrentFile{},
				FileStats: []transmissionrpc.TorrentFileStat{},
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.NoError(t, err)
		assert.Empty(t, result) // Expect an empty slice, not nil
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		expectedErr := errors.New("rpc error")

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(nil, expectedErr).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to get torrent files")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_TorrentNotFound", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockTorrents := []transmissionrpc.Torrent{} // Empty slice means not found

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.EqualError(t, err, "torrent not found")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_MissingFileInfo_FilesNil", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockTorrents := []transmissionrpc.Torrent{
			{
				Name:      ptr("Missing Files"),
				Files:     nil, // Files field is nil
				FileStats: []transmissionrpc.TorrentFileStat{},
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.EqualError(t, err, "no files information available")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_MissingFileInfo_StatsNil", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockTorrents := []transmissionrpc.Torrent{
			{
				Name:      ptr("Missing Stats"),
				Files:     []transmissionrpc.TorrentFile{},
				FileStats: nil, // FileStats field is nil
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.EqualError(t, err, "no files information available")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_CountMismatch", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockFiles := []transmissionrpc.TorrentFile{
			{Name: "file1.mkv", Length: 1024},
		}
		mockStats := []transmissionrpc.TorrentFileStat{ // Different count
			{BytesCompleted: 512, Wanted: true},
			{BytesCompleted: 256, Wanted: false},
		}
		mockTorrents := []transmissionrpc.Torrent{
			{
				Name:      ptr("Mismatch Torrent"),
				Files:     mockFiles,
				FileStats: mockStats,
			},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentFiles(testID)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.EqualError(t, err, "files and file stats count mismatch")
		mockRPC.AssertExpectations(t)
	})
}

func TestSetFilesWanted(t *testing.T) {
	ctx := context.Background()
	testID := int64(1)
	testFileIDs := []int{0, 2, 4}
	testFileIDs64 := []int64{0, 2, 4} // Expected conversion

	t.Run("Success_SetWanted", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		wanted := true

		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:         []int64{testID},
			FilesWanted: testFileIDs64, // Expect FilesWanted to be set
		}

		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetFilesWanted(testID, testFileIDs, wanted)

		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_SetUnwanted", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		wanted := false

		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:           []int64{testID},
			FilesUnwanted: testFileIDs64, // Expect FilesUnwanted to be set
		}

		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetFilesWanted(testID, testFileIDs, wanted)

		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		wanted := true
		expectedErr := errors.New("rpc set error")

		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:         []int64{testID},
			FilesWanted: testFileIDs64,
		}

		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(expectedErr).Once()

		err := client.SetFilesWanted(testID, testFileIDs, wanted)

		assert.Error(t, err)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to set files wanted state")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_EmptyFileIDs", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		wanted := true
		emptyFileIDs := []int{}
		emptyFileIDs64 := []int64{}

		expectedPayload := transmissionrpc.TorrentSetPayload{
			IDs:         []int64{testID},
			FilesWanted: emptyFileIDs64, // Expect empty slice
		}

		mockRPC.On("TorrentSet", ctx, expectedPayload).Return(nil).Once()

		err := client.SetFilesWanted(testID, emptyFileIDs, wanted)

		assert.NoError(t, err)
		mockRPC.AssertExpectations(t)
	})
}

func TestGetTorrentDownloadDirectory(t *testing.T) {
	ctx := context.Background()
	testID := int64(42)
	expectedFields := []string{"downloadDir"}

	t.Run("Success", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		expectedDir := "/torrents/specific/download"
		mockTorrents := []transmissionrpc.Torrent{
			{DownloadDir: ptr(expectedDir)},
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentDownloadDirectory(testID)

		assert.NoError(t, err)
		assert.Equal(t, expectedDir, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_RPC", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		expectedErr := errors.New("rpc torrent get error")

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(nil, expectedErr).Once()

		result, err := client.GetTorrentDownloadDirectory(testID)

		assert.Error(t, err)
		assert.Empty(t, result)
		assert.ErrorIs(t, err, expectedErr)
		assert.Contains(t, err.Error(), "failed to get torrent download directory")
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_TorrentNotFound", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockTorrents := []transmissionrpc.Torrent{} // Empty slice

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentDownloadDirectory(testID)

		assert.Error(t, err)
		assert.Empty(t, result)
		assert.EqualError(t, err, fmt.Sprintf("torrent with id %d not found", testID))
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_DownloadDirNil", func(t *testing.T) {
		client, mockRPC := createClientForFileTests()
		mockTorrents := []transmissionrpc.Torrent{
			{DownloadDir: nil}, // Simulate missing field
		}

		mockRPC.On("TorrentGet", ctx, expectedFields, []int64{testID}).Return(mockTorrents, nil).Once()

		result, err := client.GetTorrentDownloadDirectory(testID)

		assert.Error(t, err)
		assert.Empty(t, result)
		assert.EqualError(t, err, "download directory information not available")
		mockRPC.AssertExpectations(t)
	})
}

// --- Add tests for SaveDownloadPath, RemoveDownloadPath, etc. below ---
