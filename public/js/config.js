const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
};
// TODO: Add 20 for every person
const GAME_DURATION = 10 * 1000; // Seconds to MS

const GAME_ROOMS = {
  WAITING: 'waiting',
  PREGAME: 'pregame',
  GAME: 'game',
};

const SPAWN_COORDS = [
  { x: 96, y: 304 },
  { x: 704, y: 304 },
  { x: 400, y: 80 },
  { x: 100, y: 300 },
  { x: 400, y: 432 },
  { x: 720, y: 432 },
  { x: 64, y: 432 },
];

const CHARACTERS = ['pinkie', 'owlet'];

module.exports = {
  GAME_STATUS, GAME_DURATION, GAME_ROOMS, SPAWN_COORDS, CHARACTERS,
};
