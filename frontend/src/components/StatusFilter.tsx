import React from "react";
import { useLocalization } from "../contexts/LocalizationContext";
import { Button, Flex } from "@radix-ui/themes";

interface StatusFilterProps {
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  hasNoTorrents: boolean;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  selectedStatus,
  onStatusChange,
  hasNoTorrents,
}) => {
  const { t } = useLocalization();

  const statuses = [
    { id: "downloading", label: "downloading" },
    { id: "seeding", label: "seeding" },
    { id: "stopped", label: "stopped" },
    { id: "checking", label: "checking" },
    { id: "queued", label: "queued" },
    { id: "completed", label: "completed" },
    { id: "slow", label: "slow" },
  ];

  const handleFilterClick = (id: string) => {
    onStatusChange(selectedStatus === id ? null : id);
  };

  return (
    <Flex gap="3" align="center" style={{ margin: "0 8px" }}>
      {statuses.map(({ id, label }) => (
        <Button
          key={label}
          size="1"
          variant={selectedStatus === id ? "soft" : "ghost"}
          disabled={hasNoTorrents}
          onClick={() => handleFilterClick(id)}
          style={{ minWidth: "auto", padding: "0 12px" }}
        >
          {t(`filters.${label}`)}
        </Button>
      ))}
    </Flex>
  );
};
