const socket = io();

function displayPlayers(players) {
  const playersList = document.getElementById("players");
  playersList.innerHTML = "";

  players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    playersList.appendChild(li);
  });

  // Kích hoạt nút Start nếu có ít nhất 2 người chơi
  const startButton = document.getElementById("start-button");
  startButton.disabled = players.length < 2;
}

function startGame() {
  const roomId = window.location.pathname.split("/")[1];
  socket.emit("start", roomId);
}

function joinRoom() {
  const roomId = window.location.pathname.split("/")[1];

  socket.emit("join", roomId);
}

document.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username");
  const roomId = window.location.pathname.split("/")[1];
  socket.emit("register", username);
  joinRoom();
  if (!username) {
    window.location.href = "/";
    return;
  }
  socket.emit("data", roomId);
  fetch(`/${roomId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
    }),
  })
    .then((response) => response.json())
    .then((data) => {})
    .catch((error) => console.error("Error:", error));
});

socket.on("joined", (room) => {
  console.log(`Some1 joined room ${room.id}`);
  displayPlayers(room.players);
});

socket.on("leave", (room) => {
  console.log(`Some1 left room ${room.id}`);
  displayPlayers(room.players);
});

socket.on("start", () => {
  const roomId = window.location.pathname.split("/")[1];
  window.location.href = `/${roomId}/game`;
});

socket.on("data", (data) => {
  console.log(data);
});
