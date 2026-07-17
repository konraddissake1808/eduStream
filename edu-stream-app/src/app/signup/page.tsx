"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "./actions";

type Role = "student" | "teacher" | "institution";

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, undefined);
  const [role, setRole] = useState<Role>("student");

  if (state && "success" in state) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm text-center">
          <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">
            Check your email
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            We sent you a confirmation link. Click it to activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent">
          Sign up
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Create an eduStream account.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="fullName" className="text-sm font-medium">
              {role === "institution" ? "Institution name" : "Full name"}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">I am a...</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="student"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  className="accent-indigo-600"
                />
                Student
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="teacher"
                  checked={role === "teacher"}
                  onChange={() => setRole("teacher")}
                  className="accent-indigo-600"
                />
                Teacher
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  value="institution"
                  checked={role === "institution"}
                  onChange={() => setRole("institution")}
                  className="accent-indigo-600"
                />
                Institution
              </label>
            </div>
          </fieldset>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
