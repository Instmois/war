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
const MAX_MOVES = 3;
let removePlayer = false;
const GameBoard = {
  cells: [],
  movesCount: {
    cross: 0,
    circle: 0,
  },

  initBoard: function () {
    for (let i = 0; i < 10; i++) {
      this.cells[i] = [];
      for (let j = 0; j < 10; j++) {
        this.cells[i][j] = 'empty';
      }
    }
    this.cells[0][0] = 'cross';
    this.cells[9][9] = 'circle';
  },

  isCellAvailable: function (row, col, symbol) {
    // Проверяем, доступна ли клетка для заданного символа
    if (symbol === 'cross' && this.cells[row][col] === 'empty') {
      return (
        (row > 0 && this.cells[row - 1][col] === 'cross') ||
        (col > 0 && this.cells[row][col - 1] === 'cross') ||
        (row < 9 && this.cells[row + 1][col] === 'cross') ||
        (col < 9 && this.cells[row][col + 1] === 'cross') ||
        (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'cross') ||
        (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'cross') ||
        (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'cross') ||
        (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'cross')
      );
    } else if (symbol === 'circle' && this.cells[row][col] === 'empty') {
      return (
        (row > 0 && this.cells[row - 1][col] === 'circle') ||
        (col > 0 && this.cells[row][col - 1] === 'circle') ||
        (row < 9 && this.cells[row + 1][col] === 'circle') ||
        (col < 9 && this.cells[row][col + 1] === 'circle') ||
        (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'circle') ||
        (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'circle') ||
        (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'circle') ||
        (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'circle')
      );
    }
    return true;
  },

  makeMove: function (row, col, symbol) {
    // Выполняем ход (ставим символ или убиваем чужой символ)
    this.cells[row][col] = symbol;
    this.movesCount[symbol]++;
  },
  checkWinCondition: function () {
    // Реализуйте логику условия победы здесь
  },

  checkDrawCondition: function () {
    // Реализуйте логику условия ничьи здесь
  },
  printBoard: function () {
    // Выводим текущее состояние игрового поля в консоль
    console.log(this.cells);
    for (let i = 0; i < 10; i++) {
      for(let j = 0; j < 10; j++){
        //console.log(this.cells[i].join(' '));
      }
      
    }
  },
};

io.on('connection', (socket) => {
  const userId = socket.id; // уникальный идентификатор пользователя
  users.push(userId); // добавляем пользователя в массив подключенных
  console.log(users);
  console.log('A user connected :' + userId);
  socket.on('createGame', ({userId}) => {
    const gameId = (Math.floor(Math.random() * (1000 - 1)) + 1);
    games.push({ id: gameId, players: [userId], activePlayer: 'cross' });
    socket.join(gameId);
    console.log(games);
    socket.emit('gameCreated', gameId);
  });

  socket.on('joinGame', ({gameId, userId}) => {
  console.log('Join game request from user:', userId);
  console.log('Current games:', games);
  console.log('Game ID to join:', gameId);
    if (users.length == 2) {
        if (games && (games[0].id == gameId)) {
            games[0].players.push(userId);  // Обращаемся к массиву players внутри объекта game
            socket.join(gameId);
            GameBoard.initBoard();
            GameBoard.printBoard();
            io.emit('gameStarted', { userId, games, GameBoard });
        } else {
            socket.emit('gameNotFound');
        }
    } else {
        socket.emit('notTwoPeople');
    }
  });
  socket.on('makeMove', ({ row, col, symbol }) => {
    // Обработка хода и отправка обновлений всем участникам игры
    io.emit('updateBoard', { row, col, symbol });
  });
  let isMoveExecuted = false;
  socket.on('makeMoveRequest', ({ row, col, symbol }) => {
    const currentGame = games[0];
    const currentPlayerMoves = GameBoard.movesCount[symbol];
    console.log(currentPlayerMoves);
    console.log(currentGame.activePlayer);
    console.log(currentPlayerMoves < MAX_MOVES && symbol === currentGame.activePlayer);
    console.log(GameBoard.isCellAvailable(row, col, symbol));
    if (currentPlayerMoves < MAX_MOVES && symbol == currentGame.activePlayer){

      if (GameBoard.isCellAvailable(row, col, symbol)) {

        GameBoard.makeMove(row, col, symbol);
        if (!isMoveExecuted) {
        console.log('До увеличения:', GameBoard.movesCount[symbol]);

        GameBoard.movesCount[symbol] = GameBoard.movesCount[symbol] + 1;

        console.log('После увеличения:', GameBoard.movesCount[symbol]);
        // Отправляем информацию об обновлении всем участникам игры
        console.log(currentPlayerMoves);
        io.emit('updateBoard', { row, col, symbol });
        // Дополнительная логика для обработки победы или ничьи, если нужно
        //if (GameBoard.checkWinCondition()) {
        // io.to(gameId).emit('gameWon', { winner: socket.id });
        //} else if (GameBoard.checkDrawCondition()) {
        // io.to(gameId).emit('gameDraw');
        //}
        if ( GameBoard.movesCount[symbol] == MAX_MOVES) {
          // Меняем активного игрока
          games[0].activePlayer = symbol === 'cross' ? 'circle' : 'cross';
          io.emit('changePlayerTurn', { nextPlayer: games[0].activePlayer });
          GameBoard.movesCount[symbol] = 0;
        }
        isMoveExecuted = true;
      }} else {
        socket.emit('CellNotAvailable');
      }
    } else {
      socket.emit('endMovePlayer');
    }
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected:' + userId);
    users = users.filter((user) => user !== userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
