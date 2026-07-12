"use client";

import { useActionState } from "react";
import { updateCourse } from "./actions";

type Category = { id: string; name: string };

type Course = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  price: number;
  thumbnail_url: string | null;
  is_published: boolean;
};

export function EditCourseForm({
  course,
  categories,
}: {
  course: Course;
  categories: Category[];
}) {
  const updateCourseWithId = updateCourse.bind(null, course.id);
  const [state, action, pending] = useActionState(
    updateCourseWithId,
    undefined
  );

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
          defaultValue={course.title}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          defaultValue={course.description ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categoryId" className="text-sm font-medium">
          Category
        </label>
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={course.category_id ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          Price (USD, 0 = free)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          min="0"
          step="0.01"
          defaultValue={course.price}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
          defaultValue={course.thumbnail_url ?? ""}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="publish"
          defaultChecked={course.is_published}
        />
        Published
      </label>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
