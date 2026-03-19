"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { acknowledgeBookingRequest } from "./actions";

export function AcknowledgeButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await acknowledgeBookingRequest(requestId);
            toast.success("Acknowledged");
            router.refresh();
          } catch (e) {
            toast.error("Failed", {
              description: e instanceof Error ? e.message : "Please try again",
            });
          }
        });
      }}
    >
      {isPending ? "Saving…" : "OK"}
    </Button>
  );
}
