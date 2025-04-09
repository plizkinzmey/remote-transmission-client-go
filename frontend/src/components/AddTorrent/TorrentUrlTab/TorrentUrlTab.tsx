import React, { useState, useEffect } from "react";
import { TextField } from "@radix-ui/themes";
import "./TorrentUrlTab.css";

interface TorrentUrlTabProps {
  onUrlChange: (url: string) => void;
  initialUrl?: string;
}

export const TorrentUrlTab: React.FC<TorrentUrlTabProps> = ({
  onUrlChange,
  initialUrl = "",
}) => {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (initialUrl !== url) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    onUrlChange(newUrl);
  };

  return (
    <TextField.Root
      size="1"
      placeholder="magnet:?xt=urn:btih:..."
      value={url}
      onChange={handleUrlChange}
    />
  );
};
