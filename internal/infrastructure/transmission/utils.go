package transmission

import (
	"fmt"
	"math"

	"github.com/hekmon/transmissionrpc/v3"
)

// formatBytes преобразует размер в человеко-читаемый формат
func formatBytes(value uint64, isBytes bool) string {
	if value == 0 {
		return "0 B"
	}

	base := float64(1024)
	sizes := []string{"B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"}
	var size float64
	if isBytes {
		size = float64(value)
	} else {
		size = float64(value) / 8 // конвертируем биты в байты
	}

	i := math.Floor(math.Log(size) / math.Log(base))
	if i < 0 {
		i = 0
	} else if i >= float64(len(sizes)) {
		i = float64(len(sizes)) - 1
	}

	size = size / math.Pow(base, i)
	return fmt.Sprintf("%.1f %s", size, sizes[int(i)])
}

// getTorrentSizes возвращает общий размер и загруженный размер
func getTorrentSizes(t transmissionrpc.Torrent) (total uint64, downloaded uint64) {
	total = uint64(0)
	downloaded = uint64(0)

	if t.SizeWhenDone != nil {
		total = uint64(*t.SizeWhenDone) / 8
	}

	if t.DownloadedEver != nil {
		downloaded = uint64(*t.DownloadedEver)
	} else if t.HaveValid != nil {
		downloaded = uint64(*t.HaveValid) / 8
	}

	return total, downloaded
}

// getPeerInfo возвращает информацию о пирах
func getPeerInfo(t *transmissionrpc.Torrent) (peersConnected int, seedsTotal int, peersTotal int) {
	if t.PeersConnected != nil {
		peersConnected = int(*t.PeersConnected)
	}

	if t.TrackerStats != nil {
		for _, tracker := range t.TrackerStats {
			seedsTotal += int(tracker.SeederCount)
			peersTotal += int(tracker.LeecherCount)
		}
	}

	return
}

// getUploadInfo возвращает информацию о загрузке
func getUploadInfo(t *transmissionrpc.Torrent) (uploadRatio float64, uploadedBytes int64) {
	if t.UploadRatio != nil {
		uploadRatio = *t.UploadRatio
	}
	if t.UploadedEver != nil {
		uploadedBytes = int64(*t.UploadedEver)
	}

	return
}

// getSpeedInfo возвращает информацию о скорости в байтах/с
func getSpeedInfo(t *transmissionrpc.Torrent) (downloadSpeed int64, uploadSpeed int64) {
	if t.RateDownload != nil {
		downloadSpeed = *t.RateDownload
	}
	if t.RateUpload != nil {
		uploadSpeed = *t.RateUpload
	}
	return
}

// convertSpeedToKBps конвертирует скорость из KiB/s или MiB/s в KiB/s
func convertSpeedToKBps(speed int, unit string) int64 {
	switch unit {
	case "MiB/s":
		return int64(speed) * 1024 // Конвертируем MiB/s в KiB/s
	default:
		return int64(speed) // Значение уже в KiB/s
	}
}
