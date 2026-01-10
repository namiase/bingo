import { io } from "socket.io-client";

let socket = null;

function getBackendUrl() {
  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }
  const fromEnv = import.meta.env.VITE_BACKEND_URL;
  if (fromEnv) return fromEnv;

  // Usar misma IP/host que la página, pero puerto 4000
  try {
    const url = new URL(window.location.href);
    url.port = "4000";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "http://localhost:4000";
  }
}

export function connectToRoom(roomId, onState) {
  const backendUrl = getBackendUrl();

  socket = io(backendUrl, {
    transports: ["websocket", "polling"],
  });

  socket.on("connect", () => {
    socket.emit("join-room", roomId || "default");
  });

  socket.on("state", (state) => {
    onState(state);
  });

  const sendState = (state) => {
    if (!socket || !socket.connected) return;
    socket.emit("update-state", state);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  };

  return { sendState, disconnect };
}
