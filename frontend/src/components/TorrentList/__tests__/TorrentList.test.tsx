import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TorrentList } from '../TorrentList';
import { mockTorrents, mockCallbacks } from './mocks';

// Мокаем контекст локализации
vi.mock('../../../contexts/LocalizationContext', () => ({
    useLocalization: () => ({
        t: (key: string) => key,
        locale: 'ru',
        setLocale: vi.fn(),
        isLoading: false
    })
}));

// Мокаем компонент LoadingSpinner
vi.mock('../../LoadingSpinner', () => ({
    LoadingSpinner: ({ size }: { size: string }) => (
        <div data-testid="loading-spinner" data-size={size}>Loading...</div>
    )
}));

describe('TorrentList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('отображает список торрентов', () => {
        render(
            <TorrentList
                torrents={mockTorrents}
                searchTerm=""
                selectedTorrents={new Set()}
                {...mockCallbacks}
            />
        );

        // Проверяем наличие элементов списка
        expect(screen.getByTestId('torrent-list-container')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-list-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('torrent-list-item-2')).toBeInTheDocument();
    });

    it('отображает состояние загрузки', () => {
        render(
            <TorrentList
                torrents={[]}
                searchTerm=""
                selectedTorrents={new Set()}
                isLoading={true}
                {...mockCallbacks}
            />
        );

        expect(screen.getByTestId('torrent-list-loading')).toBeInTheDocument();
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
        expect(screen.getByText('torrents.loading')).toBeInTheDocument();
    });

    it('отображает сообщение при отсутствии торрентов', () => {
        render(
            <TorrentList
                torrents={[]}
                searchTerm=""
                selectedTorrents={new Set()}
                {...mockCallbacks}
            />
        );

        expect(screen.getByTestId('torrent-list-empty')).toBeInTheDocument();
        expect(screen.getByText('torrents.noTorrents')).toBeInTheDocument();
    });

    it('отображает сообщение при отсутствии результатов поиска', () => {
        render(
            <TorrentList
                torrents={mockTorrents}
                searchTerm="несуществующий торрент"
                selectedTorrents={new Set()}
                {...mockCallbacks}
            />
        );

        expect(screen.getByTestId('torrent-list-empty')).toBeInTheDocument();
        expect(screen.getByText('torrents.noTorrentsFound')).toBeInTheDocument();
    });

    it('фильтрует торренты по поисковому запросу', () => {
        render(
            <TorrentList
                torrents={mockTorrents}
                searchTerm="Ubuntu"
                selectedTorrents={new Set()}
                {...mockCallbacks}
            />
        );

        expect(screen.getByTestId('torrent-list-item-1')).toBeInTheDocument();
        expect(screen.queryByTestId('torrent-list-item-2')).not.toBeInTheDocument();
    });

    it('не отображает содержимое при переподключении', () => {
        render(
            <TorrentList
                torrents={mockTorrents}
                searchTerm=""
                selectedTorrents={new Set()}
                isReconnecting={true}
                {...mockCallbacks}
            />
        );

        expect(screen.queryByTestId('torrent-list-loading')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-list-empty')).not.toBeInTheDocument();
        expect(screen.queryByTestId('torrent-list-item-1')).not.toBeInTheDocument();
    });
});