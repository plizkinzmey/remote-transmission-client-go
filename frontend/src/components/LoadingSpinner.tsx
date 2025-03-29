import React from "react";
import { Flex } from "@radix-ui/themes";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface LoadingSpinnerProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  className,
  size = "medium",
}) => {
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
  
  // Формируем классы для тестирования
  const sizeClass = size || "medium";
  const spinnerClasses = ["spinner", sizeClass, className].filter(Boolean).join(' ');

  return (
    <Flex 
      justify="center" 
      align="center" 
      className={spinnerClasses}
      data-testid="loading-spinner"
    >
      <ArrowPathIcon
        width={getSize()}
        height={getSize()}
        style={{
          animation: "spin 1s linear infinite",
          color: "var(--text-primary)",
        }}
      />
    </Flex>
  );
};

// Добавляем глобальную анимацию вращения если её еще нет в CSS
if (typeof document !== 'undefined' && !document.querySelector("#spin-keyframes")) {
  const style = document.createElement("style");
  style.id = "spin-keyframes";
  style.textContent = `
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(style);
}
