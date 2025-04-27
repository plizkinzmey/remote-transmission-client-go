package transmission

import (
	"context" // Import context
	"errors"
	"fmt"
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3" // Import transmissionrpc
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock" // Import mock
)

// Helper to create client with mock RPC for path tests that need it
func createClientForPathTests() (*TransmissionClient, *MockRPCClient) {
	mockRPC := new(MockRPCClient)
	// Use the same context helper as other tests
	client := &TransmissionClient{client: mockRPC, ctx: context.Background()}
	return client, mockRPC
}

// Note: These functions (Save/Remove/GetDownloadPaths, isPathInList) don't interact
// with the RPC client, so we don't need a mock RPC client here.
// We only need a dummy TransmissionClient instance to call the methods.

func TestSaveDownloadPath(t *testing.T) {
	dummyClient := &TransmissionClient{} // Dummy client instance

	t.Run("Success_AddNewPath", func(t *testing.T) {
		config := &domain.Config{
			DownloadPaths: []string{"/old/path1", "/old/path2"},
		}
		newPath := "/new/path"
		expectedPaths := []string{newPath, "/old/path1", "/old/path2"}

		err := dummyClient.SaveDownloadPath(newPath, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_AddPathToNilSlice", func(t *testing.T) {
		config := &domain.Config{
			DownloadPaths: nil, // Start with nil slice
		}
		newPath := "/first/path"
		expectedPaths := []string{newPath}

		err := dummyClient.SaveDownloadPath(newPath, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_AddExistingPath", func(t *testing.T) {
		existingPath := "/existing/path"
		config := &domain.Config{
			DownloadPaths: []string{"/other/path", existingPath},
		}
		// Expect the list to remain unchanged
		expectedPaths := []string{"/other/path", existingPath}

		err := dummyClient.SaveDownloadPath(existingPath, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_AddEmptyPath", func(t *testing.T) {
		config := &domain.Config{
			DownloadPaths: []string{"/path1"},
		}
		// Expect the list to remain unchanged
		expectedPaths := []string{"/path1"}

		err := dummyClient.SaveDownloadPath("", config) // Add empty path

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_LimitPaths", func(t *testing.T) {
		// Create a config with 10 existing paths
		initialPaths := make([]string, 10)
		for i := 0; i < 10; i++ {
			initialPaths[i] = fmt.Sprintf("/path/%d", i)
		}
		config := &domain.Config{
			DownloadPaths: initialPaths,
		}
		newPath := "/new/path/11"
		// Expect the new path at the beginning and the last old path removed
		expectedPaths := append([]string{newPath}, initialPaths[:9]...)

		err := dummyClient.SaveDownloadPath(newPath, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
		assert.Len(t, config.DownloadPaths, 10) // Ensure length is capped
	})

	t.Run("Error_NilConfig", func(t *testing.T) {
		err := dummyClient.SaveDownloadPath("/some/path", nil) // Pass nil config

		assert.Error(t, err)
		assert.EqualError(t, err, errConfigNotInitialized)
	})
}

func TestRemoveDownloadPath(t *testing.T) {
	dummyClient := &TransmissionClient{} // Dummy client instance

	t.Run("Success_RemoveExistingPath", func(t *testing.T) {
		pathToRemove := "/path/to/remove"
		config := &domain.Config{
			DownloadPaths: []string{"/path/1", pathToRemove, "/path/3"},
		}
		expectedPaths := []string{"/path/1", "/path/3"}

		err := dummyClient.RemoveDownloadPath(pathToRemove, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_RemoveFirstPath", func(t *testing.T) {
		pathToRemove := "/path/first"
		config := &domain.Config{
			DownloadPaths: []string{pathToRemove, "/path/2", "/path/3"},
		}
		expectedPaths := []string{"/path/2", "/path/3"}

		err := dummyClient.RemoveDownloadPath(pathToRemove, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_RemoveLastPath", func(t *testing.T) {
		pathToRemove := "/path/last"
		config := &domain.Config{
			DownloadPaths: []string{"/path/1", "/path/2", pathToRemove},
		}
		expectedPaths := []string{"/path/1", "/path/2"}

		err := dummyClient.RemoveDownloadPath(pathToRemove, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_RemoveOnlyPath", func(t *testing.T) {
		pathToRemove := "/path/only"
		config := &domain.Config{
			DownloadPaths: []string{pathToRemove},
		}
		expectedPaths := []string{} // Expect empty slice

		err := dummyClient.RemoveDownloadPath(pathToRemove, config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_PathNotFound", func(t *testing.T) {
		pathToRemove := "/path/not/found"
		config := &domain.Config{
			DownloadPaths: []string{"/path/1", "/path/2"},
		}
		expectedPaths := []string{"/path/1", "/path/2"} // Expect unchanged list

		err := dummyClient.RemoveDownloadPath(pathToRemove, config)

		assert.NoError(t, err) // Should not return error if path not found
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Success_RemoveFromNilSlice", func(t *testing.T) {
		config := &domain.Config{
			DownloadPaths: nil, // Start with nil slice
		}
		expectedPaths := []string(nil) // Expect nil slice to remain nil

		err := dummyClient.RemoveDownloadPath("/any/path", config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths) // Check it's still nil explicitly
		assert.Nil(t, config.DownloadPaths)                  // Double check
	})

	t.Run("Success_RemoveEmptyPath", func(t *testing.T) {
		config := &domain.Config{
			DownloadPaths: []string{"/path/1", ""},
		}
		expectedPaths := []string{"/path/1"}

		err := dummyClient.RemoveDownloadPath("", config) // Remove empty path

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, config.DownloadPaths)
	})

	t.Run("Error_NilConfig", func(t *testing.T) {
		err := dummyClient.RemoveDownloadPath("/some/path", nil) // Pass nil config

		assert.Error(t, err)
		assert.EqualError(t, err, errConfigNotInitialized)
	})
}

func TestIsPathInList(t *testing.T) {
	dummyClient := &TransmissionClient{} // Dummy client instance
	testPaths := []string{"/path/one", "/path/two", "/path/three", ""}

	t.Run("PathExists", func(t *testing.T) {
		exists := dummyClient.isPathInList("/path/two", testPaths)
		assert.True(t, exists)
	})

	t.Run("PathDoesNotExist", func(t *testing.T) {
		exists := dummyClient.isPathInList("/path/four", testPaths)
		assert.False(t, exists)
	})

	t.Run("EmptyPathExists", func(t *testing.T) {
		exists := dummyClient.isPathInList("", testPaths)
		assert.True(t, exists)
	})

	t.Run("EmptyPathDoesNotExist", func(t *testing.T) {
		pathsWithoutEmpty := []string{"/path/one", "/path/two"}
		exists := dummyClient.isPathInList("", pathsWithoutEmpty)
		assert.False(t, exists)
	})

	t.Run("NilSlice", func(t *testing.T) {
		var nilPaths []string
		exists := dummyClient.isPathInList("/path/one", nilPaths)
		assert.False(t, exists)
	})

	t.Run("EmptySlice", func(t *testing.T) {
		emptyPaths := []string{}
		exists := dummyClient.isPathInList("/path/one", emptyPaths)
		assert.False(t, exists)
	})
}

func TestGetDownloadPaths(t *testing.T) {
	ctx := context.Background()
	sessionFields := []string{"download-dir"} // Fields needed by GetDefaultDownloadDir

	t.Run("Success_WithDefaultAndHistory", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		defaultDir := "/default/downloads"
		historyPaths := []string{"/history/path1", "/history/path2", defaultDir} // Include default to test uniqueness
		config := &domain.Config{
			DownloadPaths: historyPaths,
		}
		expectedPaths := []string{defaultDir, "/history/path1", "/history/path2"} // Default first, then unique history

		// Mock the underlying call made by GetDefaultDownloadDir
		mockSessionArgs := transmissionrpc.SessionArguments{DownloadDir: ptr(defaultDir)}
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_DefaultOnly_NilHistory", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		defaultDir := "/default/downloads"
		config := &domain.Config{
			DownloadPaths: nil, // Nil history
		}
		expectedPaths := []string{defaultDir}

		mockSessionArgs := transmissionrpc.SessionArguments{DownloadDir: ptr(defaultDir)}
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_DefaultOnly_EmptyHistory", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		defaultDir := "/default/downloads"
		config := &domain.Config{
			DownloadPaths: []string{}, // Empty history
		}
		expectedPaths := []string{defaultDir}

		mockSessionArgs := transmissionrpc.SessionArguments{DownloadDir: ptr(defaultDir)}
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err)
		assert.Equal(t, expectedPaths, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_HistoryOnly_DefaultDirError", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		historyPaths := []string{"/history/path1", "/history/path2"}
		config := &domain.Config{
			DownloadPaths: historyPaths,
		}
		expectedPaths := []string{"/history/path1", "/history/path2"} // Only history expected

		// Mock GetDefaultDownloadDir failing
		rpcErr := errors.New("rpc error getting default dir")
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(transmissionrpc.SessionArguments{}, rpcErr).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err) // GetDownloadPaths itself shouldn't error here
		assert.Equal(t, expectedPaths, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_HistoryOnly_DefaultDirNil", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		historyPaths := []string{"/history/path1", "/history/path2"}
		config := &domain.Config{
			DownloadPaths: historyPaths,
		}
		expectedPaths := []string{"/history/path1", "/history/path2"} // Only history expected

		// Mock GetDefaultDownloadDir returning nil dir
		mockSessionArgs := transmissionrpc.SessionArguments{DownloadDir: nil}
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(mockSessionArgs, nil).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err) // GetDownloadPaths itself shouldn't error here
		assert.Equal(t, expectedPaths, result)
		mockRPC.AssertExpectations(t)
	})

	t.Run("Success_NoDefaultAndNilHistory", func(t *testing.T) {
		client, mockRPC := createClientForPathTests()
		config := &domain.Config{
			DownloadPaths: nil,
		}
		expectedPaths := []string{} // Expect empty slice

		// Mock GetDefaultDownloadDir failing
		rpcErr := errors.New("rpc error getting default dir")
		mockRPC.On("SessionArgumentsGet", ctx, sessionFields).Return(transmissionrpc.SessionArguments{}, rpcErr).Once()

		result, err := client.GetDownloadPaths(config)

		assert.NoError(t, err) // GetDownloadPaths itself shouldn't error here
		assert.Equal(t, expectedPaths, result)
		assert.NotNil(t, result) // Should be empty slice, not nil
		mockRPC.AssertExpectations(t)
	})

	t.Run("Error_NilConfig", func(t *testing.T) {
		// Need a client instance, but mock won't be called
		client, mockRPC := createClientForPathTests()

		result, err := client.GetDownloadPaths(nil) // Pass nil config

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.EqualError(t, err, errConfigNotInitialized)
		mockRPC.AssertNotCalled(t, "SessionArgumentsGet", mock.Anything, mock.Anything)
	})
}

// --- Add tests for GetTorrentDownloadDirectory in files_torrent_test.go ---
