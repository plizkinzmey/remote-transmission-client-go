import React from "react";
import {
  Button as RadixButton,
  IconButton as RadixIconButton,
} from "@radix-ui/themes";
import { LoadingSpinner } from "./LoadingSpinner";
import { SnailIcon } from "./icons/SnailIcon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "icon" | "danger";
  loading?: boolean;
  active?: boolean;
  icon?: string;
  size?: "1" | "2" | "3";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  variant = "default",
  active = false,
  icon,
  size = "1",
  ...props
}) => {
  const renderIcon = () => {
    if (icon === "snail") {
      return <SnailIcon />;
    }
    return null;
  };

  // Преобразование внутренних вариантов в варианты Radix
  const getRadixVariant = () => {
    if (variant === "icon") {
      return active ? "solid" : "ghost";
    }
    return variant === "default" ? "solid" : "soft";
  };

  // Определяем цвет кнопки
  let radixColor;
  if (variant === "danger") {
    radixColor = "red";
  } else if (active) {
    radixColor = "blue";
  } else {
    radixColor = undefined;
  }

  // Вариант "icon" использует IconButton из RadixUI
  if (variant === "icon") {
    return (
      <RadixIconButton
        size={size}
        variant={getRadixVariant() as any}
        color={radixColor as any}
        data-active={active}
        disabled={loading || props.disabled}
        aria-label={props.title ?? ""}
        {...props}
      >
        {loading ? <LoadingSpinner size="small" /> : renderIcon() || children}
      </RadixIconButton>
    );
  }

  // Для обычных кнопок используем Button из RadixUI
  return (
    <RadixButton
      size={size}
      variant={getRadixVariant() as any}
      color={radixColor as any}
      disabled={loading || props.disabled}
      data-active={active}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="small" />
      ) : (
        <>
          {icon && renderIcon()}
          {children}
        </>
      )}
    </RadixButton>
  );
};
