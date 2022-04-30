import { describe, expect, test } from '@jest/globals';
import Player from '../public/js/player';

let tempPlayer;

describe('Player Class', () => {
  test('create instance', () => {
    tempPlayer = new Player('0kjhytfds4yu7y6fdsaw');
  });

  test('reset function sets all values to original', () => {
    tempPlayer.character = 'monkee';
    tempPlayer.isReady = true;
    tempPlayer.isTagged = true;
    tempPlayer.isChaser = true;
    tempPlayer.reset();
    expect(tempPlayer.character === 'undefined');
    expect(tempPlayer.isReady === false);
    expect(tempPlayer.isTagged === false);
    expect(tempPlayer.isChaser).toBeFalsy();
  });
});
