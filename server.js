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
let all_step = 0;

const GameBoard = {
  cells: [],


  initBoard: function () {
    for (let i = 0; i < 10; i++) {
      this.cells[i] = [];
      for (let j = 0; j < 10; j++) {
        this.cells[i][j] = 'empty';
      }
    }
  },

  isCellAvailable: function (row, col, symbol) {
    // Проверяем, доступна ли клетка для заданного символа
    console.log('isCellAvail');
    if (this.cells[row][col] === 'killed-cross' || this.cells[row][col] === 'killed-circle' ) {
      console.log('killed');
      return false;
    }  
    else if (symbol === 'cross' && this.cells[row][col] === 'empty') {
      console.log('go');
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
    console.log('not_killed');
    return true;
  },

  makeMove: function (row, col, symbol) {
    // Выполняем ход (ставим символ или убиваем чужой символ)
    const opponentSymbol = symbol === 'cross' ? 'circle' : 'cross';
    if (this.cells[row][col] === opponentSymbol && symbol === 'cross') {
      // Убиваем символ противника
      this.cells[row][col] = 'killed-cross';
    }
    else if(this.cells[row][col] === opponentSymbol && symbol === 'circle'){
      this.cells[row][col] = 'killed-circle';
    } 
    else {
      // Устанавливаем символ в клетку
      this.cells[row][col] = symbol;
    }
  },
  checkWinCondition: function () {
    // Реализуйте логику условия победы здесь
  },

  checkDrawCondition: function () {
    // Реализуйте логику условия ничьи здесь
  },
  cellsfromtable: function (row, col){
    return this.cells[row][col];
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
  socket.on('makeMoveRequest', ({ row, col, symbol }) => {
    const currentGame = games[0];
    

    console.log(currentGame.activePlayer);
    console.log((all_step % MAX_MOVES == 2) && (symbol == currentGame.activePlayer));
    console.log('row- ' + row + ' col- ' + col +' symb- ' +symbol)
    console.log(GameBoard.isCellAvailable(row, col, symbol));
    console.log(all_step);
    

    if(currentGame.activePlayer == 'cross' && all_step == 0) {
      if (row == 0 && col == 0) {
        GameBoard.makeMove(row, col, symbol);
        io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
        all_step++;
      }
      else{
        socket.emit('CellNotAvailable');
      }
    }
    else if(currentGame.activePlayer == 'circle' && all_step == 3) {
      if (row == 9 && col == 9) {
        GameBoard.makeMove(row, col, symbol);
        io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
        all_step++;
      }
      else{
        socket.emit('CellNotAvailable');
      }
    }
    else if ((all_step % MAX_MOVES == 2) && (symbol == currentGame.activePlayer)){
      if (GameBoard.isCellAvailable(row, col, symbol)) {
        GameBoard.makeMove(row, col, symbol);
        io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
        // Дополнительная логика для обработки победы или ничьи, если нужно
        //if (GameBoard.checkWinCondition()) {
        // io.to(gameId).emit('gameWon', { winner: socket.id });
        //} else if (GameBoard.checkDrawCondition()) {
        // io.to(gameId).emit('gameDraw');
        //}
          // Меняем активного игрока
        all_step++;
        games[0].activePlayer = symbol === 'cross' ? 'circle' : 'cross';
        io.emit('changePlayerTurn', { nextPlayer: games[0].activePlayer });
      }
      else {
        socket.emit('CellNotAvailable');
      }
    } 
    else if ((all_step % MAX_MOVES != 2) && (symbol == currentGame.activePlayer)){
      if (GameBoard.isCellAvailable(row, col, symbol)) {
        GameBoard.makeMove(row, col, symbol);
        // Отправляем информацию об обновлении всем участникам игры
        
        io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
          // Меняем активного игрока
        all_step++;
      }
      else {
        socket.emit('CellNotAvailable');
      }
    } else {
      socket.emit('endMovePlayer');
    }
    console.log(GameBoard.printBoard());
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected:' + userId);
    users = users.filter((user) => user !== userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
