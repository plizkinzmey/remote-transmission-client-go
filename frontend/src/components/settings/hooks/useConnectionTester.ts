import { useState, useCallback } from "react";
import { useLocalization } from "@contexts/LocalizationContext";

interface UseConnectionTesterResult {
  isConnectionValid: boolean;
  connectionErrorMessage: string | null;
  handleConnectionTestResult: (success: boolean, errorMessage?: string) => void;
  resetConnectionTest: () => void;
}

export const useConnectionTester = (): UseConnectionTesterResult => {
  const { t } = useLocalization();
  const [isConnectionValid, setIsConnectionValid] = useState(false);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<
    string | null
  >(null);

  const handleConnectionTestResult = useCallback(
    (success: boolean, errorMessage?: string) => {
      setIsConnectionValid(success);
      if (success) {
        setConnectionErrorMessage(t("settings.testSuccess"));
      } else if (errorMessage) {
        setConnectionErrorMessage(errorMessage);
      }
    },
    [t]
  );

  const resetConnectionTest = useCallback(() => {
    setIsConnectionValid(false);
    setConnectionErrorMessage(null);
  }, []);

  return {
    isConnectionValid,
    connectionErrorMessage,
    handleConnectionTestResult,
    resetConnectionTest,
  };
};
