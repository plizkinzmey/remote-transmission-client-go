package application

import (
	"testing"
	"transmission-client-go/internal/domain"

	"github.com/stretchr/testify/assert"
)

func TestStartStopTorrents(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2, 3}

	mockRepo.On("Start", ids).Return(nil)
	err := service.StartTorrents(ids)
	assert.NoError(t, err)

	mockRepo.On("Stop", ids).Return(nil)
	err = service.StopTorrents(ids)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2}
	service.config = &domain.Config{
		SlowSpeedLimit: 50,
		SlowSpeedUnit:  "KiB/s",
	}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(50), int64(50)).Return(nil)
	err := service.SetTorrentSpeedLimit(ids, true)
	assert.NoError(t, err)

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(0), int64(0)).Return(nil)
	err = service.SetTorrentSpeedLimit(ids, false)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_WithConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	service.config = &domain.Config{
		SlowSpeedLimit: 20,
		SlowSpeedUnit:  "MiB/s",
	}

	ids := []int64{1, 2}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(20480), int64(20480)).Return(nil)

	err := service.SetTorrentSpeedLimit(ids, true)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestSetTorrentSpeedLimit_NoConfig(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	ids := []int64{1, 2}

	mockRepo.On("SetTorrentSpeedLimit", ids, int64(10), int64(10)).Return(nil)

	err := service.SetTorrentSpeedLimit(ids, true)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestVerifyTorrent(t *testing.T) {
	mockRepo := new(MockTransmissionClient)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)

	mockRepo.On("VerifyTorrent", torrentID).Return(nil)

	err := service.VerifyTorrent(torrentID)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestSetFilesWanted_Success(t *testing.T) {
	mockRepo, _ := setupMocks(t)
	service := NewTorrentService(mockRepo)

	torrentID := int64(1)
	fileIds := []int{1, 2, 3}
	wanted := true

	mockRepo.On("SetFilesWanted", torrentID, fileIds, wanted).Return(nil)

	err := service.SetFilesWanted(torrentID, fileIds, wanted)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}
