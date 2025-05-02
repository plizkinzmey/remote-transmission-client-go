package domain

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestContains was created in the previous step, keeping it here.
func TestContains(t *testing.T) {
	slice := []string{"apple", "banana", "cherry"}
	assert.True(t, contains(slice, "banana"), "Expected 'banana' to be in the slice")
	assert.False(t, contains(slice, "grape"), "Expected 'grape' not to be in the slice")
	emptySlice := []string{}
	assert.False(t, contains(emptySlice, "apple"), "Expected 'apple' not to be in an empty slice")
	sliceWithEmpty := []string{"", "a", "b"}
	assert.True(t, contains(sliceWithEmpty, ""), "Expected empty string to be in the slice")
	assert.False(t, contains(sliceWithEmpty, "c"), "Expected 'c' not to be in the slice")
}

func TestApplyPathsTransaction(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/a", "/path/b", "/path/c"},
		DefaultDownloadPath: "/path/a",
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{"/path/d", "/path/b"}, // Add 'd', 'b' is duplicate
		PathsToRemove: []string{"/path/a", "/path/e"}, // Remove 'a', 'e' doesn't exist
		DefaultPath:   "/path/d",
	}

	// Apply the transaction
	config.ApplyPathsTransaction(transaction)

	// Assertions
	expectedPaths := []string{"/path/b", "/path/c", "/path/d"}
	assert.ElementsMatch(t, expectedPaths, config.DownloadPaths, "DownloadPaths should be updated correctly")
	assert.Equal(t, "/path/d", config.DefaultDownloadPath, "DefaultDownloadPath should be updated")
}

func TestRollbackPathsTransaction(t *testing.T) {
	originalPaths := []string{"/path/a", "/path/b"}
	originalDefault := "/path/a"

	config := &Config{
		DownloadPaths:       append([]string{}, originalPaths...), // Create copies
		DefaultDownloadPath: originalDefault,
	}

	// Simulate applying a transaction
	transaction := &PathsTransaction{
		PathsToAdd:    []string{"/path/c"},
		PathsToRemove: []string{"/path/a"},
		DefaultPath:   "/path/c",
		OriginalState: &PathsState{ // Store original state
			Paths:       append([]string{}, originalPaths...),
			DefaultPath: originalDefault,
		},
	}

	// Apply (we don't check the result of apply here, focus is on rollback)
	config.ApplyPathsTransaction(transaction)
	require.NotEqual(t, originalPaths, config.DownloadPaths, "Paths should have changed after apply")
	require.NotEqual(t, originalDefault, config.DefaultDownloadPath, "Default path should have changed after apply")

	// Rollback the transaction
	config.RollbackPathsTransaction(transaction)

	// Assertions
	assert.Equal(t, originalPaths, config.DownloadPaths, "DownloadPaths should be rolled back to original")
	assert.Equal(t, originalDefault, config.DefaultDownloadPath, "DefaultDownloadPath should be rolled back to original")
}

func TestRollbackPathsTransaction_NilOriginalState(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/x", "/path/y"},
		DefaultDownloadPath: "/path/x",
	}
	initialPaths := append([]string{}, config.DownloadPaths...)
	initialDefault := config.DefaultDownloadPath

	transaction := &PathsTransaction{
		PathsToAdd:    []string{"/path/z"},
		PathsToRemove: []string{"/path/x"},
		DefaultPath:   "/path/z",
		OriginalState: nil, // No original state saved
	}

	// Apply
	config.ApplyPathsTransaction(transaction)

	// Attempt Rollback
	config.RollbackPathsTransaction(transaction)

	// Assertions: State should remain as it was after Apply, because rollback couldn't happen
	assert.NotEqual(t, initialPaths, config.DownloadPaths, "Paths should not have rolled back")
	assert.NotEqual(t, initialDefault, config.DefaultDownloadPath, "Default path should not have rolled back")
	assert.Contains(t, config.DownloadPaths, "/path/y", "Path Y should still be present")
	assert.Contains(t, config.DownloadPaths, "/path/z", "Path Z should still be present")
	assert.NotContains(t, config.DownloadPaths, "/path/x", "Path X should remain removed")
	assert.Equal(t, "/path/z", config.DefaultDownloadPath, "Default path should remain Z")
}

func TestGetPathsState(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/1", "/path/2"},
		DefaultDownloadPath: "/path/1",
	}
	expectedState := &PathsState{
		Paths:       []string{"/path/1", "/path/2"},
		DefaultPath: "/path/1",
	}

	currentState := config.GetPathsState()

	// Use ElementsMatch for slices as order might not be guaranteed by GetPathsState (though it is currently)
	assert.ElementsMatch(t, expectedState.Paths, currentState.Paths, "Paths should match")
	assert.Equal(t, expectedState.DefaultPath, currentState.DefaultPath, "DefaultPath should match")
}

func TestApplyPathsTransaction_EmptyTransaction(t *testing.T) {
	initialPaths := []string{"/path/a", "/path/b"}
	initialDefault := "/path/a"
	config := &Config{
		DownloadPaths:       append([]string{}, initialPaths...), // Copy slice
		DefaultDownloadPath: initialDefault,
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{},
		PathsToRemove: []string{},
		DefaultPath:   "", // No change to default path
	}

	config.ApplyPathsTransaction(transaction)

	assert.Equal(t, initialPaths, config.DownloadPaths, "DownloadPaths should remain unchanged")
	assert.Equal(t, initialDefault, config.DefaultDownloadPath, "DefaultDownloadPath should remain unchanged")
}

func TestApplyPathsTransaction_OnlyAdd(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/a"},
		DefaultDownloadPath: "/path/a",
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{"/path/b", "/path/c"},
		PathsToRemove: []string{},
		DefaultPath:   "", // No change to default path
	}

	config.ApplyPathsTransaction(transaction)

	expectedPaths := []string{"/path/a", "/path/b", "/path/c"}
	assert.ElementsMatch(t, expectedPaths, config.DownloadPaths, "Paths should be added")
	assert.Equal(t, "/path/a", config.DefaultDownloadPath, "DefaultDownloadPath should remain unchanged")
}

func TestApplyPathsTransaction_OnlyRemove(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/a", "/path/b", "/path/c"},
		DefaultDownloadPath: "/path/a",
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{},
		PathsToRemove: []string{"/path/b"},
		DefaultPath:   "", // No change to default path
	}

	config.ApplyPathsTransaction(transaction)

	expectedPaths := []string{"/path/a", "/path/c"}
	assert.ElementsMatch(t, expectedPaths, config.DownloadPaths, "Path 'b' should be removed")
	assert.Equal(t, "/path/a", config.DefaultDownloadPath, "DefaultDownloadPath should remain unchanged")
}

func TestApplyPathsTransaction_SetDefaultNotInAdd(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/a"},
		DefaultDownloadPath: "/path/a",
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{"/path/b"},
		PathsToRemove: []string{},
		DefaultPath:   "/path/c", // Set default to a path not being added or existing
	}

	config.ApplyPathsTransaction(transaction)

	expectedPaths := []string{"/path/a", "/path/b"}
	assert.ElementsMatch(t, expectedPaths, config.DownloadPaths, "Paths should be updated")
	// The current implementation sets the default path regardless of whether it's in the list.
	assert.Equal(t, "/path/c", config.DefaultDownloadPath, "DefaultDownloadPath should be updated even if not in paths")
}

func TestApplyPathsTransaction_RemoveDefaultNoNewDefault(t *testing.T) {
	config := &Config{
		DownloadPaths:       []string{"/path/a", "/path/b"},
		DefaultDownloadPath: "/path/a",
	}

	transaction := &PathsTransaction{
		PathsToAdd:    []string{},
		PathsToRemove: []string{"/path/a"}, // Remove the current default
		DefaultPath:   "",                  // Do not set a new default
	}

	config.ApplyPathsTransaction(transaction)

	expectedPaths := []string{"/path/b"}
	assert.ElementsMatch(t, expectedPaths, config.DownloadPaths, "Default path '/path/a' should be removed from the list")
	// The current implementation keeps the old DefaultDownloadPath value if a new one isn't provided,
	// even if the path itself was removed from DownloadPaths.
	assert.Equal(t, "/path/a", config.DefaultDownloadPath, "DefaultDownloadPath should remain the old value as no new one was provided")
}
