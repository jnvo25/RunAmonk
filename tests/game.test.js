import { describe, expect, test } from '@jest/globals';
import Game from '../public/js/game';

let tempGame;

describe('Game Class', () => {
  test('create instance', () => {
    tempGame = new Game();
  });

  test('add player to game and check if in waiting room', () => {
    tempGame.addPlayer('0kjhytfds4yu7y6fdsaw');
    expect(Array.from(tempGame.waitingPlayers)).toHaveLength(1);
  });

  test('get player\'s status', () => {
    expect(tempGame.getPlayerStatus('0kjhytfds4yu7y6fdsaw')).toBe('waiting');
  });

  test('delete player', () => {
    tempGame.deletePlayer('0kjhytfds4yu7y6fdsaw');

    expect(() => {
      tempGame.getPlayerStatus('0kjhytfds4yu7y6fdsaw');
    }).toThrow(Error);
  });

  test('move new player from waiting to pregame status', () => {
    tempGame.addPlayer('juh7ygt5de0fkcru7hbg');
    expect(tempGame.getPlayerStatus('juh7ygt5de0fkcru7hbg')).toBe('waiting');

    tempGame.movePlayer('juh7ygt5de0fkcru7hbg', 'pregame');

    expect(tempGame.getPlayerStatus('juh7ygt5de0fkcru7hbg')).toBe('pregame');
    expect(Array.from(tempGame.waitingPlayers)).toHaveLength(0);
  });

  test('set player as ready', () => {
    tempGame.addPlayer('jki9okpi0ijuhyg6trfd');
    tempGame.updateReadyPlayer('jki9okpi0ijuhyg6trfd');
    expect(tempGame.players.get('waiting').get('jki9okpi0ijuhyg6trfd').isReady).toBeTruthy();
  });

  test('calculate if all players ready', () => {
    tempGame.addPlayer('g6yhft5r4dswerdtguji');
    expect(tempGame.isAllReady).toBeFalsy();
    tempGame.updateReadyPlayer('g6yhft5r4dswerdtguji');
    expect(tempGame.isAllReady).toBeTruthy();
  });

  test('list all players in waiting state who are ready', () => {

  });
});
