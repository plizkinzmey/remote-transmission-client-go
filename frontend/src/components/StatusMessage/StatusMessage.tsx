import React from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import styles from "./StatusMessage.module.css";

/**
 * Типы статусов сообщений
 */
export type StatusType = "success" | "error" | "info" | "none";

/**
 * Типы цветов, поддерживаемых Radix UI для Text компонента
 */
type RadixTextColor = "green" | "red" | "blue" | undefined;

/**
 * Маппинг типов статусов на соответствующие цвета Radix UI и ARIA роли
 */
const statusConfig: Record<StatusType, { color: RadixTextColor; role: string | undefined; label: string }> = {
  success: { color: "green", role: "status", label: "Успешно" },
  error: { color: "red", role: "alert", label: "Ошибка" },
  info: { color: "blue", role: "status", label: "Информация" },
  none: { color: undefined, role: undefined, label: "" },
};

/**
 * Компонент для отображения статусных сообщений с фиксированной высотой
 * Используется для предотвращения "скачков" интерфейса при появлении/исчезновении сообщений
 */
export const StatusMessage = React.memo<StatusMessageProps>(({
  status,
  message,
  fixedHeight = true,
  height = "60px",
  animated = true,
  maxLines = 2,
}) => {
  // Если статус "none", возвращаем пустой блок с фиксированной высотой (если включено)
  if (status === "none") {
    return fixedHeight ? <Box style={{ height }} /> : null;
  }

  const config = statusConfig[status];

  // Определяем иконку в зависимости от типа статуса
  const icon = React.useMemo(() => {
    switch (status) {
      case "success":
        return (
          <CheckCircledIcon
            width={16}
            height={16}
            className={styles.success}
            aria-hidden="true"
          />
        );
      case "error":
        return (
          <CrossCircledIcon
            width={16}
            height={16}
            className={styles.error}
            aria-hidden="true"
          />
        );
      case "info":
      default:
        return (
          <InfoCircledIcon
            width={16}
            height={16}
            className={styles.info}
            aria-hidden="true"
          />
        );
    }
  }, [status]);

  // Задаем дополнительные стили в зависимости от maxLines
  const textStyle = {
    lineClamp: maxLines,
    WebkitLineClamp: maxLines,
  };

  return (
    <Box
      className={fixedHeight ? styles.statusContainer : undefined}
      style={fixedHeight ? { height } : undefined}
      role={config.role}
      aria-live={status === "error" ? "assertive" : "polite"}
    >
      <Flex
        align="start"
        gap="1"
        className={`${styles.messageContainer}${animated ? ` ${styles.animated}` : ''}`}
      >
        {icon}
        <Text
          size="1"
          color={config.color}
          className={styles.expandableMessage}
          title={message}
          style={textStyle}
          aria-label={`${config.label}: ${message}`}
        >
          {message}
        </Text>
      </Flex>
    </Box>
  );
});

StatusMessage.displayName = 'StatusMessage';

/**
 * Интерфейс пропсов компонента StatusMessage
 */
export interface StatusMessageProps {
  /** Тип статуса сообщения */
  status: StatusType;
  /** Текст сообщения */
  message: string;
  /** Использовать ли фиксированную высоту */
  fixedHeight?: boolean;
  /** Значение высоты в пикселях или других единицах измерения CSS */
  height?: string;
  /** Применить ли анимацию появления */
  animated?: boolean;
  /** Максимальное количество строк для отображения */
  maxLines?: 1 | 2;
}

export default StatusMessage;