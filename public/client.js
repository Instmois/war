
document.addEventListener('DOMContentLoaded', function () {
    console.log('Сценарий client.js запущен');
const socket = io();

// Функция для логирования сообщений об ошибках на стороне клиента
function clientLogger(...messages) {
    console.error(...messages);
}
socket.on('connect', () => {
    console.log('Успешное подключение к серверу Socket.IO');
    
  });

// Обработка ошибок на стороне клиента
socket.on('error', (error) => {
    clientLogger('Произошла ошибка на стороне клиента:', error);
});

socket.on('connect_error', (error) => {
    clientLogger('Ошибка подключения к серверу:', error);
});

socket.on('connect_timeout', (timeout) => {
    clientLogger('Превышено время ожидания подключения:', timeout);
});
socket.on('testMessage', (message) => {
    console.log('Получено тестовое сообщение с сервера:', message);
  });
  
  socket.on('gameState', (gameState) => {
    console.log('Получено состояние игры с сервера:', gameState);
    updateGameInterface(gameState);
  });
  
  function clearGameBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell) => {
      cell.textContent = '';
      cell.classList.remove('killed');
    });
  }
function updateGameInterface(gameState) {
    console.log('Обновление интерфейса:', gameState);
    // Логика обновления интерфейса игры
    // Например, обновление отображения игрового поля, текущего игрока и т.д.
    clearGameBoard();
    // Пример: обновление поля игры
    updateGameBoard(gameState.board);

    // Пример: обновление текущего игрока
    updateCurrentPlayer(gameState.currentPlayer);
}

// Изменения в updateGameBoard
// Внесем изменения в updateGameBoard
function updateGameBoard(board) {
    const gameBoardElement = document.getElementById('gameBoard');

    // Проверяем наличие gameBoardElement и создаем, если не существует
    if (!gameBoardElement) {
        console.error('Элемент gameBoard не найден.');
        return;
    }

    // Очищаем содержимое gameBoardElement перед обновлением
    gameBoardElement.innerHTML = '';

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');

            // Обновление текста и стилей клетки в соответствии с состоянием игры
            cell.textContent = board[row][col];
            if (board[row][col] === 'K') {
                cell.classList.add('killed');
            }

            // Добавляем обработчик события клика на клетку
            cell.addEventListener('click', () => {
                // Отправка события на сервер о ходе игрока
                console.log(`Clicked on cell (${row}, ${col})`);
                socket.emit('playerMove', { row, col, type: 'spawn' });
            });

            // Добавляем созданную клетку в gameBoardElement
            gameBoardElement.appendChild(cell);
        }
    }
}

function updateCurrentPlayer(currentPlayer) {
    const currentPlayerElement = document.getElementById('currentPlayer');

    // Обновление текста в элементе
    currentPlayerElement.textContent = `Текущий игрок: ${currentPlayer}`;
}
const startGameBtn = document.getElementById('startGameBtn');

startGameBtn.addEventListener('click', () => {
    // Отправить событие на сервер о начале игры
    socket.emit('startGame');
});

const joinGameBtn = document.getElementById('joinGameBtn');

joinGameBtn.addEventListener('click', () => {
    // Отправить событие на сервер о присоединении ко второй игре
    socket.emit('joinGame');
});
});

  