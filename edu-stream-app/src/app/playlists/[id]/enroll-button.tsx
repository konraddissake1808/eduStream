"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { enrollInPlaylist } from "../actions";

export function EnrollButton({ playlistId }: { playlistId: string }) {
  const boundAction = enrollInPlaylist.bind(null, playlistId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  if (state && "success" in state) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-green-700">
        <CheckCircle2 className="h-4 w-4" />
        Enrolled! You can start learning now.
      </p>
    );
  }

  return (
    <form action={action}>
      {state && "error" in state && (
        <p className="mb-2 text-sm text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Enrolling..." : "Enroll for free"}
      </button>
    </form>
  );
}
