"use client";

import { useActionState } from "react";
import { createCourse } from "../actions";

type Category = { id: string; name: string };
type Institution = { id: string; full_name: string | null };

export function CourseForm({
  categories,
  institutions,
}: {
  categories: Category[];
  institutions: Institution[];
}) {
  const [state, action, pending] = useActionState(createCourse, undefined);

  return (
    <form action={action} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue=""
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="price" className="text-sm font-medium">
          Price (CFA francs, 0 = free)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="1"
          defaultValue="0"
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="thumbnailUrl" className="text-sm font-medium">
          Thumbnail URL
        </label>
        <input
          id="thumbnailUrl"
          name="thumbnailUrl"
          type="url"
          placeholder="https://..."
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {institutions.length > 0 && (
        <div className="flex flex-col gap-1">
          <label htmlFor="institutionId" className="text-sm font-medium">
            Post as
          </label>
          <select
            id="institutionId"
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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="publish" className="accent-indigo-600" />
        Publish immediately
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create course"}
      </button>
    </form>
  );
}
