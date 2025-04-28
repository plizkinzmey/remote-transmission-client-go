package transmission

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestErrorTypes(t *testing.T) {
	// Removed tests for ErrConfigNotInitialized and ErrTorrentNotFound as these types don't exist.
	// Error messages associated with them are tested in the functions that might return them.

	t.Run("ServiceNotInitializedError", func(t *testing.T) {
		// Call the factory function without arguments
		err := NewServiceNotInitializedError()

		// Check the type using the correct type name
		assert.IsType(t, &ServiceNotInitializedError{}, err)

		// Check the error message against the constant defined in errors.go
		assert.EqualError(t, err, errServiceNotInitialized)
		assert.Equal(t, errServiceNotInitialized, err.Error())
	})

	// Removed ErrServiceNotInitialized_EmptyName test as the factory function doesn't take arguments.

	// Test AuthenticationError if needed (assuming it might be used elsewhere)
	t.Run("AuthenticationError", func(t *testing.T) {
		errMsg := "test auth error"
		// Create a pointer to the struct
		err := &AuthenticationError{message: errMsg}
		assert.EqualError(t, err, errMsg)
	})

	// Test LocalizedError if needed
	t.Run("LocalizedError", func(t *testing.T) {
		key := "error.some.key"
		// Create a pointer to the struct
		err := &LocalizedError{key: key}
		assert.EqualError(t, err, key)
	})
}
