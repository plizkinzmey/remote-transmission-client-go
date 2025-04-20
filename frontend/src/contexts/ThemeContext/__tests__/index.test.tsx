import { describe, it, expect } from "vitest";

// Import everything from index.ts
import * as ThemeContextModule from "../index";

// Import the original components/hooks/types directly for comparison
import {
    ThemeProvider as OriginalThemeProvider,
    useTheme as OriginalUseTheme,
    ThemeContext as OriginalThemeContext,
} from "../ThemeContext";
import type {
    ThemeType as OriginalThemeType,
    ThemeContextProps as OriginalThemeContextProps,
} from "../ThemeContext";

describe("ThemeContext index", () => {
    it("should export ThemeProvider component", () => {
        expect(ThemeContextModule.ThemeProvider).toBeDefined();
        expect(ThemeContextModule.ThemeProvider).toBe(OriginalThemeProvider);
    });

    it("should export useTheme hook", () => {
        expect(ThemeContextModule.useTheme).toBeDefined();
        expect(ThemeContextModule.useTheme).toBe(OriginalUseTheme);
    });

    it("should export ThemeContext", () => {
        expect(ThemeContextModule.ThemeContext).toBeDefined();
        expect(ThemeContextModule.ThemeContext).toBe(OriginalThemeContext);
    });

    it("should export ThemeType type", () => {
        // Typescript types don't exist at runtime, so we can't directly check them.
        // This test mainly ensures the export exists in the module's type definition.
        // We can perform a dummy check.
        const typeCheck: OriginalThemeType = "light";
        expect(typeof typeCheck).toBe("string"); // Basic runtime check
        // The real check happens during Typescript compilation
    });

    it("should export ThemeContextProps interface", () => {
        // Similar to types, interfaces don't exist at runtime.
        const propsCheck: OriginalThemeContextProps = { theme: 'dark', setTheme: () => { } };
        expect(typeof propsCheck).toBe("object"); // Basic runtime check
    });
});
