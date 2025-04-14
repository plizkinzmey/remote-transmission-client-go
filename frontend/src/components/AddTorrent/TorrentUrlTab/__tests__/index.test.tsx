import { describe, it, expect } from "vitest";
import { TorrentUrlTab } from "../index"; // <--- Corrected path
import { TorrentUrlTab as OriginalComponent } from "../TorrentUrlTab"; // <--- Corrected path

describe("TorrentUrlTab index", () => {
    it("should export TorrentUrlTab component", () => {
        expect(TorrentUrlTab).toBeDefined();
        expect(TorrentUrlTab).toBe(OriginalComponent);
    });
});
