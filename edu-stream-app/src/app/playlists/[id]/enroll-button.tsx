"use client";

import { useActionState } from "react";
import { enrollInPlaylist } from "../actions";

export function EnrollButton({ playlistId }: { playlistId: string }) {
  const boundAction = enrollInPlaylist.bind(null, playlistId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action}>
      {state?.error && (
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
