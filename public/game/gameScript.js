const socket = io();

let currentPlayer = null;
let yourPlayer = "X";
let board = Array(9).fill(null);

let moveCount = -1;

let score = {
  your: 0,
  opp: 0,
};

function cellClick(index) {
  if (board[index]) return;
  if (currentPlayer !== null) {
    if (yourPlayer !== currentPlayer) return;
  }
  board[index] = yourPlayer;
  const move = {
    id: window.location.pathname.split("/")[1],
    index: index,
    player: yourPlayer,
    userId: localStorage.getItem("userId"),
  };
  socket.emit("move", move);
}

function renderBoard() {
  const boardElement = document.getElementById("board");
  boardElement.innerHTML = "";

  board.forEach((cell, index) => {
    const cellElement = document.createElement("div");
    cellElement.classList.add("cell");
    cellElement.innerText = cell;
    cellElement.onclick = () => cellClick(index);
    boardElement.appendChild(cellElement);
  });

  if (moveCount >= 9) {
    showPopup("draw");
    socket.emit("reset", window.location.pathname.split("/")[1]);
  }
}

function showPopup(type) {
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("popup");
  const icon = document.getElementById("icon");
  const title = document.getElementById("title");
  const message = document.getElementById("message");

  // Xử lý kiểu popup
  if (type === "win") {
    popup.className = "popup win";
    icon.textContent = "🎉";
    title.textContent = "You Win!";
    message.textContent = "Congratulations! You defeated your opponent.";
  } else if (type === "lose") {
    popup.className = "popup lose";
    icon.textContent = "😢";
    title.textContent = "You Lose!";
    message.textContent = "Better luck next time. Keep practicing!";
  } else if (type === "draw") {
    popup.className = "popup draw";
    icon.textContent = "🤝";
    title.textContent = "It's a Draw!";
    message.textContent = "Good game! No one wins this time.";
  }

  // Hiển thị popup với animation
  overlay.classList.add("active");
  popup.classList.add("active");

  // Tự động ẩn popup sau 2 giây
  setTimeout(() => {
    hidePopup();
  }, 2000);
}

// Hàm ẩn popup
function hidePopup() {
  const overlay = document.getElementById("overlay");
  const popup = document.getElementById("popup");

  // Ẩn popup
  overlay.classList.remove("active");
  popup.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", () => {
  renderBoard();

  const name = localStorage.getItem("username");
  const roomId = window.location.pathname.split("/")[1];

  console.log(roomId);

  socket.emit("register", name);
  socket.emit("join", roomId);
  socket.emit("game-data", roomId);
  socket.emit("ingame", roomId);
});

socket.on("game-data", (room) => {
  console.log("Game data received");
  console.log(room);
  const messageElement = document.getElementById("gameMessage");
  const firstPlayer = room.owner.name;
  yourPlayer = localStorage.getItem("username") === firstPlayer ? "X" : "O";

  board = room.board;
  currentPlayer = room.currentPlayer;
  moveCount = room.moveCount;
  messageElement.innerHTML = `<h1>Someone go first pls!!</h1>`;

  try {
    score.your = room.players.find(
      (player) => player.name === localStorage.getItem("username")
    ).score;
    score.opp = room.players.find(
      (player) => player.name !== localStorage.getItem("username")
    ).score;

    document.getElementById("player1-name").innerText =
      localStorage.getItem("username");
    document.getElementById("player2-name").innerText = room.players.find(
      (player) => player.name !== localStorage.getItem("username")
    ).name;
  } catch (e) {
    messageElement.innerHTML = `<h1>Your opponent has disconnected!</h1>`;
    yourPlayer = null;
  }

  document.getElementById("player1-player").innerText = yourPlayer;
  document.getElementById("player2-player").innerText =
    yourPlayer === "X" ? "O" : "X";

  document.getElementById("player1-score").innerText = "score: " + score.your;
  document.getElementById("player2-score").innerText = "score: " + score.opp;

  renderBoard();
});

socket.on("update", (data) => {
  if (data.currentPlayer == null) {
    currentPlayer = null;
  } else {
    currentPlayer = data.currentPlayer;
  }

  const messageElement = document.getElementById("gameMessage");
  if (currentPlayer === null) {
    messageElement.innerHTML = `<h1>Someone go first??</h1>`;
  } else if (currentPlayer === yourPlayer) {
    messageElement.innerHTML = `<h1>Your turn bro!</h1>`;
  } else {
    messageElement.innerHTML = `<h1>Opponent's turn</h1>`;
  }

  moveCount = data.moveCount;

  console.log("Update received");

  board = data.board;
  renderBoard();
});

socket.on("win", (player) => {
  console.log("CO TK WIN ROI");

  const messageElement = document.getElementById("gameMessage");
  const userId = localStorage.getItem("userId");

  messageElement.innerHTML = `<h1>${
    player.winner === userId ? "You win!" : "You lose!"
  }</h1>`;

  showPopup(player.winner === userId ? "win" : "lose");

  yourPlayer = null;

  board = player.board;
  renderBoard();

  socket.emit("reset", player.id);
});

socket.on("reset", (room) => {
  board = room.board;
  renderBoard();
  socket.emit("game-data", room.id);
});
