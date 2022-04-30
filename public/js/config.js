const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
};
// TODO: Add 20 for every person
const GAME_DURATION = 40 * 1000; // Seconds to MS

const GAME_ROOMS = {
  WAITING: 'waiting',
  PREGAME: 'pregame',
  GAME: 'game',
};

const SPAWN_COORDS = [
  { x: 400, y: 400 },
  { x: 700, y: 300 },
  { x: 650, y: 300 },
  { x: 100, y: 300 },
];

const CHARACTERS = ['pinkie', 'owlet'];

module.exports = {
  GAME_STATUS, GAME_DURATION, GAME_ROOMS, SPAWN_COORDS, CHARACTERS,
};
