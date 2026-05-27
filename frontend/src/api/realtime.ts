import { API_BASE_URL } from "./client";
import {
  REMOTE_WS_PATH,
  decryptRemoteEnvelope,
  encryptRemoteEnvelope,
  getRemoteState,
  isForgerRemoteTunnel,
  type RemoteEnvelope,
} from "./remoteTunnel";

export type RealtimeEvent = {
  event_id: string;
  channel: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
};

type RealtimeMessage = {
  action: "subscribe" | "unsubscribe";
  channel: string;
};

type RealtimeHandler = (event: RealtimeEvent) => void;

export function createRealtimeClient() {
  let socket: WebSocket | null = null;
  let remoteStatePromise = isForgerRemoteTunnel() ? getRemoteState() : null;
  const handlers = new Set<RealtimeHandler>();
  const pending: RealtimeMessage[] = [];

  async function connect(): Promise<void> {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    socket = new WebSocket(await realtimeUrl(remoteStatePromise));
    socket.addEventListener("open", () => {
      pending.splice(0).forEach((message) => {
        void send(message);
      });
    });
    socket.addEventListener("message", (event) => {
      void decodeEvent(event.data).then((payload) => {
        handlers.forEach((handler) => handler(payload));
      });
    });
    await new Promise<void>((resolve, reject) => {
      const current = socket;
      if (!current) {
        reject(new Error("realtime_socket_missing"));
        return;
      }
      current.addEventListener("open", () => resolve(), { once: true });
      current.addEventListener("error", () => reject(new Error("realtime_socket_error")), { once: true });
    });
  }

  async function send(message: RealtimeMessage): Promise<void> {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pending.push(message);
      await connect();
      return;
    }
    if (isForgerRemoteTunnel()) {
      socket.send(JSON.stringify(await encryptRemoteEnvelope(await ensureRemoteState(), message)));
      return;
    }
    socket.send(JSON.stringify(message));
  }

  async function decodeEvent(data: unknown): Promise<RealtimeEvent> {
    const text = typeof data === "string" ? data : await new Response(data as BodyInit).text();
    if (isForgerRemoteTunnel()) {
      return decryptRemoteEnvelope<RealtimeEvent>(await ensureRemoteState(), JSON.parse(text) as RemoteEnvelope);
    }
    return JSON.parse(text) as RealtimeEvent;
  }

  async function ensureRemoteState() {
    if (!remoteStatePromise) {
      remoteStatePromise = getRemoteState();
    }
    return remoteStatePromise;
  }

  return {
    connect,
    subscribe: (channel: string) => send({ action: "subscribe", channel }),
    unsubscribe: (channel: string) => send({ action: "unsubscribe", channel }),
    onEvent(handler: RealtimeHandler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    close() {
      pending.splice(0);
      socket?.close();
      socket = null;
    },
  };
}

async function realtimeUrl(remoteStatePromise: Promise<{ handshake: { tunnelUrl: string } }> | null): Promise<string> {
  if (isForgerRemoteTunnel()) {
    const state = await (remoteStatePromise ?? getRemoteState());
    return `${toWebSocketBase(state.handshake.tunnelUrl)}${REMOTE_WS_PATH}`;
  }
  return `${toWebSocketBase(API_BASE_URL)}/api/realtime/ws`;
}

function toWebSocketBase(url: string): string {
  const parsed = new URL(url);
  parsed.protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
  return parsed.toString().replace(/\/+$/, "");
}
