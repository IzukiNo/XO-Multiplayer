const socket = io();

function showPopup() {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("popup").style.display = "block";
  setTimeout(() => {
    document.getElementById("overlay").style.opacity = "1";
    document.getElementById("popup").style.opacity = "1";
    document.getElementById("popup").style.transform =
      "translate(-50%, -50%) scale(1)";
  }, 10);
}

// Xử lý việc gửi tên
function submitName() {
  const name = document.getElementById("name").value;
  localStorage.setItem("username", name);
  socket.emit("register", name);
  closePopup();
}

// Đóng popup với hiệu ứng
function closePopup() {
  document.getElementById("overlay").style.opacity = "0";
  document.getElementById("popup").style.opacity = "0";
  document.getElementById("popup").style.transform =
    "translate(-50%, -50%) scale(0.8)";
  setTimeout(() => {
    document.getElementById("popup").style.display = "none";
    document.getElementById("overlay").style.display = "none";
  }, 300);
}

function createRoom() {
  if (!localStorage.getItem("username")) {
    showPopup();
    return;
  }

  const roomName = localStorage.getItem("username");
  socket.emit("create", roomName);
  fetch("/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: roomName }),
  })
    .then((response) => response.json())
    .then((data) => {
      window.location.href = `/${data.room.id}`;
    })
    .catch((error) => console.error("Error:", error));
}

function joinRoom(roomId) {
  if (!localStorage.getItem("username")) {
    showPopup();
    return;
  }
  window.location.href = `/${roomId}`;
}

function updateRoomList(data) {
  const container = document.getElementById("room-list-container");
  container.innerHTML = "";

  data.forEach((element) => {
    if (element.players.length >= 2) return;

    const roomElement = document.createElement("div");
    roomElement.classList.add("room-card");

    roomElement.innerHTML = `
            <div class="room-info">
                <p class="room-name">${element.name}'s Room</p>
                <p class="room-members">${element.players.length}/2</p>
            </div>
            <button class="join-btn">Join</button>
    `;

    roomElement.querySelector(".join-btn").addEventListener("click", () => {
      joinRoom(element.id);
    });

    container.appendChild(roomElement);
  });

  if (container && container.children.length === 0) {
    const noRoomElement = document.createElement("div");
    noRoomElement.classList.add("no-room");
    noRoomElement.innerHTML = `No room available :<`;
    container.appendChild(noRoomElement);
    return;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  socket.emit("list");
  localStorage.removeItem("username");
  if (!localStorage.getItem("username")) {
    showPopup();
    console.log("No name found");
    return;
  }
});

socket.on("list", (data) => {
  console.log(data);
  updateRoomList(data);
});

socket.on("error", (data) => {
  alert(data);
  console.log(data);
});
