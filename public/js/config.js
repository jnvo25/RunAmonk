const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
};

const GAME_DURATION = 100 * 1000; // Seconds to MS

const GAME_ROOMS = {
  WAITING: 'waiting',
  PREGAME: 'pregame',
  GAME: 'game',
};

module.exports = { GAME_STATUS, GAME_DURATION, GAME_ROOMS };
