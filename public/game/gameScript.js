const socket = io();

let currentPlayer = null;
let yourPlayer = "X";
let board = ["", "", "", "", "", "", "", "", ""];

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

  socket.emit("register", name);
  socket.emit("join", roomId);
  socket.emit("game-data", roomId);
  socket.emit("ingame", roomId);
});

socket.on("game-data", (room) => {
  console.log("GAME DATA", room);
  const firstPlayer = room.name;
  yourPlayer = localStorage.getItem("username") === firstPlayer ? "X" : "O";
  currentPlayer = room.currentPlayer;

  document.getElementById("player1-name").innerText =
    localStorage.getItem("username");
  document.getElementById("player2-name").innerText = room.players.filter(
    (player) => player !== localStorage.getItem("username")
  )[0];

  document.getElementById("player1-player").innerText = yourPlayer;
  document.getElementById("player2-player").innerText =
    yourPlayer === "X" ? "O" : "X";

  document.getElementById("player1-score").innerText = "Score: " + score.your;
  document.getElementById("player2-score").innerText = "Score: " + score.opp;
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

  moveCount++;

  console.log("Update received");
  console.log(moveCount);

  console.log(data);
  board = data.board;
  renderBoard();
});

socket.on("win", (player) => {
  console.log("CO TK WIN ROI");

  const messageElement = document.getElementById("gameMessage");

  messageElement.innerHTML = `<h1>${
    player.winner === yourPlayer ? "You win!" : "You lose!"
  }</h1>`;

  score[player.winner === yourPlayer ? "your" : "opp"]++;

  console.log(score);

  showPopup(player.winner === yourPlayer ? "win" : "lose");

  yourPlayer = null;

  board = player.board;
  renderBoard();

  socket.emit("reset", player.id);
});

socket.on("reset", (room) => {
  moveCount = -1;
  board = room.board;
  renderBoard();
  socket.emit("game-data", room.id);
});

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
