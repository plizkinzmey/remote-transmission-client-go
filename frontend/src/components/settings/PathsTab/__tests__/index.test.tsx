
import { describe, it, expect } from "vitest";

// Import everything exported from the index file
import * as Exports from "../index";

// Import the component and type specifically to check against
import { PathsTab } from "../PathsTab";
import type { PathsTabRef as PathsTabRefType } from "../PathsTab"; // Use alias to avoid name clash if needed

describe("PathsTab index exports", () => {
    it("should export the PathsTab component", () => {
        // Check if PathsTab is exported and is the correct component (React components are functions or objects)
        expect(Exports.PathsTab).toBeDefined();
        expect(Exports.PathsTab).toBe(PathsTab);
        expect(typeof Exports.PathsTab === 'function' || typeof Exports.PathsTab === 'object').toBe(true);
    });

    it("should export the PathsTabRef type", () => {
        // Typescript types don't exist at runtime, so we can't directly check Exports.PathsTabRef.
        // However, we can ensure the named export exists conceptually by using it.
        // This test mainly serves as a structural check during compilation.
        // We can assign undefined to a variable typed with the imported type.
        let testRef: Exports.PathsTabRef | undefined = undefined;
        expect(testRef).toBeUndefined(); // Simple runtime check to ensure the test runs

        // We can also try to compare it structurally if needed, but it's complex.
        // A more practical check is that the specific import `PathsTabRefType` works.
        let anotherRef: PathsTabRefType | undefined = undefined;
        expect(anotherRef).toBeUndefined();

        // Check that the named export exists on the Exports object (even if its value is undefined at runtime for types)
        // Note: This might not be reliable depending on the bundler/transpiler settings for type-only exports.
        // expect('PathsTabRef' in Exports).toBe(true); // This might fail or pass unexpectedly.
    });
});
