function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

export default { getTime };
