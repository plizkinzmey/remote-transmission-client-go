import React from "react";

export const SnailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 16c3.5 0 8-3 8-8s-2-5-4-5-3 1-3 1h-2s-1-1-3-1-4 0-4 5c0 3.5 2 8 8 8z" />
    <path d="M4 16c-1.5 0-4 .5-4 4 0 4.5 4 4 6 4 4 0 8.5-2 14-3" />
    <path d="M2 16c-.5 1.5 0 3 1.5 3 3 0 6-1 10-3" />
  </svg>
);