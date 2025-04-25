import { describe, it, expect } from "vitest";
import { TorrentFileTab } from "../index"; // <--- Corrected path
import { TorrentFileTab as OriginalComponent } from "../TorrentFileTab"; // <--- Corrected path

describe("TorrentFileTab index", () => {
    it("should export TorrentFileTab component", () => {
        expect(TorrentFileTab).toBeDefined();
        expect(TorrentFileTab).toBe(OriginalComponent);
    });
});
