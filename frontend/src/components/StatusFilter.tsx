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
    { id: null, label: "all" },
    { id: "downloading", label: "downloading" },
    { id: "seeding", label: "seeding" },
    { id: "paused", label: "paused" },
    { id: "completed", label: "completed" },
    { id: "slow", label: "slow" },
  ];

  return (
    <Flex gap="2" align="center">
      {statuses.map(({ id, label }) => (
        <Button
          key={label}
          size="1"
          variant={selectedStatus === id ? "solid" : "ghost"}
          onClick={() => onStatusChange(id)}
          disabled={hasNoTorrents}
        >
          {t(`status.${label}`)}
        </Button>
      ))}
    </Flex>
  );
};
