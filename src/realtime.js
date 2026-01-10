import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// IMPORTANTE:
// Rellena estos datos con la configuración de tu proyecto Firebase
// (en la consola de Firebase > Configuración del proyecto > tus apps web).
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  databaseURL: "TU_DATABASE_URL",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

let db = null;

export function initFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "TU_API_KEY") {
    // Config no rellenada: no activamos la sincronización.
    return null;
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  db = getDatabase();
  return db;
}

export function getRoomIdFromLocation() {
  if (typeof window === "undefined") return "default";
  const hash = window.location.hash.replace("#", "").trim();
  return hash || "default";
}

export function listenGameState(roomId, callback) {
  if (!db) return () => {};
  const roomRef = ref(db, `rooms/${roomId}`);
  const off = onValue(roomRef, (snap) => {
    const data = snap.val();
    if (data) {
      callback(data);
    }
  });
  return () => off();
}

export function updateGameState(roomId, state) {
  if (!db) return;
  const roomRef = ref(db, `rooms/${roomId}`);
  set(roomRef, state);
}
