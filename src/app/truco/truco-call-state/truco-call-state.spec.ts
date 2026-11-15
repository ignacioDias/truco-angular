import { Card, Suit } from '../card/card';
import { PlayedCards } from '../truco-types';
import { TrucoCallState } from './truco-call-state';

const emptyTable = (): PlayedCards => [
  [null, null],
  [null, null],
  [null, null],
];

const tableWithFourInThirdRound = (): PlayedCards => [
  [null, null],
  [null, null],
  [new Card(4, Suit.Cups), null],
];

describe('TrucoCallState', () => {
  describe('startNewHand', () => {
    it('starts with no call and the mano as the player to call', () => {
      const state = new TrucoCallState();

      state.startNewHand(1);

      expect(state.getCall()).toBe('none');
      expect(state.getPlayerToCall()).toBe(1);
    });

    it('resets the call of the previous hand', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);
      state.callTruco('truco', 1, emptyTable());

      state.startNewHand(0);

      expect(state.getCall()).toBe('none');
      expect(state.getPlayerToCall()).toBe(0);
    });
  });

  describe('callTruco', () => {
    it('accepts the first truco and gives the answer to the opponent', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      state.callTruco('truco', 1, emptyTable());

      expect(state.getCall()).toBe('truco');
      expect(state.getPlayerToCall()).toBe(0);
    });

    it('accepts the escalating calls in order', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      state.callTruco('truco', 1, emptyTable());
      state.callTruco('reTruco', 0, emptyTable());
      state.callTruco('valeCuatro', 1, emptyTable());

      expect(state.getCall()).toBe('valeCuatro');
      expect(state.getPlayerToCall()).toBe(0);
    });

    it('only allows the opponent to answer a call', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);
      state.callTruco('truco', 1, emptyTable());

      expect(() => state.callTruco('reTruco', 1, emptyTable())).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('rejects reTruco and valeCuatro before truco', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      expect(() => state.callTruco('reTruco', 1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
      expect(() => state.callTruco('valeCuatro', 1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects skipping a level', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);
      state.callTruco('truco', 1, emptyTable());

      expect(() => state.callTruco('valeCuatro', 0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects repeating the current call', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);
      state.callTruco('truco', 1, emptyTable());

      expect(() => state.callTruco('truco', 0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects a call after a 4 was played in the third round', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      expect(() =>
        state.callTruco('truco', 1, tableWithFourInThirdRound()),
      ).toThrow('You cannot call Truco after a 4 has been played');
    });

    it('keeps the previous state when a call is rejected', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);
      state.callTruco('truco', 1, emptyTable());

      expect(() => state.callTruco('valeCuatro', 0, emptyTable())).toThrow();

      expect(state.getCall()).toBe('truco');
      expect(state.getPlayerToCall()).toBe(0);
    });
  });
});
