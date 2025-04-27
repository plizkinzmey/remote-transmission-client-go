package transmission

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestErrorTypes(t *testing.T) {
	t.Run("ErrConfigNotInitialized", func(t *testing.T) {
		err := ErrConfigNotInitialized{}
		assert.EqualError(t, err, "config not initialized")
		// Check against the constant string as well
		assert.Equal(t, errConfigNotInitialized, err.Error())
	})

	t.Run("ErrTorrentNotFound", func(t *testing.T) {
		testID := int64(123)
		err := ErrTorrentNotFound{ID: testID}
		expectedMsg := fmt.Sprintf("torrent with id %d not found", testID)
		assert.EqualError(t, err, expectedMsg)
	})

	t.Run("ErrServiceNotInitialized", func(t *testing.T) {
		serviceName := "TestService"
		err := NewServiceNotInitializedError(serviceName)
		// Check the underlying type if needed, although not strictly necessary for Error()
		assert.IsType(t, &ErrServiceNotInitialized{}, err)
		expectedMsg := fmt.Sprintf("%s service not initialized", serviceName)
		assert.EqualError(t, err, expectedMsg)

		// Test the factory function directly
		errFromFactory := NewServiceNotInitializedError(serviceName)
		assert.EqualError(t, errFromFactory, expectedMsg)
	})

	t.Run("ErrServiceNotInitialized_EmptyName", func(t *testing.T) {
		err := NewServiceNotInitializedError("")
		expectedMsg := " service not initialized" // Note the leading space
		assert.EqualError(t, err, expectedMsg)
	})
}
