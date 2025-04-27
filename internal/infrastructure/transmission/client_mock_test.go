package transmission

import (
	"context"

	"github.com/hekmon/cunits/v2"
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/mock"
)

// MockRPCClient — это мок для интерфейса RPCClientInterface.
type MockRPCClient struct {
	mock.Mock
}

// Убедимся, что MockRPCClient удовлетворяет нашему интерфейсу RPCClientInterface.
var _ RPCClientInterface = (*MockRPCClient)(nil)

// Реализуем методы интерфейса для мока
func (m *MockRPCClient) FreeSpace(ctx context.Context, path string) (cunits.Bits, cunits.Bits, error) {
	args := m.Called(ctx, path)
	return args.Get(0).(cunits.Bits), args.Get(1).(cunits.Bits), args.Error(2)
}

// TorrentGet мокирует метод TorrentGet
func (m *MockRPCClient) TorrentGet(ctx context.Context, fields []string, ids []int64) (torrents []transmissionrpc.Torrent, err error) {
	args := m.Called(ctx, fields, ids)
	if args.Get(0) != nil {
		torrents = args.Get(0).([]transmissionrpc.Torrent)
	}
	err = args.Error(1)
	return
}

// SessionArgumentsGet мокирует метод SessionArgumentsGet
func (m *MockRPCClient) SessionArgumentsGet(ctx context.Context, fields []string) (sessionArgs transmissionrpc.SessionArguments, err error) {
	args := m.Called(ctx, fields)
	if args.Get(0) != nil {
		sessionArgs = args.Get(0).(transmissionrpc.SessionArguments)
	}
	err = args.Error(1)
	return
}

// SessionStats мокирует метод SessionStats
func (m *MockRPCClient) SessionStats(ctx context.Context) (stats transmissionrpc.SessionStats, err error) {
	args := m.Called(ctx)
	if args.Get(0) != nil {
		stats = args.Get(0).(transmissionrpc.SessionStats)
	}
	err = args.Error(1)
	return
}

// TorrentAdd мокирует метод TorrentAdd
func (m *MockRPCClient) TorrentAdd(ctx context.Context, payload transmissionrpc.TorrentAddPayload) (torrent transmissionrpc.Torrent, err error) {
	args := m.Called(ctx, payload)
	if args.Get(0) != nil {
		torrent = args.Get(0).(transmissionrpc.Torrent)
	}
	err = args.Error(1)
	return
}

// TorrentRemove мокирует метод TorrentRemove
func (m *MockRPCClient) TorrentRemove(ctx context.Context, payload transmissionrpc.TorrentRemovePayload) (err error) {
	args := m.Called(ctx, payload)
	err = args.Error(0)
	return
}

// TorrentStartIDs мокирует метод TorrentStartIDs
func (m *MockRPCClient) TorrentStartIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}

// TorrentStopIDs мокирует метод TorrentStopIDs
func (m *MockRPCClient) TorrentStopIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}

// TorrentSet мокирует метод TorrentSet
func (m *MockRPCClient) TorrentSet(ctx context.Context, payload transmissionrpc.TorrentSetPayload) (err error) {
	args := m.Called(ctx, payload)
	err = args.Error(0)
	return
}

// TorrentVerifyIDs мокирует метод TorrentVerifyIDs
func (m *MockRPCClient) TorrentVerifyIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}

// Helper function to create pointers for basic types, useful for transmissionrpc fields
func ptr[T any](v T) *T {
	return &v
}
