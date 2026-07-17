"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createLesson } from "./actions";
import {
  MAX_LESSON_VIDEO_BYTES,
  MAX_LESSON_VIDEO_LABEL,
} from "@/lib/video-constraints";

export function AddLessonForm({ playlistId }: { playlistId: string }) {
  const boundAction = createLesson.bind(null, playlistId);
  const [state, action, pending] = useActionState(boundAction, undefined);
  const [sizeError, setSizeError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_LESSON_VIDEO_BYTES) {
      setSizeError(
        `That file is too large. Videos must be ${MAX_LESSON_VIDEO_LABEL} or smaller.`
      );
      e.target.value = "";
    } else {
      setSizeError(null);
    }
  }

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
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="lesson-video" className="text-sm font-medium">
          Video file (max {MAX_LESSON_VIDEO_LABEL})
        </label>
        <input
          id="lesson-video"
          name="video"
          type="file"
          accept="video/*"
          required
          onChange={handleFileChange}
          className="text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isPreview" className="accent-indigo-600" />
        Free preview (visible without enrolling)
      </label>

      {sizeError && <p className="text-sm text-red-600">{sizeError}</p>}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || !!sizeError}
        className="self-start rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Uploading..." : "Add lesson"}
      </button>
    </form>
  );
}
