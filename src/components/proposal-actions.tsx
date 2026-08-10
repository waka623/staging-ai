"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconDownload, IconLink } from "@/components/icons";

export function PrintButton() {
  return (
    <Button variant="primary" onClick={() => window.print()}>
      <IconDownload className="h-4 w-4" />
      PDFでダウンロード
    </Button>
  );
}

export function ShareLinkButton({ shareToken }: { shareToken: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/s/${shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("共有リンクをコピーしてください", url);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick}>
      <IconLink className="h-4 w-4" />
      {copied ? "コピーしました" : "共有リンクをコピー"}
    </Button>
  );
}
