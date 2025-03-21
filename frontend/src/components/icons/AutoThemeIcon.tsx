import React from "react";

export const AutoThemeIcon = ({
  width = 20,
  height = 20,
}: {
  width?: number;
  height?: number;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
      fill="currentColor"
      opacity="0.3"
    />
    <path d="M12 2C6.48 2 2 6.48 2 12V12H12V2Z" fill="currentColor" />
    <path d="M12 12V22C17.52 22 22 17.52 22 12H12Z" fill="currentColor" />
  </svg>
);
