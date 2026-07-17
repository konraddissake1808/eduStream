"use client";

import { useActionState } from "react";
import { startLiveSession } from "./actions";

type Institution = { id: string; full_name: string | null };

export function StartSessionForm({
  playlistId,
  institutions,
}: {
  playlistId: string;
  institutions: Institution[];
}) {
  const boundAction = startLiveSession.bind(null, playlistId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="live-title" className="text-sm font-medium">
          Session title
        </label>
        <input
          id="live-title"
          name="title"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {institutions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="live-institutionId" className="text-sm font-medium">
            Host as
          </label>
          <select
            id="live-institutionId"
            name="institutionId"
            defaultValue=""
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Myself</option>
            {institutions.map((institution) => (
              <option key={institution.id} value={institution.id}>
                {institution.full_name ?? "Institution"}
              </option>
            ))}
          </select>
        </div>
      )}

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Starting..." : "Start live session"}
      </button>
    </form>
  );
}
