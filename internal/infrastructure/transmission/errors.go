package transmission

const (
	// Errors
	errPermissionDenied        = "permission denied"
	errNoSuchFileOrDirectory   = "No such file or directory"
	errDirectoryDoesNotExist   = "directory does not exist: %s"
	errPermissionDeniedForPath = "permission denied for directory: %s"
	errDirectoryNotAccessible  = "directory is not accessible"
	errInvalidDrive            = "invalid drive: %s"
	errConfigNotInitialized    = "config is not initialized"
)

// LocalizedError представляет ошибку с ключом локализации
type LocalizedError struct {
	key string
}

func (e *LocalizedError) Error() string {
	return e.key
}
