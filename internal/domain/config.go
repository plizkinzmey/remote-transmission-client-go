package domain

// Config represents the application configuration
type Config struct {
	Host     string `json:"host"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	Language string `json:"language"` // Added for localization support
}
