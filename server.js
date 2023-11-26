const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

// Тестирование подключения
pool.query('SELECT $1 AS value', [123])
  .then(result => {
    if (result && result.rows.length > 0) {
      console.log('Подключение к базе данных успешно. Результат запроса:', result.rows[0].value);
    } else {
      console.log('Подключение к базе данных успешно. Запрос не вернул результатов.');
    }
  })
  .catch(error => {
    console.error('Ошибка подключения к базе данных:', error);
    process.exit(1); 
  });

app.use('/socket.io', express.static('node_modules/socket.io-client/dist'));
app.use(express.static('public'));
// Состояние игры
function initializeGameBoard() {
    const gameState = {
        currentPlayer: 1,
        board: Array.from({ length: 10 }, () => Array(10).fill('')),
    };

    return gameState;
}

function handlePlayerMove(move) {
    const {action1, action2, action3} = move;

    // Обрабатываем ход игрока
    executeAction(action1);
    executeAction(action2);
    executeAction(action3);
}
function executeAction(action) {
    if (!action || !action.type) {
        console.error('Invalid action:', action);
        return;
    }

    const { type, row, col } = action;

    if (type === 'spawn') {
        executeSpawn(gameState.board, row, col, gameState.currentPlayer);
    } else if (type === 'kill') {
        executeKill(gameState.board, row, col);
    }
}

// Функция для проверки выигрыша
function checkWinner(board, currentPlayer) {
    // Проверка, если все символы противника убиты
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] !== currentPlayer && board[row][col] !== 'K') {
          return false; // Есть символ противника, который не убит
        }
      }
    }
    return true; // Все символы противника убиты, текущий игрок победил
  }
  
// Функция для проверки, можно ли размножить символ на данной клетке
function canSpawn(board, row, col, currentPlayer) {
    if (row < 0 || row >= 10 || col < 0 || col >= 10 || board[row][col] !== '') {
        return false; // Клетка не существует или уже занята
    }

    // Проверка доступности для размножения
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (
                newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 &&
                (board[newRow][newCol] === currentPlayer || board[newRow][newCol] === 'O')
            ) {
                return true; // Есть соседняя клетка с символом текущего игрока или убитым символом
            }
        }
    }
    return false; // Клетка не доступна для размножения
}


function canKill(board, row, col, currentPlayer) {
    if (row < 0 || row >= 10 || col < 0 || col >= 10 || board[row][col] === currentPlayer || board[row][col] === '') {
        return false; // Клетка не существует, занята текущим символом или пуста
    }

    // Проверка доступности для убийства
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const newRow = row + i;
            const newCol = col + j;
            if (
                newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10 &&
                (board[newRow][newCol] === currentPlayer || board[newRow][newCol] === 'O')
            ) {
                return true; // Есть соседняя клетка с символом текущего игрока или убитым символом
            }
        }
    }
    return false; // Клетка не доступна для убийства
}

  
  // Функция для проверки, можно ли сделать ход
function canMakeMove(move, board, currentPlayer) {
    const { row, col, type } = move;
  
    // Первый ход должен соответствовать начальной клетке для текущего игрока
    if (
      (currentPlayer === 1 && (row !== 0 || col !== 0)) ||
      (currentPlayer === 2 && (row !== 9 || col !== 9))
    ) {
      return false;
    }
  
    // Остальные ходы проверяем как обычно
    if (!isValidMove(move, board, currentPlayer)) {
      return false;
    }
  
    return true;
  }
  
  // Добавим функцию для проверки валидности хода
  function isValidMove(action, board, currentPlayer) {
    const { row, col, type } = action;
  
    if (row < 0 || row >= 10 || col < 0 || col >= 10) {
      return false; // Клетка не существует
    }
  
    if (type === 'spawn') {
      return board[row][col] === ''; // Клетка должна быть пустой для размножения
    } else if (type === 'kill') {
      return (
        board[row][col] === (currentPlayer === 1 ? 'O' : 'X') || // Соседняя клетка с символом противника
        board[row][col] === 'K' // Убитый символ
      );
    }
  
    return false;
  }
  
  function executeSpawn(board, row, col, currentPlayer) {
    board[row][col] = currentPlayer === 1 ? 'X' : 'O';
  }
  
  function executeKill(board, row, col) {
    board[row][col] = board[row][col] === 'X' ? 'K' : 'K'; // Обозначаем убитый символ
  }
  
  

// Обработчик события хода игрока
io.on('connection', (socket) => {
    console.log('Пользователь подключен:', socket.id);
    let gameState = initializeGameBoard();
    let gameStarted = false;
    socket.on('startGame', () => {
        if (!gameStarted) {
            gameStarted = true;
            gameState = initializeGameBoard();
            io.emit('gameState', gameState);
        }
    });
    
    socket.on('joinGame', () => {
        if (!gameStarted) {
            gameStarted = true;
            gameState = initializeGameBoard();
            io.emit('gameState', gameState);
        }
    });    
    socket.on('playerMove', (move) => {
        console.log('Received player move:', move);
        if (gameStarted) {
            console.log('Ход игрока:', move);
            try {
                     // Проверяем, может ли игрок сделать ход
                if (canMakeMove(move, gameState.board, gameState.currentPlayer)) {
                    // Обрабатываем ход игрока и отправляем обновленное состояние игры
                    handlePlayerMove(move);
                    io.emit('gameState', gameState);
                    // Проверяем, есть ли выигравший
                    if (checkWinner(gameState.board, gameState.currentPlayer)) {
                        io.emit('message', `Игрок ${gameState.currentPlayer} выиграл!`);
                        // Дополнительные действия при завершении игры
                        // ...
                    }
        
                    // Смена текущего игрока
                    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
                } else {
                    // Сообщаем игроку, что сделать ход нельзя
                    socket.emit('message', 'Невозможно выполнить ход. Проверьте правила игры.');
                }
            } catch (error) {
                console.error('Ошибка при обработке хода игрока:', error);
                socket.emit('message', 'Произошла ошибка при обработке хода. Проверьте консоль разработчика.');
            }
        } else {
            console.log('Игра ещё не началась. Ход игрока проигнорирован.');
        }
    });
    socket.emit('gameState', gameState);
    socket.on('disconnect', () => {
      console.log('Пользователь отключен:', socket.id);
    });
  });
  

server.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});
