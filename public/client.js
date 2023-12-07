document.addEventListener('DOMContentLoaded', function () {
    const socket = io();
    const createGameBtn = document.getElementById('createGameBtn');
    const joinBtn = document.getElementById("joinBtn")
    const gameBoard = document.getElementById('gameBoard');
    const showtable = document.getElementById('showTableButton');
    const table = document.getElementById('tableContainer');
    createGameBtn.addEventListener('click', () => {
      socket.emit('createGame', { userId: socket.id });
    });

    joinBtn.addEventListener('click', () => {
      const gameId = prompt('Enter the game ID:');
      socket.emit('joinGame', { gameId, userId: socket.id });
    });

    socket.on('gameCreated', (gameId) => {
      console.log(`Game created with ID: ${gameId}`);
      alert('Game created with ID ' + gameId);
    });

    showtable.addEventListener('click', () => {
      socket.emit('showTable');
    });

    socket.on('gameStarted', ({ userId, games, GameBoard }) => {
      console.log('Game started!');
      console.log('User ID:', userId);
      showGameBoard(games);
    });

    socket.on('tableData', function (data) {
      const tables = document.createElement('table');
      tables.classList.add('table');
      const headerRow = document.createElement('tr');
      Object.keys(data[0]).forEach(function (key) {
          const th = document.createElement('th');
          th.textContent = key;
          headerRow.appendChild(th);
      });
      tables.appendChild(headerRow);
      data.forEach(function (row) {
          const dataRow = document.createElement('tr');
          Object.values(row).forEach(function (value) {
              const td = document.createElement('td');
              td.textContent = value;
              dataRow.appendChild(td);
          });
          tables.appendChild(dataRow);
      });
      
      table.appendChild(tables);
  });
    socket.on('gameNotFound', () => {
      alert('Игра не найдена!');
    });
    socket.on('notTwoPeople', () => {
      alert('Дождитесь 2-го игрока!');
    });
    socket.on('CellNotAvailable', () => {
      alert('Выбранная клетка недоступна. Попробуйте другую.');
    });
    
    socket.on('EndMovePlayer', () => {
      alert('Не ваш ход.');
    });
    socket.on('gameWon', (data) => {
      alert('Победил : ' + data.winner + ' !!!');
    });
    socket.on('gameDraw', () => {
      alert('Победила ничья!');
    });
    socket.on('updateBoard', ({ row, col, cellValue }) => {
      const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (cellValue === 'cross') {
        cellElement.innerHTML = 'X'; 
      } else if (cellValue === 'circle') {
        cellElement.innerHTML = 'O'; 
      }
      else if (cellValue === 'killed-cross') {
        cellElement.setAttribute('id', 'killed-cross');
      }
      else if (cellValue === 'killed-circle') {
        cellElement.setAttribute('id', 'killed-circle');
      }
    });

    function showGameBoard(games) {
      createGameBtn.style.display = 'none';
      joinBtn.style.display = 'none';
      gameBoard.style.display = 'grid';
      showtable.style.display  = 'none';
      table.style.display = 'none';
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

      function onCellClick(row, col) {
        const symbol = (games[0].players[0] === socket.id) ? 'cross' : 'circle';
        socket.emit('makeMoveRequest', { row, col, symbol });
      }
    }
});

