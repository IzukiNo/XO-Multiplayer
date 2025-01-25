const path = require("path");
const roomsData = require("../models/roomModels");

function checkWin(board, player) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (let pattern of winPatterns) {
    if (pattern.every((index) => board[index] === player)) {
      return true;
    }
  }
  return false;
}

module.exports.getGame = (req, res) => {
  const roomId = req.params.roomId;
  const room = roomsData.rooms.some((room) => room.id === roomId);
  if (!room) {
    return res.status(404).send({ message: "Co room deo dau!" });
  }
  res.sendFile(path.join(__dirname, "..", "..", "public", "game", "game.html"));
};

module.exports.inGame = (socket, io) => {
  socket.on("start", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    room.isStarted = true;

    io.to(roomId).emit("start", room);

    console.log(`Room ${roomId} started`);
  });

  socket.on("game-data", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    socket.emit("game-data", room);
    socket.emit("update", room);
  });

  socket.on("move", (move) => {
    const room = roomsData.rooms.find((room) => room.id === move.id);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }

    console.log(move);
    room.board[move.index] = move.player;
    room.currentPlayer = move.player === "X" ? "O" : "X";

    if (checkWin(room.board, move.player)) {
      const winStatus = {
        winner: move.player,
        board: room.board,
        id: move.id,
      };
      console.log(`Room ${move.id} win`);
      io.to(move.id).emit("win", winStatus);
      return;
    }

    io.to(move.id).emit("update", room);
  });

  socket.on("reset", (roomId) => {
    const room = roomsData.rooms.find((room) => room.id === roomId);
    room.board = Array(9).fill(null);
    room.currentPlayer = null;
    console.log(`Room ${roomId} reset`);
    io.to(roomId).emit("reset", room);
  });

  socket.on("ingame", (roomId) => {
    roomsData.socketGame[socket.id] = roomId;
  });

  socket.on("disconnect", () => {
    if (roomsData.socketGame[socket.id]) {
      console.log("User " + socket.id + " disconnect while in game");
      const room = roomsData.rooms.find(
        (room) => room.id === roomsData.socketGame[socket.id]
      );
      if (room) {
        roomsData.rooms.forEach((r) => {
          if (r.id === room.id) {
            r.players = r.players.filter(
              (player) => player !== socket.username
            );
          }
        });
        if (room.players.length === 0) {
          roomsData.rooms = roomsData.rooms.filter((r) => r.id !== room.id);
          console.log(`Room ${room.id} removed while in game`);
          return;
        }
        io.to(room.id).emit("leave", room);
      }
    }
  });
};
