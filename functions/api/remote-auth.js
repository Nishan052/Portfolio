/**
 * Cloudflare Pages Function: /api/remote-auth
 *
 * Handles Pusher private channel authentication.
 * Uses Web Crypto API (available in CF Workers) to generate the HMAC-SHA256 signature.
 *
 * Required environment variables (set in Cloudflare dashboard):
 *   PUSHER_APP_ID     — your Pusher app ID
 *   PUSHER_KEY        — your Pusher app key
 *   PUSHER_SECRET     — your Pusher app secret
 *   PUSHER_CLUSTER    — e.g. "eu" or "us2"
 */
export async function onRequestPost({ request, env }) {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET) {
    return new Response(JSON.stringify({ error: "Pusher not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    body = Object.fromEntries(params.entries());
  } catch {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const socketId   = body.socket_id;
  const channelName = body.channel_name;

  // Validate inputs
  if (!socketId || !channelName) {
    return new Response(JSON.stringify({ error: "Missing socket_id or channel_name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate channel name format: must be private-remote-{uuid}
  const channelPattern = /^private-remote-[0-9a-f-]{36}$/i;
  if (!channelPattern.test(channelName)) {
    return new Response(JSON.stringify({ error: "Invalid channel" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Compute HMAC-SHA256 signature
  const stringToSign = `${socketId}:${channelName}`;
  const encoder      = new TextEncoder();
  const keyData      = encoder.encode(PUSHER_SECRET);
  const msgData      = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signature  = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const hexSig     = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const authStr = `${PUSHER_KEY}:${hexSig}`;

  return new Response(JSON.stringify({ auth: authStr }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
