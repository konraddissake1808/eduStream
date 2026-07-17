"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Egress finalizes asynchronously, so there's no event to subscribe to —
// poll by re-running the server component (which re-checks status via
// reconcileRecordingStatus) until it stops rendering this at all, either
// because the video showed up or it failed.
export function ProcessingIndicator() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="mt-6 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
      Processing your recording — this will update automatically.
    </div>
  );
}
