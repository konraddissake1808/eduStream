import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType = "enrollment" | "live_session_started";

type NotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

// Best-effort, like tryStartRecording: a notification failing to write
// should never block the real action (enrolling, starting a session)
// that triggered it.
export async function createNotification(input: NotificationInput) {
  try {
    const admin = createAdminClient();
    await admin.from("notification").insert({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    });
  } catch {
    // Swallowed intentionally.
  }
}

export async function createNotifications(inputs: NotificationInput[]) {
  if (inputs.length === 0) return;

  try {
    const admin = createAdminClient();
    await admin.from("notification").insert(
      inputs.map((input) => ({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      }))
    );
  } catch {
    // Swallowed intentionally.
  }
}
