const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

const initOptions = {
  query(e) {
    console.log('QUERY:', e.query);
  },
};

const pgp = require('pg-promise')(initOptions);

const dbConfig = {
  host: 'localhost',
  port: '5432',
  database: 'war_of_viruses',
  user: 'postgres',
  password: '1234',
};

const db = pgp(dbConfig);
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
    if (this.cells[row][col] === 'killed-cross' || this.cells[row][col] === 'killed-circle') {
      return false;
    }
    if (symbol === 'cross') {
      if ((this.cells[row][col] === 'empty') || (this.cells[row][col] != symbol)) {
        return (
          (row > 0 && this.cells[row - 1][col] === 'cross') ||
          (col > 0 && this.cells[row][col - 1] === 'cross') ||
          (row < 9 && this.cells[row + 1][col] === 'cross') ||
          (col < 9 && this.cells[row][col + 1] === 'cross') ||
          (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'cross') ||
          (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'cross') ||
          (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'cross') ||
          (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'cross') ||
          (row > 0 && this.cells[row - 1][col] === 'killed-cross') ||
          (col > 0 && this.cells[row][col - 1] === 'killed-cross') ||
          (row < 9 && this.cells[row + 1][col] === 'killed-cross') ||
          (col < 9 && this.cells[row][col + 1] === 'killed-cross') ||
          (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'killed-cross') ||
          (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'killed-cross') ||
          (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'killed-cross') ||
          (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'killed-cross') 
        );
      } else if (this.cells[row][col] === symbol) {
        return false;
       }

    } else if (symbol === 'circle') {
      if ((this.cells[row][col] === 'empty') || (this.cells[row][col] != symbol)) {
        return (
          (row > 0 && this.cells[row - 1][col] === 'circle') ||
          (col > 0 && this.cells[row][col - 1] === 'circle') ||
          (row < 9 && this.cells[row + 1][col] === 'circle') ||
          (col < 9 && this.cells[row][col + 1] === 'circle') ||
          (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'circle') ||
          (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'circle') ||
          (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'circle') ||
          (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'circle') ||
          (row > 0 && this.cells[row - 1][col] === 'killed-circle') ||
          (col > 0 && this.cells[row][col - 1] === 'killed-circle') ||
          (row < 9 && this.cells[row + 1][col] === 'killed-circle') ||
          (col < 9 && this.cells[row][col + 1] === 'killed-circle') ||
          (row > 0 && col > 0 && this.cells[row - 1][col - 1] === 'killed-circle') ||
          (row > 0 && col < 9 && this.cells[row - 1][col + 1] === 'killed-circle') ||
          (row < 9 && col > 0 && this.cells[row + 1][col - 1] === 'killed-circle') ||
          (row < 9 && col < 9 && this.cells[row + 1][col + 1] === 'killed-circle') 
        );
      } else if (this.cells[row][col] === symbol) {
        return false;
      }
    }
    return true;
  },

  makeMove: function (row, col, symbol) {
    const opponentSymbol = symbol === 'cross' ? 'circle' : 'cross';
    if (this.cells[row][col] === opponentSymbol && symbol === 'cross') {
      this.cells[row][col] = 'killed-cross';
    }
    else if(this.cells[row][col] === opponentSymbol && symbol === 'circle'){
      this.cells[row][col] = 'killed-circle';
    } 
    else {
      this.cells[row][col] = symbol;
    }
  },

  checkWinCondition: function () {
    const players = ['cross', 'circle']; 
    let winner_cross = false;
    let winner_circle = false;
    for (const player of players) {
        let available_cell = 0;

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if ((this.cells[i][j] === player || this.cells[i][j].startsWith('killed-' + player)) && this.canVirusReproduce(i, j, player)) {
                    available_cell++;
                }
            }
        }
        console.log(available_cell);
        if (available_cell === 0 && player === 'cross' ) {
            console.log('выиграл ' + player);
            winner_circle = true;
        } else if (available_cell === 0 && player === 'circle' ) {
            console.log('выиграл ' + player);
            winner_cross = true;
        }
    }

    if (winner_circle && winner_cross) {
        return { winner: 'draw' };
    } else if (winner_circle) {
        return { winner: 'circle' };
    } else if (winner_cross) {
        return { winner: 'cross' };
    } else {
        return false;
    }
},

  canVirusReproduce : function (row, col, player) {
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 && this.isCellAvailable(newRow, newCol, player)) {
        return true;
      }
    }
    return false;
  }, 

  cellsfromtable: function (row, col){
    return this.cells[row][col];
  },

  printBoard: function () {
    console.log(this.cells);
  },
};

async function saveGameResult( winner, duration) {
  const date = new Date();
  const formattedDate = date.toISOString();
  const query = `
    INSERT INTO game_results ( winner, duration, game_date)
    VALUES ($1, $2, $3 )
  `;

  try {
    await db.none(query, [ winner, duration, formattedDate]);
    console.log('Game result saved to the database.');
  } catch (error) {
    console.error('Error saving game result:', error);
  }
}
let startTime;
io.on('connection', (socket) => {
  const userId = socket.id; 
  users.push(userId); 
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
            games[0].players.push(userId);  
            socket.join(gameId);
            GameBoard.initBoard();
            GameBoard.printBoard();
             startTime = new Date();
            io.emit('gameStarted', { userId, games, GameBoard });
        } else {
            socket.emit('gameNotFound');
        }
    } else {
        socket.emit('notTwoPeople');
    }
  });
  
  socket.on('showTable', async () => {
    try {
        const tableData = await db.any('SELECT * FROM game_results');
        socket.emit('tableData', tableData);
    } catch (error) {
        console.error('Error fetching table data:', error);
    }
  });

  socket.on('makeMoveRequest', ({ row, col, symbol }) => {
    const currentGame = games[0];
    if (all_step > 5 && GameBoard.checkWinCondition().winner == 'cross' ) {
      const endTime = new Date();
      const durationInMilliseconds = endTime - startTime;
      saveGameResult('cross', durationInMilliseconds / 1000);
      io.emit('gameWon', { winner: 'cross' });
    } 
    else if(all_step > 5 && GameBoard.checkWinCondition().winner == 'circle'){
      const endTime1 = new Date();
      const durationInMilliseconds1 = endTime1 - startTime;
      saveGameResult('circle', durationInMilliseconds1 / 1000);
      io.emit('gameWon', { winner: 'circle' });
    }
    else if (all_step > 5 && GameBoard.checkWinCondition().winner == 'draw') {
      const endTime2 = new Date();
      const durationInMilliseconds2 = endTime2 - startTime;
      saveGameResult('draw', durationInMilliseconds2 / 1000 );
      io.emit('gameDraw');
    } else  {
      if(currentGame.activePlayer == 'cross' && all_step == 0 && (symbol == currentGame.activePlayer)) {
        if (row == 0 && col == 0) {
          GameBoard.makeMove(row, col, symbol);
          io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
          all_step++;
        }
        else{
          socket.emit('CellNotAvailable');
        }
      }
      else if(currentGame.activePlayer == 'circle' && all_step == 3 && (symbol == currentGame.activePlayer)) {
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
          
          io.emit('updateBoard', { row, col, cellValue: GameBoard.cellsfromtable(row, col) });
          all_step++;
        }
        else {
          socket.emit('CellNotAvailable');
        }
      } else {
        socket.emit('EndMovePlayer');
      }
      console.log(GameBoard.printBoard());
    }
    
  });
  socket.on('disconnect', () => {
    console.log('A user disconnected:' + userId);
    games = games.filter((game) => !game.players.includes(userId));
    users = users.filter((user) => user !== userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
