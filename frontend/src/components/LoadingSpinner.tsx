import React from "react";
import styled from "@emotion/styled";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledSpinner = styled(ArrowPathIcon)`
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  color: var(--text-primary);

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingSpinner: React.FC<{
  className?: string;
  size?: "small" | "medium" | "large";
}> = ({ className, size = "medium" }) => {
  const getSize = () => {
    switch (size) {
      case "small":
        return "16px";
      case "large":
        return "32px";
      default:
        return "24px";
    }
  };

  return (
    <SpinnerWrapper>
      <StyledSpinner
        className={className}
        style={{ width: getSize(), height: getSize() }}
      />
    </SpinnerWrapper>
  );
};
