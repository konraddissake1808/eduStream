import {
  AccessToken,
  EgressClient,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
} from "livekit-server-sdk";

const RECORDING_BUCKET = "live-recordings";

// Server-only: needs LIVEKIT_API_SECRET, never expose this to the client.
export async function createLiveKitToken({
  roomName,
  identity,
  name,
  canPublish,
}: {
  roomName: string;
  identity: string;
  name: string;
  canPublish: boolean;
}) {
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name, ttl: "4h" }
  );

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}

export function newRoomName() {
  return `live-${crypto.randomUUID()}`;
}

// Recording uploads through Supabase's S3-compatible Storage endpoint,
// which needs its own access key pair (distinct from the service-role
// key) generated in the Supabase dashboard under Storage > S3 Connection.
// Recording is optional — sessions still work without it configured.
export function isRecordingConfigured() {
  return Boolean(
    process.env.SUPABASE_S3_ENDPOINT &&
      process.env.SUPABASE_S3_REGION &&
      process.env.SUPABASE_S3_ACCESS_KEY_ID &&
      process.env.SUPABASE_S3_SECRET_ACCESS_KEY
  );
}

function livekitHost() {
  return process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace(
    /^ws(s?):\/\//,
    "http$1://"
  );
}

function getEgressClient() {
  return new EgressClient(
    livekitHost(),
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
}

// Records the whole room (composite of all publishing participants) to
// an MP4 uploaded directly to the live-recordings bucket. Returns the
// egress ID so the caller can track/stop it later.
export async function startSessionRecording(
  roomName: string,
  recordingPath: string
) {
  // Rooms are normally created lazily when the first participant joins,
  // but recording is started right after the DB row is created — before
  // the host has connected — so the room wouldn't exist yet on LiveKit's
  // side without creating it explicitly first.
  const roomService = new RoomServiceClient(
    livekitHost(),
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!
  );
  await roomService.createRoom({ name: roomName });

  const output = new EncodedFileOutput({
    fileType: EncodedFileType.MP4,
    filepath: recordingPath,
    disableManifest: true,
    output: {
      case: "s3",
      value: new S3Upload({
        accessKey: process.env.SUPABASE_S3_ACCESS_KEY_ID!,
        secret: process.env.SUPABASE_S3_SECRET_ACCESS_KEY!,
        bucket: RECORDING_BUCKET,
        region: process.env.SUPABASE_S3_REGION!,
        endpoint: process.env.SUPABASE_S3_ENDPOINT!,
        forcePathStyle: true,
      }),
    },
  });

  const info = await getEgressClient().startRoomCompositeEgress(roomName, {
    file: output,
  });

  return info.egressId;
}

export async function stopSessionRecording(egressId: string) {
  await getEgressClient().stopEgress(egressId);
}

// Egress finalizes (encodes + uploads the tail of the file) asynchronously
// after stopEgress returns, so completion is reconciled lazily — checked
// the next time someone loads the session page rather than via a webhook.
export async function checkRecordingCompletion(
  egressId: string
): Promise<"ready" | "processing" | "failed"> {
  const [info] = await getEgressClient().listEgress({ egressId });

  if (!info) return "failed";

  if (info.status === EgressStatus.EGRESS_COMPLETE) return "ready";

  if (
    info.status === EgressStatus.EGRESS_FAILED ||
    info.status === EgressStatus.EGRESS_ABORTED ||
    info.status === EgressStatus.EGRESS_LIMIT_REACHED
  ) {
    return "failed";
  }

  return "processing";
}
