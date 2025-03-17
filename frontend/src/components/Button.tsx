import React from "react";
import styled, { css } from "@emotion/styled";
import { LoadingSpinner } from "./LoadingSpinner";
import { SnailIcon } from "./icons/SnailIcon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "icon";
  loading?: boolean;
  active?: boolean;
  icon?: string;
}

const StyledButton = styled.button<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => (props.variant === "icon" ? "8px" : "8px 16px")};
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
  background: ${(props) =>
    props.variant === "icon" ? "transparent" : "var(--accent-color)"};
  color: ${(props) =>
    props.variant === "icon" ? "var(--text-primary)" : "var(--button-text)"};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.variant === "icon"
        ? "var(--background-secondary)"
        : "var(--accent-color)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${(props) =>
    props.active &&
    css`
      background-color: var(--accent-color);
      color: var(--text-on-accent);
    `}
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

export const Button: React.FC<ButtonProps> = ({
  children,
  loading = false,
  variant = "default",
  active = false,
  icon,
  ...props
}) => {
  const renderIcon = () => {
    if (icon === "snail") {
      return <SnailIcon />;
    }
    return null;
  };

  return (
    <StyledButton variant={variant} active={active} {...props}>
      {loading ? (
        <LoadingSpinner size="small" />
      ) : (
        <>
          {icon && <IconWrapper>{renderIcon()}</IconWrapper>}
          {children}
        </>
      )}
    </StyledButton>
  );
};
