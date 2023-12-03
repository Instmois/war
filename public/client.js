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

    socket.on('gameStarted', ({ userId, games }) => {
      console.log('Game started!');
      console.log('User ID:', userId);
      console.log('Hiding buttons and showing game board...');
      createGameBtn.style.display = 'none';
      joinBtn.style.display = 'none';
      gameBoard.style.display = 'block';
      showGameBoard();
    });

    socket.on('gameNotFound', () => {
      alert('Game not found. Please enter a valid game ID.');
    });
    socket.on('notTwoPeople', () => {
      alert('Please, waiting for player 2');
    });
    function showGameBoard() {
      // Реализуйте логику для отображения игрового поля (например, скрытие кнопок и показ игрового поля)
      console.log('Game board displayed. Waiting for Player 2...');
    }
  })();
});

