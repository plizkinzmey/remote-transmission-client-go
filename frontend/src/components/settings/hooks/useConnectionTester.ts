import { useState, useCallback } from "react";
import { useLocalization } from "@contexts/LocalizationContext";

interface UseConnectionTesterResult {
  isConnectionValid: boolean;
  connectionErrorMessage: string;
  handleConnectionTestResult: (success: boolean, errorMessage?: string) => void;
  resetConnectionTest: () => void;
}

export const useConnectionTester = (): UseConnectionTesterResult => {
  const { t } = useLocalization();
  const [isConnectionValid, setIsConnectionValid] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState("");

  const handleConnectionTestResult = useCallback(
    (success: boolean, errorMessage?: string) => {
      setIsConnectionValid(success);
      setConnectionErrorMessage(
        success
          ? t("settings.testSuccess")
          : errorMessage || t("settings.testFailed")
      );
    },
    [t]
  );

  const resetConnectionTest = useCallback(() => {
    setIsConnectionValid(false);
    setConnectionErrorMessage("");
  }, []);

  return {
    isConnectionValid,
    connectionErrorMessage,
    handleConnectionTestResult,
    resetConnectionTest,
  };
};
