import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { v4 as uuidv4 } from "uuid";
import { GRID_SIZE } from "./src/types.ts";
import type { Point, Player, Room } from "./src/types.ts";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    transports: ["polling", "websocket"],
    allowEIO3: true // Support older socket.io clients if needed
  });

  const PORT = 3000;
  const GAME_SPEED = 80; // Increased speed (from 100) for more responsive input

  app.use(cors());
  app.use(express.json());

  const rooms: { [id: string]: Room } = {};

  function spawnFood(occupiedPoints: Point[]): Point {
    let point: Point;
    do {
      point = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (occupiedPoints.some((p) => p.x === point.x && p.y === point.y));
    return point;
  }

  io.on("connection", (socket) => {
    console.log(`[SOCKET] New connection: ${socket.id}`);

    socket.on("ping", () => {
      socket.emit("pong");
    });

    socket.on("join-room", ({ roomId, username, color }) => {
      console.log(`[SOCKET] Player ${username} joining room ${roomId}`);
      let room = rooms[roomId];

      if (!room) {
        room = {
          id: roomId,
          players: {},
          food: spawnFood([]),
          powerUp: null,
          status: "playing",
        };
        rooms[roomId] = room;
      }

      const player: Player = {
        id: socket.id,
        username,
        snake: [{ x: 5, y: 5 }],
        direction: { x: 1, y: 0 },
        score: 0,
        color: color || "#00ffcc",
        isAlive: true,
      };

      room.players[socket.id] = player;
      socket.join(roomId);
      
      console.log(`[SERVER] Emitting initial room-update to room ${roomId}`);
      io.to(roomId).emit("room-update", room);
      console.log(`User ${username} joined room ${roomId}`);
    });

    socket.on("change-direction", ({ roomId, direction }) => {
      const room = rooms[roomId];
      if (room && room.players[socket.id]) {
        const player = room.players[socket.id];
        // Prevent 180-degree turns
        if (
          (direction.x !== 0 && player.direction.x === 0) ||
          (direction.y !== 0 && player.direction.y === 0)
        ) {
          player.direction = direction;
        }
      }
    });

    socket.on("disconnect", () => {
      Object.keys(rooms).forEach((roomId) => {
        const room = rooms[roomId];
        if (room.players[socket.id]) {
          delete room.players[socket.id];
          if (Object.keys(room.players).length === 0) {
            delete rooms[roomId];
          } else {
            io.to(roomId).emit("room-update", room);
          }
        }
      });
      console.log("User disconnected:", socket.id);
    });
  });

  // Simple game loop for each room
  setInterval(() => {
    Object.keys(rooms).forEach((roomId) => {
      const room = rooms[roomId];
      if (room.status !== "playing") return;

      const allOccupiedPoints: Point[] = [];
      Object.values(room.players).forEach((p) => p.snake.forEach((pt) => allOccupiedPoints.push(pt)));

      Object.values(room.players).forEach((player) => {
        if (!player.isAlive) return;

        const head = player.snake[0];
        const newHead = {
          x: (head.x + player.direction.x + GRID_SIZE) % GRID_SIZE,
          y: (head.y + player.direction.y + GRID_SIZE) % GRID_SIZE,
        };

        // Check collision with self or others
        if (allOccupiedPoints.some((p) => p.x === newHead.x && p.y === newHead.y)) {
            // In snake multiplayer, if you hit someone else you die, but let's be lenient for this demo
            // or just reset
            player.isAlive = false;
            return;
        }

        player.snake.unshift(newHead);

        // Check food collision
        if (newHead.x === room.food.x && newHead.y === room.food.y) {
          player.score += 10;
          room.food = spawnFood(allOccupiedPoints);
          // Spawn powerup occasionally
          if (Math.random() > 0.8 && !room.powerUp) {
              const types = ["speed", "ghost", "shield"];
              room.powerUp = {
                  type: types[Math.floor(Math.random() * types.length)],
                  pos: spawnFood([...allOccupiedPoints, room.food])
              };
          }
        } else {
          player.snake.pop();
        }

        // Check powerup collision
        if (room.powerUp && newHead.x === room.powerUp.pos.x && newHead.y === room.powerUp.pos.y) {
            player.score += 50;
            room.powerUp = null;
        }
      });

      io.to(roomId).emit("room-update", room);
    });
  }, GAME_SPEED);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
