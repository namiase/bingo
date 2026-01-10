import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

// Estado por sala (roomId -> state)
const rooms = new Map();

io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("join-room", (roomId) => {
    const id = (roomId || "default").toString();
    if (currentRoom) {
      socket.leave(currentRoom);
    }
    currentRoom = id;
    socket.join(currentRoom);

    // Enviar último estado de la sala al nuevo cliente
    const state = rooms.get(currentRoom);
    if (state) {
      socket.emit("state", state);
    }
  });

  socket.on("update-state", (state) => {
    if (!currentRoom) return;
    // Guardar y reenviar a todos los demás en la sala
    rooms.set(currentRoom, state);
    socket.to(currentRoom).emit("state", state);
  });

  socket.on("disconnect", () => {
    // Nada especial por ahora; el estado queda en memoria
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`Bingo backend listening on http://localhost:${PORT}`);
});
