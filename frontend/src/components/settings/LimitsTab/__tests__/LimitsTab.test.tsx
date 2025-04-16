import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LimitsTab, LimitsTabProps } from "../LimitsTab";
import { ConnectionConfig } from "../../../../App"; // Adjust path if needed

// Mock useLocalization hook
vi.mock("../../../../contexts/LocalizationContext", () => ({
    useLocalization: () => ({
        t: (key: string) => {
            const translations: { [key: string]: string } = {
                "settings.maxUploadRatio": "Max Upload Ratio",
                "settings.slowSpeedLimit": "Slow Speed Limit",
                "settings.KiB/s": "KiB/s",
                "settings.MiB/s": "MiB/s",
                "settings.slowSpeedLimitHint": "Hint text",
            };
            return translations[key] || key;
        },
    }),
}));

// Mock Radix UI components used
vi.mock("@radix-ui/themes", async () => {
    const actual = await vi.importActual("@radix-ui/themes");
    const selectCallbacks: { [key: string]: (value: string) => void } = {};

    return {
        ...actual,
        TextField: {
            Root: ({ id, "data-testid": dataTestId, value, onChange, color, ...props }: any) => (
                <input
                    id={id}
                    data-testid={dataTestId}
                    value={value}
                    onChange={onChange}
                    data-color={color}
                    {...props}
                />
            ),
        },
        Select: {
            __triggerChange: (testId: string, value: string) => {
                if (selectCallbacks[testId]) {
                    selectCallbacks[testId](value);
                }
            },
            Root: ({ "data-testid": dataTestId, value, onValueChange, children }: any) => {
                if (dataTestId && onValueChange) {
                    selectCallbacks[dataTestId] = onValueChange;
                }
                return (
                    <div data-testid={dataTestId} data-value={value}>
                        {children}
                    </div>
                );
            },
            Trigger: ({ "data-testid": dataTestId }: any) => (
                <button data-testid={dataTestId}>Trigger</button>
            ),
            Content: ({ children }: any) => <div>{children}</div>,
            Group: ({ children }: any) => <div>{children}</div>,
            Item: ({ "data-testid": dataTestId, value, children }: any) => (
                <div data-testid={dataTestId} data-value={value}>
                    {children}
                </div>
            ),
        },
        Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
        Grid: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        Box: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
    };
});

// Mock CSS Modules
vi.mock("../LimitsTab.module.css", () => ({
    default: {
        inputMaxWidth: "inputMaxWidth-mock",
    },
}));

import { Select as MockSelect } from "@radix-ui/themes";

const defaultSettings: ConnectionConfig = {
    host: "localhost",
    port: 9091,
    username: "",
    password: "",
    maxUploadRatio: 2.0,
    slowSpeedLimit: 50,
    slowSpeedUnit: "KiB/s",
};

const renderComponent = (props: Partial<LimitsTabProps> = {}) => {
    const mergedProps: LimitsTabProps = {
        settings: defaultSettings,
        onSettingsChange: vi.fn(),
        errors: {},
        ...props,
    };
    return render(<LimitsTab {...mergedProps} />);
};

describe("LimitsTab Component", () => {
    let mockOnSettingsChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockOnSettingsChange = vi.fn();
        const selectModule = MockSelect as any;
        if (selectModule.__triggerChange) {
            const selectCallbacks = (selectModule as any).selectCallbacks;
            if (selectCallbacks) {
                Object.keys(selectCallbacks).forEach(key => delete selectCallbacks[key]);
            }
        }
    });

    it("renders correctly with initial settings", () => {
        renderComponent({ settings: defaultSettings });

        // Check labels
        expect(screen.getByText("Max Upload Ratio")).toBeInTheDocument();
        expect(screen.getByText("Slow Speed Limit")).toBeInTheDocument();
        expect(screen.getByText("Hint text")).toBeInTheDocument();

        // Check input values
        expect(screen.getByTestId("limits-max-upload-ratio-input")).toHaveValue(
            defaultSettings.maxUploadRatio
        );
        expect(screen.getByTestId("limits-slow-speed-limit-input")).toHaveValue(
            defaultSettings.slowSpeedLimit
        );

        // Check select value (using data-value on the mock)
        const selectRoot = screen.getByTestId("limits-slow-speed-unit-select");
        expect(selectRoot).toHaveAttribute("data-value", defaultSettings.slowSpeedUnit);

        // Check select items are present (within the mock structure)
        expect(screen.getByTestId("limits-slow-speed-unit-item-kib")).toHaveTextContent("KiB/s");
        expect(screen.getByTestId("limits-slow-speed-unit-item-mib")).toHaveTextContent("MiB/s");
    });

    it("calls onSettingsChange when maxUploadRatio is changed", () => {
        renderComponent({ onSettingsChange: mockOnSettingsChange });
        const input = screen.getByTestId("limits-max-upload-ratio-input");

        fireEvent.change(input, { target: { value: "3.5" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ maxUploadRatio: 3.5 });

        fireEvent.change(input, { target: { value: "" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ maxUploadRatio: 0 });

        fireEvent.change(input, { target: { value: "abc" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ maxUploadRatio: 0 });
    });

    it('renders maxUploadRatio input with empty string when value is 0 or null/undefined', () => {
        renderComponent({ settings: { ...defaultSettings, maxUploadRatio: 0 } });
        expect(screen.getByTestId('limits-max-upload-ratio-input')).toHaveValue(null);
    });

    it("calls onSettingsChange when slowSpeedLimit is changed", () => {
        renderComponent({ onSettingsChange: mockOnSettingsChange });
        const input = screen.getByTestId("limits-slow-speed-limit-input");

        fireEvent.change(input, { target: { value: "100" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ slowSpeedLimit: 100 });

        fireEvent.change(input, { target: { value: "" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ slowSpeedLimit: 0 });

        fireEvent.change(input, { target: { value: "xyz" } });
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ slowSpeedLimit: 0 });
    });

    it('renders slowSpeedLimit input with empty string when value is 0 or null/undefined', () => {
        renderComponent({ settings: { ...defaultSettings, slowSpeedLimit: 0 } });
        expect(screen.getByTestId('limits-slow-speed-limit-input')).toHaveValue(null);
    });

    it("calls onSettingsChange when slowSpeedUnit is changed", () => {
        renderComponent({ onSettingsChange: mockOnSettingsChange });
        const selectTestId = "limits-slow-speed-unit-select";

        const triggerChange = (MockSelect as any).__triggerChange;
        expect(triggerChange).toBeDefined();

        triggerChange(selectTestId, "MiB/s");
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ slowSpeedUnit: "MiB/s" });
        expect(mockOnSettingsChange).toHaveBeenCalledTimes(1);

        triggerChange(selectTestId, "KiB/s");
        expect(mockOnSettingsChange).toHaveBeenCalledWith({ slowSpeedUnit: "KiB/s" });
        expect(mockOnSettingsChange).toHaveBeenCalledTimes(2);

        triggerChange(selectTestId, "InvalidUnit");
        expect(mockOnSettingsChange).toHaveBeenCalledTimes(2);
    });

    it("displays validation errors", () => {
        const errors = {
            maxUploadRatio: "Ratio error",
            slowSpeedLimit: "Limit error",
        };
        renderComponent({ errors });

        const ratioError = screen.getByTestId("limits-max-upload-ratio-error");
        expect(ratioError).toBeInTheDocument();
        expect(ratioError).toHaveTextContent("Ratio error");
        expect(screen.getByTestId("limits-max-upload-ratio-input")).toHaveAttribute("data-color", "red");

        const limitError = screen.getByTestId("limits-slow-speed-limit-error");
        expect(limitError).toBeInTheDocument();
        expect(limitError).toHaveTextContent("Limit error");
        expect(screen.getByTestId("limits-slow-speed-limit-input")).toHaveAttribute("data-color", "red");
    });

    it('does not display errors when errors object is empty or not provided', () => {
        renderComponent({ errors: {} });
        expect(screen.queryByTestId("limits-max-upload-ratio-error")).not.toBeInTheDocument();
        expect(screen.queryByTestId("limits-slow-speed-limit-error")).not.toBeInTheDocument();
        expect(screen.getByTestId("limits-max-upload-ratio-input")).not.toHaveAttribute("data-color");
        expect(screen.getByTestId("limits-slow-speed-limit-input")).not.toHaveAttribute("data-color");
    });

    it('applies CSS module class for max width', () => {
        renderComponent();
        const ratioBox = screen.getByTestId('limits-max-upload-ratio-input').parentElement;
        expect(ratioBox).toHaveClass('inputMaxWidth-mock');

        const limitBox = screen.getByTestId('limits-slow-speed-limit-input').parentElement;
        expect(limitBox).toHaveClass('inputMaxWidth-mock');
    });

});
