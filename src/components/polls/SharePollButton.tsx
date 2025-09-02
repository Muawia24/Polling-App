"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

interface SharePollButtonProps {
  shareUrl: string;
}

export default function SharePollButton({ shareUrl }: SharePollButtonProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-100">
      <div className="text-sm font-medium mb-2">Share this poll</div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={shareUrl}
          readOnly
          className="flex-1 p-2 text-sm border rounded-md bg-gray-50"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={copyToClipboard}
          className="text-xs flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}