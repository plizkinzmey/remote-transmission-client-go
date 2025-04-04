import React from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  InfoCircledIcon,
} from "@radix-ui/react-icons";
import styles from "../styles/StatusMessage.module.css";

/**
 * Типы статусов сообщений
 */
export type StatusType = "success" | "error" | "info" | "none";

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
}

/**
 * Компонент для отображения статусных сообщений с фиксированной высотой
 * Используется для предотвращения "скачков" интерфейса при появлении/исчезновении сообщений
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  status,
  message,
  fixedHeight = true,
  height = "48px",
  animated = true,
}) => {
  // Если статус "none", возвращаем пустой блок с фиксированной высотой (если включено)
  if (status === "none") {
    return fixedHeight ? <Box style={{ height }} /> : null;
  }

  // Определяем иконку в зависимости от типа статуса
  let icon;

  switch (status) {
    case "success":
      icon = (
        <CheckCircledIcon width={16} height={16} className={styles.success} />
      );
      break;
    case "error":
      icon = (
        <CrossCircledIcon width={16} height={16} className={styles.error} />
      );
      break;
    case "info":
    default:
      icon = <InfoCircledIcon width={16} height={16} className={styles.info} />;
  }

  return (
    <Box
      className={fixedHeight ? styles.statusContainer : undefined}
      style={fixedHeight ? { height } : undefined}
    >
      <Flex
        align="center"
        gap="1"
        className={animated ? styles.animated : undefined}
      >
        {icon}
        <Text
          size="1"
          color={status as any} // 'success', 'error', 'info' совместимы с цветами Radix UI
          className={styles.expandableMessage}
          title={message} // Полное сообщение будет доступно при наведении
        >
          {message}
        </Text>
      </Flex>
    </Box>
  );
};

export default StatusMessage;
