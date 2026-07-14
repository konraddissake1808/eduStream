"use client";

import { useActionState } from "react";
import { addMemberByEmail } from "./actions";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMemberByEmail, undefined);

  return (
    <form action={action} className="flex items-end gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="teacher-email" className="text-sm font-medium">
          Teacher&apos;s email
        </label>
        <input
          id="teacher-email"
          name="email"
          type="email"
          required
          placeholder="teacher@example.com"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Adding..." : "Add teacher"}
      </button>

      {state && "error" in state && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && "success" in state && (
        <p className="text-sm text-green-700">Added {state.name}.</p>
      )}
    </form>
  );
}
