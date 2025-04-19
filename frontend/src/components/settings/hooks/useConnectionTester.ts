import { useState, useCallback } from "react";
import { useLocalization } from "../../../contexts/LocalizationContext";

interface UseConnectionTesterResult {
  isConnectionValid: boolean;
  connectionErrorMessage: string;
  handleConnectionTestResult: (success: boolean, errorMessage?: string) => void;
  resetConnectionTest: () => void; // Function to reset state
}

export const useConnectionTester = (): UseConnectionTesterResult => {
  const { t } = useLocalization();
  const [isConnectionValid, setIsConnectionValid] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState("");

  const handleConnectionTestResult = useCallback(
    (success: boolean, errorMessage?: string) => {
      setIsConnectionValid(success);
      if (success) {
        setConnectionErrorMessage(t("settings.testSuccess"));
      } else {
        setConnectionErrorMessage(errorMessage || t("settings.testFailed")); // Provide a default fail message
      }
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
