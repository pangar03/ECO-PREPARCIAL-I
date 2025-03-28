const socket = io("http://localhost:5050", { path: "/rea-time" });

// document.getElementById("get-btn").addEventListener("click", getUsers);

// function getUsers() {
//   fetch("http://localhost:5050/users")
//     .then((response) => response.json())
//     .then((data) => console.log("get response", data))
//     .catch((error) => console.error("Error:", error));
// }

// const sendCoordenates = () => {
//   socket.emit("coordenadas", { x: 123, y: 432 });
// };

// document.getElementById("event-btn").addEventListener("click", sendCoordenates);

// ---- MARCOPOLO GAME ----
let userData = {};

// ---- LOGIN ELEMENTS ----
const loginSection = document.getElementById("login");
const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");

// ---- WAITING ROOM ELEMENTS ----
const waitingRoom = document.getElementById("waiting-room");
const waitingMessage = document.getElementById("waiting-welcome");

// ---- GAME ELEMENTS ----
const gameSection = document.getElementById("game-section");

// ---- GAME LOGIC ----
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  userData.username = usernameInput.value;
  fetch("http://localhost:5050/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: userData.username }),
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        alert(data.message);
      } else {
        userData = { ...userData, ...data };
        loginSection.style.display = "none";
        waitingRoom.style.display = "flex";
        waitingMessage.innerHTML = `Welcome ${userData.username}!, you are ${userData.role}`;
        if(data.usersCounter === 3){
          // NO SE DEBE HACER EMIT, DEBE SER CON UN HTTP REQUEST (FETCH)
          socket.emit("start-game");
        }
        return data;
      }
    });
});

socket.on("start-game", () => {
  console.log("INICIANDO JUEGO CLIENTE, USER DATA: ", userData);
  waitingRoom.style.display = "none";
  gameSection.style.display = "flex";

  gameSection.innerHTML =`
    <h2>${userData.username}</h2>
    <h5>Your Role is:</h5>
    <h3>${userData.role}</h3>
  `;

  if(userData.role === "marco"){
    gameSection.innerHTML += `
      <button id="marco-btn">SHOUT MARCO</button>
    `;
    document.getElementById("marco-btn").addEventListener("click", () => {
      fetch("http://localhost:5050/notify-marco", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userData.id }),
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Marco Shout Response", data);
        document.getElementById("marco-btn").style.display = "none";
        gameSection.innerHTML += `
          <h4>Please Select which Polo you want to choose (Wait until there is two)</h4>
        `
      });
    });
  }
});

socket.on("notification", (data) => {
  console.log("NOTIFICACION RECIBIDA", data);
  if(data.message === "Marco" && userData.role !== "marco"){
    gameSection.innerHTML += `
      <h2>Someone said MARCO!</h2>
      <button id="polo-btn">SHOUT POLO</button>  
    `;
    
    document.getElementById("polo-btn").addEventListener("click", () => {
      fetch("http://localhost:5050/notify-polo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userData.id }),
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Polo Shout Response", data);
        document.getElementById("polo-btn").style.display = "none";
      });
    });
  } else if(data.message === "Polo" && userData.role === "marco") {
    const poloBtn = document.createElement("button");
    poloBtn.classList.add("polo-btn");
    poloBtn.innerHTML = "Someone said POLO!";
    gameSection.appendChild(poloBtn);

    poloBtn.addEventListener("click", () => {
      fetch("http://localhost:5050/select-polo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: userData.id, poloSelected: data.id }),
      })
      .then((response) => response.json())
      .then((data) => {
        console.log("Polo Selected Response", data)
      });
    });
  } else if(data.message.includes("GAME OVER")){
    gameSection.innerHTML = `
      <h1>${data.message}</h1>
    `;
  }
});



