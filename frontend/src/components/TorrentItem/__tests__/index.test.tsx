import { describe, it, expect } from "vitest";
// Импортируем из index.ts
import { TorrentItem } from "../index";
// Импортируем напрямую для сравнения
import { TorrentItem as OriginalTorrentItem } from "../TorrentItem";
// Импортируем тип (хотя проверить его сложнее)
import type { TorrentItemProps } from "../index";

describe("TorrentItem index", () => {
    it("should re-export TorrentItem component", () => {
        expect(TorrentItem).toBeDefined();
        expect(TorrentItem).toBe(OriginalTorrentItem);
    });

    it("should re-export TorrentItemProps type", () => {
        // Проверка типа во время выполнения затруднительна,
        // но сам факт импорта без ошибок является частичной проверкой.
        // Этот тест в основном для документирования намерения.
        const props: TorrentItemProps = {
            id: 1,
            name: "Test",
            status: "stopped",
            progress: 0,
            sizeFormatted: "0 B",
            uploadRatio: 0,
            seedsConnected: 0,
            seedsTotal: 0,
            peersConnected: 0,
            peersTotal: 0,
            uploadedFormatted: "0 B",
            selected: false,
            onSelect: () => { },
            onRemove: () => { },
            onStart: () => { },
            onStop: () => { },
            downloadSpeedFormatted: "0 B/s",
            uploadSpeedFormatted: "0 B/s",
        };
        expect(props).toBeDefined();
        // Можно добавить проверку на одно из обязательных свойств
        expect(props.id).toBe(1);
    });
});
