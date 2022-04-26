import {
  describe, expect, jest, test,
} from '@jest/globals';

import Game from '../public/js/game';

function getFutureDate(seconds) {
  const t = new Date();
  t.setSeconds(t.getSeconds() + seconds);
  return t;
}

describe('Game Class', () => {
  test('create instance', () => {
    // eslint-disable-next-line no-unused-vars
    const tempGame = new Game();
  });

  test('add player to game and check if in waiting room', () => {
    const tempGame = new Game();
    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    expect(Array.from(tempGame.pregamePlayers)).toHaveLength(1);
  });

  test('get player\'s status', () => {
    const tempGame = new Game();
    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    expect(tempGame.getPlayerStatus('0kjhytfds4yu7y6fdsaw')).toBe('pregame');
  });

  test('delete player', () => {
    const tempGame = new Game();
    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    tempGame.deletePlayer('0kjhytfds4yu7y6fdsaw');

    expect(() => {
      tempGame.getPlayerStatus('0kjhytfds4yu7y6fdsaw');
    }).toThrow(Error);
  });

  test('move new player from waiting to pregame status', () => {
    const tempGame = new Game();
    tempGame.addPlayer('juh7ygt5de0fkcru7hbg');
    expect(tempGame.getPlayerStatus('juh7ygt5de0fkcru7hbg')).toBe('pregame');
    tempGame.movePlayer('juh7ygt5de0fkcru7hbg', 'game');

    expect(tempGame.getPlayerStatus('juh7ygt5de0fkcru7hbg')).toBe('game');
    expect(Array.from(tempGame.pregamePlayers)).toHaveLength(0);
  });

  test('set player as ready', () => {
    const tempGame = new Game();
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    expect(tempGame.players.get('pregame').get('jki9okpi0ijuhyg6trfd').isReady).toBeTruthy();
  });

  test('calculate if all players ready to start', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    expect(tempGame.readyToStart).toBeFalsy();
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    expect(tempGame.readyToStart).toBeTruthy();
  });

  test('start game by moving all players from pregame to game', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();
    expect(tempGame.getPlayerStatus('jki9okpi0ijuhyg6trfd')).toEqual('game');
    expect(tempGame.getPlayerStatus('g6yhft5r4dswerdtguji')).toEqual('game');
  });

  test('start game by moving all players from pregame to game', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();
    expect(tempGame.isGameOver()).toBeFalsy();
    jest.useFakeTimers().setSystemTime(getFutureDate(100));
    expect(tempGame.isGameOver()).toBeTruthy();
  });
});
