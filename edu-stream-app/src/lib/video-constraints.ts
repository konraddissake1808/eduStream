// Shared between server actions and client form components, so it must
// stay free of server-only imports (no admin client, no service-role key).
export const MAX_LESSON_VIDEO_BYTES = 50 * 1024 * 1024; // Supabase Storage free-plan limit
export const MAX_LESSON_VIDEO_LABEL = "50MB";
