import { Card, Suit } from '../card/card';
import { PlayedCards, PlayerId, opponentOf } from '../truco-types';
import { TrucoCallState } from './truco-call-state';

const emptyTable = (): PlayedCards => [
  [null, null],
  [null, null],
  [null, null],
];

const tableWithFourInLastRound = (fourBy: PlayerId): PlayedCards => [
  [null, null],
  [null, null],
  fourBy === 0
    ? [new Card(4, Suit.Cups), null]
    : [null, new Card(4, Suit.Cups)],
];

const tableWithFourInFirstRound = (): PlayedCards => [
  [new Card(4, Suit.Cups), null],
  [null, null],
  [null, null],
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

    it.each([0, 1] as const)(
      'rejects a call when player %s played a 4 in the last round',
      (fourBy) => {
        const state = new TrucoCallState();
        state.startNewHand(1);

        expect(() =>
          state.callTruco('truco', opponentOf(fourBy), tableWithFourInLastRound(fourBy)),
        ).toThrow(
          'You cannot call Truco after the other player played a 4 in the last round',
        );
      },
    );

    it('allows a call when the 4 belongs to the caller', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      expect(() => state.callTruco('truco', 1, tableWithFourInLastRound(1))).not.toThrow();
      expect(state.getCall()).toBe('truco');
    });

    it('allows a call when the 4 was played before the last round', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      expect(() => state.callTruco('truco', 1, tableWithFourInFirstRound())).not.toThrow();
    });

    it('allows a call when the opponent played something other than a 4', () => {
      const state = new TrucoCallState();
      state.startNewHand(1);

      const table: PlayedCards = [
        [null, null],
        [null, null],
        [new Card(3, Suit.Cups), null],
      ];

      expect(() => state.callTruco('truco', 1, table)).not.toThrow();
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
