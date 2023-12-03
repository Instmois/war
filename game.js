const socket = io();

function initGame() {
  const board = document.getElementById('board');

  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.index = i * 10 + j;
      cell.addEventListener('click', () => cellClick(i, j));
      board.appendChild(cell);
    }
  }
}

function cellClick(row, col) {
  socket.emit('playCard', { row, col });
}

socket.on('startGame', initGame);

socket.on('cardPlayed', (data) => {
  const { player, row, col } = data;
  const cellIndex = row * 10 + col;
  const cell = document.querySelector(`[data-index="${cellIndex}"]`);

  if (player === socket.id) {
    cell.style.backgroundColor = 'blue'; // Синий для первого игрока
  } else {
    cell.style.backgroundColor = 'red'; // Красный для второго игрока
  }
});
