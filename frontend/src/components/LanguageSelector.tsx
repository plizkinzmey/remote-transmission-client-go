import React from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";

const Select = styled.select`
  background: var(--toggle-background);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-primary);
  font-size: 12px;
  padding: 2px 24px 2px 12px;
  height: 24px;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--button-hover-background);
  }

  /* Custom arrow */
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
`;

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, availableLanguages, setLanguage } =
    useLocalization();

  return (
    <Container>
      <Select
        value={currentLanguage}
        onChange={(e) => setLanguage(e.target.value)}
        title={`${
          availableLanguages.find((lang) => lang.code === currentLanguage)?.name
        }`}
      >
        {availableLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </Select>
    </Container>
  );
};
