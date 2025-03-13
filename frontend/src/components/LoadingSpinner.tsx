import React from "react";
import styled from "@emotion/styled";

const SpinnerWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--background-secondary);
  border-top: 4px solid var(--accent-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

export const LoadingSpinner: React.FC = () => (
  <SpinnerWrapper>
    <Spinner />
  </SpinnerWrapper>
);
