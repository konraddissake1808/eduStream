"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { getLiveSessionToken, endLiveSession } from "./actions";

export function LiveRoomClient({
  sessionId,
  title,
  isHost,
  isRecording,
}: {
  sessionId: string;
  title: string;
  isHost: boolean;
  isRecording: boolean;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getLiveSessionToken(sessionId)
      .then((result) => {
        if (!cancelled) setToken(result.token);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to join session."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleEnd() {
    await endLiveSession(sessionId);
    router.push("/dashboard");
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <p className="text-sm text-neutral-500">Connecting...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">{title}</h1>
          {isRecording && (
            <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
              Recording
            </span>
          )}
        </div>
        {isHost && (
          <button
            onClick={handleEnd}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            End session
          </button>
        )}
      </div>
      <div className="flex-1">
        <LiveKitRoom
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          token={token}
          connect
          video={isHost}
          audio={isHost}
          onDisconnected={() => router.push("/dashboard")}
          style={{ height: "100%" }}
        >
          <VideoConference />
        </LiveKitRoom>
      </div>
    </div>
  );
}
