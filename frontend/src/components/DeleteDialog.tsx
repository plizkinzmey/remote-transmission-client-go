import React from "react";
import { Dialog, Button, Text, Flex, Box, Checkbox } from "@radix-ui/themes";
import { useLocalization } from "../contexts/LocalizationContext";
import { LoadingSpinner } from "./LoadingSpinner";

interface DeleteDialogProps {
  mode: "single" | "bulk";
  torrentName?: string;
  count?: number;
  onConfirm: (deleteData: boolean) => void;
  onCancel: () => void;
  open: boolean;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  mode,
  torrentName,
  count,
  onConfirm,
  onCancel,
  open,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [deleteData, setDeleteData] = React.useState(false);

  if (isLocalizationLoading) {
    return <LoadingSpinner />;
  }

  const handleConfirm = () => {
    onConfirm(deleteData);
    setDeleteData(false); // Сбрасываем состояние для следующего использования
  };

  const handleCancel = () => {
    onCancel();
    setDeleteData(false); // Сбрасываем состояние для следующего использования
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleCancel}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>{t("remove.title")}</Dialog.Title>

        <Box my="4">
          <Text as="p" size="1" mb="3">
            {mode === "single"
              ? t("remove.confirmation")
              : t("remove.selectedConfirmation")}
          </Text>
          {mode === "single" && torrentName && (
            <Text as="p" size="1" weight="bold" mb="3">
              {torrentName}
            </Text>
          )}
          {mode === "bulk" && count && (
            <Text as="p" size="1" weight="bold" mb="3">
              {t("torrents.selected", String(count), String(count))}
            </Text>
          )}
        </Box>

        <Box
          mb="4"
          p="3"
          style={{
            background: "var(--gray-3)",
            borderRadius: "var(--radius-3)",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <Checkbox
              checked={deleteData}
              onCheckedChange={(checked) => setDeleteData(checked as boolean)}
            />
            <Text as="span" size="1">
              {t("remove.withData")}
            </Text>
          </label>
        </Box>

        <Flex gap="3" justify="end">
          <Button size="1" variant="soft" onClick={handleCancel}>
            {t("remove.cancel")}
          </Button>
          <Button size="1" variant="solid" color="red" onClick={handleConfirm}>
            {t("remove.confirm")}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
