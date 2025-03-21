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
    { id: "stopped", label: "stopped" },
    { id: "checking", label: "checking" },
    { id: "queued", label: "queued" },
    { id: "completed", label: "completed" },
    { id: "slow", label: "slow" },
  ];

  return (
    <Flex gap="1" align="center">
      {statuses.map(({ id, label }) => (
        <Button
          key={label}
          size="1"
          variant={selectedStatus === id ? "soft" : "ghost"}
          disabled={hasNoTorrents}
          onClick={() => onStatusChange(id)}
        >
          {t(`filters.${label}`)}
        </Button>
      ))}
    </Flex>
  );
};
