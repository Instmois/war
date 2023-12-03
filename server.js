const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

let games = [];
let users = [];

io.on('connection', (socket) => {
  const userId = socket.id; // уникальный идентификатор пользователя
  users.push(userId); // добавляем пользователя в массив подключенных
  console.log(users);
  console.log('A user connected :' + userId);
  socket.on('createGame', ({userId}) => {
    const gameId = (Math.floor(Math.random() * (1000 - 1)) + 1);
    games.push({ id: gameId, players: [userId] });
    socket.join(gameId);
    console.log(games);
    socket.emit('gameCreated', gameId);
  });

  socket.on('joinGame', ({gameId, userId}) => {
  console.log('Join game request from user:', userId);
  console.log('Current games:', games);
  console.log('Game ID to join:', gameId);
  console.log('Does the game ID match?', games && games.some(game => game.id == gameId));
    if (users.length == 2) {
        if (games && (games[0].id == gameId)) {
            games[0].players.push(userId);  // Обращаемся к массиву players внутри объекта game
            socket.join(gameId);
            io.emit('gameStarted', { userId, games });
        } else {
            socket.emit('gameNotFound');
        }
    } else {
        socket.emit('notTwoPeople');
    }
});


  socket.on('disconnect', () => {
    console.log('A user disconnected:' + userId);
    users = users.filter((user) => user !== userId);
    // Implement logic to handle user disconnection and game termination
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
