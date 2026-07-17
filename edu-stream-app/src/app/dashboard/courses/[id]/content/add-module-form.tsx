"use client";

import { useActionState } from "react";
import { createModule } from "./actions";

export function AddModuleForm({ courseId }: { courseId: string }) {
  const boundAction = createModule.bind(null, courseId);
  const [state, action, pending] = useActionState(boundAction, undefined);

  return (
    <form action={action} className="mt-3 flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="module-title" className="text-sm font-medium">
          Module title
        </label>
        <input
          id="module-title"
          name="title"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add module"}
      </button>
      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
    </form>
  );
}
