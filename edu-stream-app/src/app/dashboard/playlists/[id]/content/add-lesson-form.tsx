"use client";

import { useActionState } from "react";
import { createLesson } from "./actions";

export function AddLessonForm({ playlistId }: { playlistId: string }) {
  const boundAction = createLesson.bind(null, playlistId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-md bg-neutral-50 p-3">
      <p className="text-xs font-medium text-neutral-500">Add lesson</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="lesson-title"
          name="title"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="lesson-description"
          name="description"
          rows={2}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-video" className="text-sm font-medium">
          Video file
        </label>
        <input
          id="lesson-video"
          name="video"
          type="file"
          accept="video/*"
          required
          className="text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPreview" />
        Free preview (visible without enrolling)
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Add lesson"}
      </button>
    </form>
  );
}
