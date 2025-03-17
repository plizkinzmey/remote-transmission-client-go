package domain

// Config represents the application configuration
type Config struct {
	Host           string  `json:"host"`
	Port           int     `json:"port"`
	Username       string  `json:"username"`
	Password       string  `json:"password"`
	Language       string  `json:"language"` // Added for localization support
	Theme          string  `json:"theme"`    // Added for theme support: "light", "dark", "auto"
	MaxUploadRatio float64 `json:"maxUploadRatio"` // Maximum upload ratio before stopping torrent (0 means unlimited)
}
