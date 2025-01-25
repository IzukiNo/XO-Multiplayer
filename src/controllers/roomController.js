let roomsData = require("../models/roomModels");
const path = require("path");

function generateRoomID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Tạo room mới
exports.create = async (req, res) => {
  try {
    const roomId = generateRoomID();
    const roomName = req.body.name;

    if (!roomName) {
      return res.status(400).send({ message: "Room name is required" });
    }

    const isRoomExist = roomsData.rooms.some((room) => room.name === roomName);
    if (isRoomExist) {
      return res.status(400).send({ message: "Room already exists" });
    }

    const newRoom = {
      id: roomId,
      name: roomName,
      isStarted: false,
      players: [],
      board: ["", "", "", "", "", "", "", "", ""],
      currentPlayer: null,
    };

    roomsData.rooms.push(newRoom);

    return res.status(201).json({
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.error("Error creating room:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

exports.join = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const room = roomsData.rooms.find((room) => room.id === roomId);

    if (!room) {
      return res.status(404).send({ message: "Room not found" });
    }

    const memberName = req.body.username;

    if (!memberName) {
      return res.status(400).send({ message: "Username is required" });
    }

    const isMemberExist = room.players.some((player) => player === memberName);
    if (isMemberExist) {
      return res
        .status(400)
        .send({ message: "Member already exists in the room" });
    }

    room.players.push(memberName);

    return res.status(200).json({
      message: "Member added successfully",
      room: {
        id: room.id,
        name: room.name,
        players: room.players,
      },
    });
  } catch (error) {
    console.error("Error joining room:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

exports.getRoom = async (req, res) => {
  const roomId = req.params.roomId;
  const room = roomsData.rooms.find((room) => room.id === roomId);

  if (!room) {
    return res.status(404).send("Deo co room thang lon oi!");
  }

  res.sendFile(path.join(__dirname, "..", "..", "public", "room", "room.html"));
};

exports.getMain = async (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "public", "main", "index.html")
  );
};

exports.getRoomList = async (req, res) => {
  res.json(roomsData.rooms);
};
