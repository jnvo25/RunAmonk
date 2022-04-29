import {
  describe, expect, jest, test,
} from '@jest/globals';

import { GAME_STATUS } from '../public/js/config';
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
    expect(tempGame.getPlayerRoom('0kjhytfds4yu7y6fdsaw')).toBe('pregame');
  });

  test('delete player', () => {
    const tempGame = new Game();
    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    tempGame.deletePlayer('0kjhytfds4yu7y6fdsaw');

    expect(() => {
      tempGame.getPlayerRoom('0kjhytfds4yu7y6fdsaw');
    }).toThrow(Error);
  });

  test('move new player from waiting to pregame status', () => {
    const tempGame = new Game();
    tempGame.addPlayer('juh7ygt5de0fkcru7hbg');
    expect(tempGame.getPlayerRoom('juh7ygt5de0fkcru7hbg')).toBe('pregame');
    tempGame.movePlayer('juh7ygt5de0fkcru7hbg', 'game');

    expect(tempGame.getPlayerRoom('juh7ygt5de0fkcru7hbg')).toBe('game');
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

  test('start game by moving all players from pregame to game and setting coordinates', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();
    expect(tempGame.getPlayerRoom('jki9okpi0ijuhyg6trfd')).toEqual('game');
    expect(tempGame.getPlayerRoom('g6yhft5r4dswerdtguji')).toEqual('game');
    expect(tempGame.getPlayer('jki9okpi0ijuhyg6trfd').position).toHaveProperty('x');
    expect(tempGame.getPlayer('jki9okpi0ijuhyg6trfd').position).toHaveProperty('y');
    expect(tempGame.getPlayer('g6yhft5r4dswerdtguji').position).toHaveProperty('x');
    expect(tempGame.getPlayer('g6yhft5r4dswerdtguji').position).toHaveProperty('y');
  });

  test('start game, wait 100 seconds, check if game ended', () => {
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

  test('startPregame resets game variables', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();
    jest.useFakeTimers().setSystemTime(getFutureDate(100));
    tempGame.startPregame();

    // Both players should be in pregame stage and not ready
    expect(tempGame.getPlayerRoom('jki9okpi0ijuhyg6trfd')).toBe('pregame');
    expect(tempGame.getPlayerRoom('g6yhft5r4dswerdtguji')).toBe('pregame');
    const iterator = tempGame.players.get('pregame').values();
    let value = iterator.next();
    while (!value.done) {
      expect(value.value.isReady).toBeFalsy();
      value = iterator.next();
    }
    expect(tempGame.getPlayer('jki9okpi0ijuhyg6trfd').position).toBeUndefined();
    expect(tempGame.getPlayer('g6yhft5r4dswerdtguji').position).toBeUndefined();
  });

  test('gameStatus correctly reflect game status', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    expect(tempGame.gameStatus).toBe(GAME_STATUS.IDLE);
    tempGame.startGame();
    expect(tempGame.gameStatus).toBe(GAME_STATUS.PLAYING);
    jest.useFakeTimers().setSystemTime(getFutureDate(100));
    expect(tempGame.gameStatus).toBe(GAME_STATUS.IDLE);
    tempGame.startPregame();
    expect(tempGame.gameStatus).toBe(GAME_STATUS.IDLE);
  });

  test('Player joining game in the middle put into waiting room', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();

    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    expect(tempGame.getPlayerRoom('0kjhytfds4yu7y6fdsaw')).toBe('waiting');
  });

  test('Players generated with unique coordinates', () => {
    // TODO:
  });

  test('Players generated with random characters', () => {
    const tempGame = new Game();
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    tempGame.startGame();

    expect(tempGame.getPlayer('jki9okpi0ijuhyg6trfd').character).toBeDefined();
    expect(tempGame.getPlayer('g6yhft5r4dswerdtguji').character).toBeDefined();
  });
});
