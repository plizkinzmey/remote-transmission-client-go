import { describe, it, expect } from "vitest";
import { TorrentItemActions } from "../index"; // Import from index.ts
import { TorrentItemActions as OriginalComponent } from "../TorrentItemActions"; // Import from the component file
// Import type for check, though runtime check is limited
import type { TorrentItemActionsProps } from "../index";

describe("TorrentItemActions index", () => {
    it("should export TorrentItemActions component", () => {
        expect(TorrentItemActions).toBeDefined();
        // Check if the exported component is the same as the original
        expect(TorrentItemActions).toBe(OriginalComponent);
    });

    it("should export TorrentItemActionsProps type", () => {
        // This is a compile-time check essentially.
        // We can try a simple runtime check to ensure the export exists,
        // although it doesn't guarantee it's the correct type.
        const props: TorrentItemActionsProps = {
            id: 1,
            status: "stopped",
            isLoading: false,
            lastAction: null,
            isSlowMode: false,
            onViewContent: () => { },
            onStart: () => { },
            onStop: () => { },
            onRemove: () => { },
        };
        expect(props).toBeDefined();
        // A more robust check would involve reflection or specific type assertions
        // if needed, but for basic export validation, this is often sufficient.
        expect(typeof OriginalComponent).toBe("function"); // Ensure the component itself is a function (React component)
    });
});
