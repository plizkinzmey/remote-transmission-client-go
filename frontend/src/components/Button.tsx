import styled from "@emotion/styled";

interface ButtonProps {
  variant?: "icon" | "default" | "danger";
  loading?: boolean;
}

export const Button = styled.button<ButtonProps>`
  background-color: ${(props) => {
    if (props.variant === "icon") return "var(--header-button-bg)";
    if (props.variant === "danger") return "var(--error-color)";
    return "var(--accent-color)";
  }};
  color: ${(props) => {
    if (props.variant === "icon") return "var(--header-button-icon)";
    return "var(--button-text)";
  }};
  border: none;
  border-radius: 4px;
  padding: ${(props) => (props.variant === "icon" ? "8px" : "8px 16px")};
  font-size: 14px;
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  font-weight: 500;
  cursor: ${(props) => (props.loading ? "wait" : "pointer")};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: ${(props) => (props.variant === "icon" ? "36px" : "auto")};
  height: ${(props) => (props.variant === "icon" ? "36px" : "auto")};

  &:hover:not(:disabled) {
    background-color: ${(props) => {
      if (props.variant === "icon") return "var(--header-button-hover-bg)";
      if (props.variant === "danger") return "var(--error-color-hover)";
      return "var(--hover-color)";
    }};
  }

  &:disabled {
    background-color: ${(props) =>
      props.variant === "icon"
        ? "var(--header-button-disabled-bg)"
        : "var(--button-disabled-bg)"};
    color: ${(props) =>
      props.variant === "icon"
        ? "var(--header-button-disabled-icon)"
        : "var(--button-disabled-text)"};
    cursor: not-allowed;
    opacity: 0.7;
    transform: none;
    box-shadow: none;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  svg {
    width: ${(props) => (props.variant === "icon" ? "20px" : "14px")};
    height: ${(props) => (props.variant === "icon" ? "20px" : "14px")};
  }
`;

const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
`;

const ButtonText = styled.span`
  user-select: none;
  -webkit-user-select: none;
  cursor: default;
`;
