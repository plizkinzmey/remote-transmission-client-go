import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface PortalProps {
  children: React.ReactNode;
  containerElement?: HTMLElement;
}

export const Portal: React.FC<PortalProps> = ({
  children,
  containerElement,
}) => {
  const container = containerElement || document.body;

  return createPortal(children, container);
};
