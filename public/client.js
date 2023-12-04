document.addEventListener('DOMContentLoaded', function () {
  // Оборачиваем код в самовызывающуюся функцию, чтобы избежать конфликтов с глобальной областью видимости
  (function () {
    // Инициализируем сокет и объявляем функции внутри этой функции
    const socket = io();
    const createGameBtn = document.getElementById('createGameBtn');
    const joinBtn = document.getElementById("joinBtn")
    const gameBoard = document.getElementById('gameBoard');
    // Присваиваем функции к объекту window, чтобы они были доступны в глобальной области видимости
    window.createGame = function () {
      socket.emit('createGame');
    };
    createGameBtn.addEventListener('click', () => {
      // Отправляем на сервер запрос на создание игры и передаем userId
      socket.emit('createGame', { userId: socket.id });
    });
    window.joinGame = function () {
      const gameId = prompt('Enter the game ID:');
      socket.emit('joinGame', {gameId, userId: socket.id});
    };

    // Обработка событий от сервера
    socket.on('gameCreated', (gameId) => {
      console.log(`Game created with ID: ${gameId}`);
      const gameId_alert = alert('Game created with ID ' + gameId);
      
    });

    socket.on('gameStarted', ({ userId, games, GameBoard }) => {
      console.log('Game started!');
      console.log('User ID:', userId);
      console.log('Hiding buttons and showing game board...');
      showGameBoard(games);
    });

    socket.on('gameNotFound', () => {
      alert('Game not found. Please enter a valid game ID.');
    });
    socket.on('notTwoPeople', () => {
      alert('Please, waiting for player 2');
    });
    socket.on('CellNotAvailable', () => {
      alert('Выбранная клетка недоступна. Попробуйте другую.');
    });
   

    socket.on('updateBoard', ({ row, col, symbol }) => {
      // Обновляем интерфейс на основе данных о ходе от сервера
      const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      
      if (symbol === 'cross') {
        cellElement.innerHTML = 'X'; // Ваш символ для крестика
      } else {
        cellElement.innerHTML = 'O'; // Ваш символ для нолика
      }
    });

    function showGameBoard(games) {
      createGameBtn.style.display = 'none';
      joinBtn.style.display = 'none';
      gameBoard.style.display = 'grid';
      
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
          const cell = document.createElement('div');
          cell.className = 'cell';
          cell.setAttribute('data-row', i);
          cell.setAttribute('data-col', j);
          cell.addEventListener('click', () => onCellClick(i, j));
          gameBoard.appendChild(cell);
        }
      }
      
      console.log('Game board displayed. Waiting for Player 2...');
    
      function onCellClick(row, col) {
        const symbol = (games[0].players[0] === socket.id) ? 'cross' : 'circle';
    
        // Отправляем информацию на сервер о намерении сделать ход
        socket.emit('makeMoveRequest', { row, col, symbol });
      }
    }
    /*
      function onCellClick(row, col, GameBoard) {
        const symbol = (games[0].players[0] === socket.id) ? 'cross' : 'circle';
  
        if (GameBoard.isCellAvailable(row, col, symbol)) {
          // Если клетка доступна, делаем ход
          GameBoard.makeMove(row, col, symbol);
          GameBoard.printBoard();
          // Дополнительная логика для отправки информации на сервер
          socket.emit('makeMove', { row, col, symbol });
          
        } else {
          alert('Выбранная клетка недоступна. Попробуйте другую.');
        }
        console.log(`Нажатие на ячейку (${row}, ${col})`);
      }
    }*/

  })();
});

