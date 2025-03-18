const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const { createServer } = require("http");

const app = express();

const httpServer = createServer(app);

const io = new Server(httpServer, {
  // westa es una instancia de Socket.io en nuestro servidor
  path: "/rea-time",
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use("/marco-polo", express.static(path.join(__dirname, "app1")));
// app.use("/app2", express.static(path.join(__dirname, "app2")));

let users = [];

// RANDOMIZE THE ROLES
const roles = ["marco", "polo", "polo-especial"];

// THE SORT USES THE RANDOM CRITERIA TO RANDOMIZE THE ARRAY
const randomizeRoles = roles.sort(() => Math.random() - 0.5);
console.log("ROLES: ", randomizeRoles);

let currentRoleIndex = 0;

app.get("/users", (req, res) => {
  res.send(users);
});

app.post("/login", (req, res) => {
  const usersCounter = users.length;
  if (usersCounter < 3) {
    const { username } = req.body;
    const id = users.length;
    const role = randomizeRoles[currentRoleIndex];
    users.push({ id, username, role });
    currentRoleIndex++;
    res.send({ id, usersCounter: usersCounter + 1, role });
  } else {
    res.send({ message: "No hay cupo" });
  }
});

app.post("/notify-marco", (req, res) => {
  const { id } = req.body;
  io.emit("notification", { id, message: "Marco" });
  res.send({ message: "MARCO EMITED"} );
});

app.post("/notify-polo", (req, res) => {
  const { id } = req.body;
  io.emit("notification", { id, message: "Polo" });
  res.send({ message: "POLO EMITED"} );
});

app.post("/select-polo", (req, res) => {
  const { id, poloSelected } = req.body;
  console.log("POLO ESPECIAL Y USER: ", users);
  if(users[poloSelected].role === "polo-especial"){
    io.emit("notification", { id, message: `GAME OVER: The ${users[id].username} MARCO is the winner, ${users[poloSelected].username} was captured!`});
  } else {
    io.emit("notification", { id, message: `GAME OVER: The ${users[id].username} MARCO lost, POLO WINS!`});
  }
});

io.on("connection", (socket) => {
  socket.on("start-game", () => {
    console.log("INICIANDO JUEGO");
    io.emit("start-game");
  });
  socket.on("gritar-marco", (data) => {
    console.log("GRITANDO MARCO");
    io.emit("notificar-polos", data);
  });
  socket.on("notification", (data) => {
    console.log("NOTIFICANDO");
    io.emit("notification", data);
  });
  socket.on("gritar-polo", (data) => {
    console.log("GRITANDO POLO");
    io.emit("notificar-marco", data);
  });
});

httpServer.listen(5050);
