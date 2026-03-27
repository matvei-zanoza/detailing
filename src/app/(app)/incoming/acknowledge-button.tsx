"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/i18n-provider";

import { acknowledgeBookingRequest } from "./actions";

export function AcknowledgeButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { t } = useI18n();

  return (
    <Button
      size="sm"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await acknowledgeBookingRequest(requestId);
            toast.success(t("incoming.acknowledged"));
            router.refresh();
          } catch (e) {
            toast.error(t("incoming.failed"), {
              description: e instanceof Error ? e.message : t("incoming.tryAgain"),
            });
          }
        });
      }}
    >
      {isPending ? t("incoming.saving") : t("incoming.ok")}
    </Button>
  );
}
