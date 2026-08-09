import { getAccessToken } from './tokenStore';
import type { NotificationType } from '@/types';

// Derives the WebSocket URL from the same base the REST client uses, so
// dev/prod both "just work" without a separate env var: swap the scheme
// (http->ws, https->wss) and the /api/v1 REST path for the WS one.
function resolveWsUrl(): string {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL ?? 'https://houseofseyainventorymanagementbackend-production.up.railway.app/api/v1';
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws/notifications';
  url.search = '';
  return url.toString();
}

export interface NotificationSocketMessage {
  type: 'notification';
  id: string;
  notificationType: NotificationType;
  title: string;
  message: string;
}

type MessageHandler = (payload: NotificationSocketMessage) => void;

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

let socket: WebSocket | null = null;
let reconnectAttempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let manuallyClosed = false;
let onMessage: MessageHandler | null = null;

function scheduleReconnect() {
  if (manuallyClosed) return;
  const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY_MS);
  reconnectAttempt++;
  reconnectTimer = setTimeout(connect, delay);
}

function connect() {
  const token = getAccessToken();
  if (!token || manuallyClosed) return;

  const url = new URL(resolveWsUrl());
  url.searchParams.set('token', token);

  const ws = new WebSocket(url.toString());
  socket = ws;

  ws.onopen = () => {
    reconnectAttempt = 0;
  };

  ws.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onMessage?.(payload);
    } catch {
      // ignore malformed payloads
    }
  };

  ws.onclose = () => {
    if (socket === ws) socket = null;
    scheduleReconnect();
  };

  ws.onerror = () => {
    ws.close();
  };
}

export function connectNotificationSocket(handler: MessageHandler) {
  onMessage = handler;
  manuallyClosed = false;
  reconnectAttempt = 0;
  connect();
}

export function disconnectNotificationSocket() {
  manuallyClosed = true;
  onMessage = null;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  socket?.close();
  socket = null;
}
