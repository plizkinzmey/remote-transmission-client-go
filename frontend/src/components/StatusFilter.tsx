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
    { id: "downloading", label: "downloading", color: "blue" },
    { id: "seeding", label: "seeding", color: "grass" },
    { id: "stopped", label: "stopped", color: "gray" },
    { id: "checking", label: "checking", color: "amber" },
    {
      id: "queued",
      label: "queued",
      color: "purple",
      matchStatuses: ["queued", "queuedCheck", "queuedDownload"],
    },
    { id: "completed", label: "completed", color: "mint" },
    { id: "slow", label: "slow", color: "orange" },
  ] as const;

  const handleFilterClick = (id: string) => {
    onStatusChange(selectedStatus === id ? null : id);
  };

  return (
    <Flex gap="3" align="center" style={{ margin: "0 8px" }}>
      {statuses.map(({ id, label, color }) => (
        <Button
          key={label}
          size="1"
          color={color}
          variant={selectedStatus === id ? "solid" : "soft"}
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
