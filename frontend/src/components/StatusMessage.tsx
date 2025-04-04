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
 * Типы цветов, поддерживаемых Radix UI для Text компонента
 */
type RadixTextColor = "green" | "red" | "blue" | undefined;

/**
 * Маппинг типов статусов на соответствующие цвета Radix UI
 */
const statusColorMap: Record<StatusType, RadixTextColor> = {
  success: "green",
  error: "red",
  info: "blue",
  none: undefined,
};

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

/**
 * Компонент для отображения статусных сообщений с фиксированной высотой
 * Используется для предотвращения "скачков" интерфейса при появлении/исчезновении сообщений
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  status,
  message,
  fixedHeight = true,
  height = "60px", // Увеличили высоту по умолчанию для двух строк
  animated = true,
  maxLines = 2, // По умолчанию разрешаем 2 строки
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

  // Задаем дополнительные стили в зависимости от maxLines
  const textStyle = {
    lineClamp: maxLines,
    WebkitLineClamp: maxLines,
  };

  return (
    <Box
      className={fixedHeight ? styles.statusContainer : undefined}
      style={fixedHeight ? { height } : undefined}
    >
      <Flex
        align="start"
        gap="1"
        className={`${styles.messageContainer} ${animated ? styles.animated : ""}`}
      >
        {icon}
        <Text
          size="1"
          color={statusColorMap[status]}
          className={styles.expandableMessage}
          title={message}
          style={textStyle}
        >
          {message}
        </Text>
      </Flex>
    </Box>
  );
};

export default StatusMessage;
