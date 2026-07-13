"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type SignupState =
  | { error: string }
  | { success: true }
  | undefined;

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = formData.get("fullName");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const role = formData.get("role");

  if (
    typeof fullName !== "string" ||
    !fullName ||
    typeof email !== "string" ||
    !email ||
    typeof password !== "string" ||
    !password ||
    typeof confirmPassword !== "string" ||
    (role !== "teacher" && role !== "student" && role !== "institution")
  ) {
    return { error: "Please fill in all fields." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const origin = (await headers()).get("origin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${origin}/auth/confirm`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation is on: no session yet, user must click the emailed link.
  if (!data.session) {
    return { success: true };
  }

  redirect("/");
}
