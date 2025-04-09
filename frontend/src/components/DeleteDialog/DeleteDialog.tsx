import React, { useEffect, useCallback, useState } from "react";
import { Dialog, Button, Text, Flex, Box, Checkbox } from "@radix-ui/themes";
import { useLocalization } from "../../contexts/LocalizationContext";
import { LoadingSpinner } from "../LoadingSpinner";
import { Portal } from "../Portal";
import styles from "./DeleteDialog.module.css";
import { useLogger } from "../../hooks";

/**
 * Свойства диалога удаления
 */
interface DeleteDialogProps {
  /** Режим работы диалога - single для одного торрента, bulk для множества */
  mode: "single" | "bulk";
  /** Имя торрента (только для режима single) */
  torrentName?: string;
  /** Количество выбранных торрентов (только для режима bulk) */
  count?: number;
  /** Callback при подтверждении удаления */
  onConfirm: (deleteData: boolean) => void;
  /** Callback при отмене */
  onCancel: () => void;
  /** Флаг открытия диалога */
  open: boolean;
}

/**
 * Диалог подтверждения удаления торрента(ов)
 * @param props - Свойства компонента
 * @returns React компонент
 */
export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  mode,
  torrentName,
  count,
  onConfirm,
  onCancel,
  open,
}) => {
  const { t, isLoading: isLocalizationLoading } = useLocalization();
  const [deleteData, setDeleteData] = useState(false);
  const logger = useLogger("DeleteDialog");

  // Сброс состояния при открытии диалога
  useEffect(() => {
    if (open) {
      setDeleteData(false);
      logger.info("Dialog opened", { mode, torrentName, count });
    }
  }, [open, torrentName, count, mode]);

  const handleConfirm = useCallback(() => {
    logger.info("Delete confirmed", { deleteData });
    onConfirm(deleteData);
  }, [deleteData, onConfirm, logger]);

  const handleCancel = useCallback(() => {
    logger.info("Delete cancelled");
    setDeleteData(false);
    onCancel();
  }, [onCancel, logger]);

  if (isLocalizationLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Portal>
      <Dialog.Root
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCancel();
          }
        }}
      >
        <Dialog.Content className={styles.deleteDialog} data-testid="delete-dialog-content">
          <Dialog.Title data-testid="delete-dialog-title">
            {t("remove.title")}
          </Dialog.Title>

          <Box my="4">
            {mode === "single" && torrentName ? (
              <Text
                as="p"
                size="1"
                className={styles.message}
                data-testid="delete-dialog-torrent-name"
              >
                {t("remove.message", torrentName)}
              </Text>
            ) : (
              <Text as="p" size="1" className={styles.message} data-testid="delete-dialog-confirmation">
                {t("remove.selectedConfirmation")}
              </Text>
            )}

            {mode === "bulk" && typeof count === "number" && (
              <Text
                as="p"
                size="1"
                weight="bold"
                className={styles.message}
                data-testid="delete-dialog-count"
              >
                {t("remove.selectedCount", String(count))}
              </Text>
            )}
          </Box>

          <Box className={styles.checkboxContainer}>
            <label className={styles.checkboxLabel}>
              <Checkbox
                checked={deleteData}
                onCheckedChange={(checked) => setDeleteData(!!checked)}
                data-testid="delete-dialog-checkbox"
              />
              <Text as="span" size="1">
                {t("remove.withData")}
              </Text>
            </label>
          </Box>

          <Flex className={styles.footer}>
            <Button
              size="1"
              variant="soft"
              onClick={handleCancel}
              data-testid="delete-dialog-cancel"
            >
              {t("remove.cancel")}
            </Button>
            <Button
              size="1"
              variant="solid"
              color="red"
              onClick={handleConfirm}
              data-testid="delete-dialog-confirm"
            >
              {t("remove.confirm")}
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Portal>
  );
};