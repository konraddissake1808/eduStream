"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/supabase/dal";

export type EnrollState = { error: string } | { success: true } | undefined;

export async function enrollInCourse(
  courseId: string,
  _prevState: EnrollState,
  _formData: FormData
): Promise<EnrollState> {
  const profile = await requireProfile(`/courses/${courseId}`);

  const supabase = await createClient();

  // Re-check the course server-side rather than trusting the client.
  const { data: course, error: courseError } = await supabase
    .from("course")
    .select("id, price, is_published")
    .eq("id", courseId)
    .single();

  if (courseError || !course || !course.is_published) {
    return { error: "Course not found." };
  }

  if (course.price > 0) {
    return { error: "Paid enrollment isn't available yet." };
  }

  const { error } = await supabase.from("enrollment").insert({
    student_id: profile.id,
    course_id: courseId,
    amount_paid: 0,
  });

  // 23505 = unique violation, i.e. already enrolled: treat as a no-op.
  if (error && error.code !== "23505") {
    return { error: error.message };
  }

  // Deliberately not calling revalidatePath here: it would refresh the
  // parent page's server-rendered "already enrolled" branch immediately,
  // unmounting this button before its own success confirmation ever
  // gets to paint. The DB write already happened, so a later reload
  // reflects it correctly regardless.
  return { success: true };
}
