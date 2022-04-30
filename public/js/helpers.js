function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

function getRandomInt(cap) {
  Math.floor(Math.random() * cap);
}

module.exports = {
  getTime,
  getRandomInt,
};
