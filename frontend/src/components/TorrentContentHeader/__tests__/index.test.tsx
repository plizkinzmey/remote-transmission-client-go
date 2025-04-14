import { describe, it, expect, vi } from "vitest";
import { TorrentContentHeader } from "../index"; // Импорт из index.ts
import type { TorrentContentHeaderProps } from "../index"; // Импорт типа из index.ts
import { TorrentContentHeader as OriginalTorrentContentHeader } from "../TorrentContentHeader"; // Импорт из файла компонента

describe("TorrentContentHeader index", () => {
    it("должен экспортировать компонент TorrentContentHeader", () => {
        expect(TorrentContentHeader).toBeDefined();
        // Дополнительно проверяем, что это действительно тот компонент
        expect(TorrentContentHeader).toBe(OriginalTorrentContentHeader);
    });

    it("должен экспортировать тип TorrentContentHeaderProps", () => {
        // Проверка существования типа во время компиляции
        const testProps: TorrentContentHeaderProps = {
            torrentName: "Test",
            onClose: vi.fn(),
        };
        expect(testProps).toBeDefined();
        expect(typeof testProps).toBe("object");
    });
});
