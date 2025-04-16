import { describe, it, expect } from "vitest";
import { TorrentItemStats } from "../index"; // Import from index.ts
import type { TorrentItemStatsProps } from "../index"; // Import type from index.ts
import { TorrentItemStats as OriginalComponent } from "../TorrentItemStats"; // Import from the component file

describe("TorrentItemStats index", () => {
    it("should export TorrentItemStats component", () => {
        expect(TorrentItemStats).toBeDefined();
        // Check if the exported component is the same as the original
        expect(TorrentItemStats).toBe(OriginalComponent);
    });

    it("should export TorrentItemStatsProps type", () => {
        // This is mainly a compile-time check.
        const props: TorrentItemStatsProps = {
            sizeFormatted: "1 GB",
            seedsConnected: 1,
            seedsTotal: 2,
            peersConnected: 3,
            peersTotal: 4,
            uploadedFormatted: "100 MB",
            downloadSpeedFormatted: "1 MB/s",
            uploadSpeedFormatted: "0.5 MB/s",
        };
        expect(props).toBeDefined();
        expect(typeof OriginalComponent).toBe("function"); // Ensure the component itself is a function
    });
});
