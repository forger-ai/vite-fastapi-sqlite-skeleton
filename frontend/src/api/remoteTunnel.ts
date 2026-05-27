export const REMOTE_RPC_PATH = "/__forger_remote_rpc";
export const REMOTE_WS_PATH = "/__forger_remote_ws";

const REMOTE_FLAG = import.meta.env.VITE_FORGER_REMOTE_TUNNEL === "true";
const REMOTE_SESSION_ID = import.meta.env.VITE_FORGER_REMOTE_SESSION_ID ?? "";
const REMOTE_HANDSHAKE_URL = import.meta.env.VITE_FORGER_CLOUD_HANDSHAKE_URL ?? "";

export type RemoteHandshake = {
  sessionId: string;
  tunnelUrl: string;
  desktopPublicKeyJwk: JsonWebKey;
  browserPublicKeyUploadUrl?: string;
  disconnectUrl?: string;
  loginUrl?: string;
  portalUrl?: string;
  portalRootUrl?: string;
  expiresAt?: string;
};

export type RemoteRpcRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  bodyBase64: string | null;
};

type RemoteRpcResponse = {
  status: number;
  headers: Record<string, string>;
  bodyBase64: string | null;
};

export type RemoteEnvelope = {
  sessionId: string;
  keyId: string;
  nonce: string;
  timestamp: string;
  browserPublicKeyJwk?: JsonWebKey;
  ciphertext: string;
};

let remoteStatePromise: Promise<RemoteState> | null = null;

export class RemoteState {
  constructor(
    readonly handshake: RemoteHandshake,
    readonly key: CryptoKey,
    readonly keyId: string,
    readonly browserPublicKeyJwk: JsonWebKey,
  ) {}
}

export function isForgerRemoteTunnel(): boolean {
  return REMOTE_FLAG;
}

export async function remoteFetch(input: RemoteRpcRequest, signal?: AbortSignal): Promise<Response> {
  const state = await getRemoteState();
  const envelope = await encryptRemoteEnvelope(state, input);
  const response = await fetch(`${state.handshake.tunnelUrl.replace(/\/+$/, "")}${REMOTE_RPC_PATH}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify(envelope),
    signal,
  });
  if (!response.ok) {
    return response;
  }
  const payload = await response.json().catch(() => null) as RemoteEnvelope | null;
  if (!payload?.ciphertext) {
    return new Response("remote_rpc_response_invalid", { status: 502 });
  }
  const decrypted = await decryptRemoteEnvelope<RemoteRpcResponse>(state, payload);
  return new Response(toArrayBuffer(base64ToBytes(decrypted.bodyBase64)), {
    status: decrypted.status,
    headers: decrypted.headers,
  });
}

export async function getRemoteState(): Promise<RemoteState> {
  if (!REMOTE_FLAG) {
    throw new Error("forger_remote_tunnel_disabled");
  }
  if (!remoteStatePromise) {
    remoteStatePromise = createRemoteState();
  }
  return remoteStatePromise;
}

async function createRemoteState(): Promise<RemoteState> {
  if (!REMOTE_SESSION_ID || !REMOTE_HANDSHAKE_URL) {
    throw new Error("forger_remote_handshake_missing");
  }
  const handshakeResponse = await fetch(REMOTE_HANDSHAKE_URL, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!handshakeResponse.ok) {
    throw new Error(`forger_remote_handshake_failed_${handshakeResponse.status}`);
  }
  const handshake = await handshakeResponse.json() as RemoteHandshake;
  if (handshake.sessionId !== REMOTE_SESSION_ID || !handshake.tunnelUrl || !handshake.desktopPublicKeyJwk) {
    throw new Error("forger_remote_handshake_invalid");
  }
  const browserPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );
  const desktopPublicKey = await crypto.subtle.importKey(
    "jwk",
    handshake.desktopPublicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: desktopPublicKey },
    browserPair.privateKey,
    256,
  );
  const keyMaterial = await crypto.subtle.digest("SHA-256", sharedSecret);
  const key = await crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  const browserPublicKeyJwk = await crypto.subtle.exportKey("jwk", browserPair.publicKey);
  const keyId = await sha256Hex(JSON.stringify(browserPublicKeyJwk));
  if (handshake.browserPublicKeyUploadUrl) {
    await fetch(handshake.browserPublicKeyUploadUrl, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: REMOTE_SESSION_ID, browserPublicKeyJwk, keyId }),
    }).catch(() => undefined);
  }
  return new RemoteState(handshake, key, keyId, browserPublicKeyJwk);
}

export async function encryptRemoteEnvelope(state: RemoteState, payload: unknown): Promise<RemoteEnvelope> {
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const timestamp = new Date().toISOString();
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(nonce), additionalData: toArrayBuffer(aad(state.handshake.sessionId, state.keyId, timestamp)) },
    state.key,
    plaintext,
  );
  return {
    sessionId: state.handshake.sessionId,
    keyId: state.keyId,
    nonce: bytesToBase64(nonce),
    timestamp,
    browserPublicKeyJwk: state.browserPublicKeyJwk,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptRemoteEnvelope<T>(state: RemoteState, envelope: RemoteEnvelope): Promise<T> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64ToBytes(envelope.nonce)),
      additionalData: toArrayBuffer(aad(envelope.sessionId, envelope.keyId, envelope.timestamp)),
    },
    state.key,
    toArrayBuffer(base64ToBytes(envelope.ciphertext)),
  );
  return JSON.parse(new TextDecoder().decode(plaintext)) as T;
}

function aad(sessionId: string, keyId: string, timestamp: string): Uint8Array {
  return new TextEncoder().encode(`${sessionId}\n${keyId}\n${timestamp}`);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function base64ToBytes(value: string | null): Uint8Array {
  if (!value) return new Uint8Array();
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
