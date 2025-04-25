import { describe, it, expect } from "vitest";
import { DownloadPathSelector } from "../index"; // <--- Corrected path
import { DownloadPathSelector as OriginalComponent } from "../DownloadPathSelector"; // <--- Corrected path

describe("DownloadPathSelector index", () => {
    it("should export DownloadPathSelector component", () => {
        expect(DownloadPathSelector).toBeDefined();
        expect(DownloadPathSelector).toBe(OriginalComponent);
    });
});
