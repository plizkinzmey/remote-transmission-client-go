import { describe, it, expect } from "vitest";
import { TorrentItemProgress } from "../index"; // Import from index.ts
import type { TorrentItemProgressProps } from "../index"; // Import type from index.ts
import { TorrentItemProgress as OriginalComponent } from "../TorrentItemProgress"; // Import from the component file

describe("TorrentItemProgress index", () => {
    it("should export TorrentItemProgress component", () => {
        expect(TorrentItemProgress).toBeDefined();
        // Check if the exported component is the same as the original
        expect(TorrentItemProgress).toBe(OriginalComponent);
    });

    it("should export TorrentItemProgressProps type", () => {
        // This is mainly a compile-time check.
        // We can create a dummy object to ensure the type is usable.
        const props: TorrentItemProgressProps = {
            progress: 50,
            status: "downloading",
        };
        expect(props).toBeDefined();
        expect(typeof OriginalComponent).toBe("function"); // Ensure the component itself is a function
    });
});
