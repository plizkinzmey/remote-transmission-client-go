import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { useLocalization } from "../contexts/LocalizationContext";

interface StatusFilterProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  hasNoTorrents?: boolean;
}

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-left: 16px;
  flex-wrap: wrap;
`;

const FilterButton = styled.button<{ isActive: boolean }>`
  padding: 4px 8px;
  border: none;
  background: ${(props) =>
    props.isActive ? "var(--accent-color)" : "transparent"};
  color: ${(props) => (props.isActive ? "#ffffff" : "var(--text-secondary)")};
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  font-size: 12px;
  transition: all 0.2s ease;
  min-height: 24px;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.isActive ? "var(--accent-color)" : "var(--background-hover)"};
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
`;

const statuses = [
  { key: "downloading" },
  { key: "seeding" },
  { key: "stopped" },
  { key: "checking" },
  { key: "queued" },
  { key: "completed" },
];

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
  hasNoTorrents = false,
}) => {
  const { t } = useLocalization();

  const handleFilterClick = useCallback(
    (status: string) => {
      onStatusChange(selectedStatus === status ? null : status);
    },
    [selectedStatus, onStatusChange]
  );

  return (
    <FilterContainer>
      {statuses.map((status) => (
        <FilterButton
          key={status.key}
          isActive={selectedStatus === status.key}
          onClick={() => handleFilterClick(status.key)}
          disabled={hasNoTorrents} // Кнопки блокируются только если нет торрентов
          type="button"
        >
          {t(`filters.${status.key}`)}
        </FilterButton>
      ))}
    </FilterContainer>
  );
};
