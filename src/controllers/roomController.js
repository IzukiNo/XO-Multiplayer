let roomsData = require("../models/roomModels");
const path = require("path");

function generateRoomID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

exports.create = async (req, res) => {
  try {
    const roomId = generateRoomID();
    const owner = {
      name: req.body.ownerName,
      id: req.body.ownerId,
    };

    const newRoom = {
      id: roomId,
      owner: owner,
      moveCount: 0,
      isStarted: false,
      players: [],
      board: Array(9).fill(null),
      currentPlayer: null,
      timeout: null,
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
    const memberId = req.body.userId;

    if (!memberName) {
      return res.status(400).send({ message: "Username is required" });
    }

    const isMemberExist = room.players.some((player) => player === memberName);
    if (isMemberExist) {
      return res
        .status(400)
        .send({ message: "Member already exists in the room" });
    }

    const newMember = {
      name: memberName,
      id: memberId,
      score: 0,
    };

    room.players.push(newMember);

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

  try {
    const room = roomsData.rooms.find((room) => room.id === roomId);

    if (!room) {
      return res.status(404).send({ message: "Deo co room tk lon oi!" });
    }

    res.sendFile(
      path.join(__dirname, "..", "..", "public", "room", "room.html")
    );
  } catch (error) {
    console.error("Error getting room:", error);
    return res.status(500).send({ message: "Internal server error" });
  }
};

exports.getMain = async (req, res) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "public", "main", "index.html")
  );
};

exports.getRoomList = async (req, res) => {
  const safeRoom = roomsData.rooms.map(({ timeout, players, ...room }) => ({
    ...room,
    players: players.map(({ timeout, ...player }) => player),
  }));

  res.json(safeRoom);
};
