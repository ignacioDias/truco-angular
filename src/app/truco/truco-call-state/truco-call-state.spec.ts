import { Card, Suit } from '../card/card';
import { PlayedCards, PlayerId, TrucoCall, opponentOf } from '../truco-types';
import { TrucoCallState } from './truco-call-state';

const emptyTable = (): PlayedCards => [
  [null, null],
  [null, null],
  [null, null],
];

const tableWithFourInLastRound = (fourBy: PlayerId): PlayedCards => [
  [null, null],
  [null, null],
  fourBy === PlayerId.Player0
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

      state.startNewHand(PlayerId.Player1);

      expect(state.getCall()).toBe(TrucoCall.None);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player1);
    });

    it('resets the call of the previous hand', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      state.startNewHand(PlayerId.Player0);

      expect(state.getCall()).toBe(TrucoCall.None);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);
    });
  });

  describe('callTruco', () => {
    it('accepts the first truco and gives the answer to the opponent', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(state.getCall()).toBe(TrucoCall.Truco);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);
    });

    it('accepts the escalating calls in order', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());
      state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable());

      expect(state.getCall()).toBe(TrucoCall.ValeCuatro);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);
    });

    it('only allows the opponent to answer a call', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ReTruco, PlayerId.Player1, emptyTable())).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('rejects reTruco and valeCuatro before truco', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      expect(() => state.callTruco(TrucoCall.ReTruco, PlayerId.Player1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects skipping a level', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects repeating the current call', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it.each([PlayerId.Player0, PlayerId.Player1] as const)(
      'rejects a call when player %s played a 4 in the last round',
      (fourBy) => {
        const state = new TrucoCallState();
        state.startNewHand(PlayerId.Player1);

        expect(() =>
          state.callTruco(TrucoCall.Truco, opponentOf(fourBy), tableWithFourInLastRound(fourBy)),
        ).toThrow(
          'You cannot call Truco after the other player played a 4 in the last round',
        );
      },
    );

    it('allows a call when the 4 belongs to the caller', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player1, tableWithFourInLastRound(PlayerId.Player1))).not.toThrow();
      expect(state.getCall()).toBe(TrucoCall.Truco);
    });

    it('allows a call when the 4 was played before the last round', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player1, tableWithFourInFirstRound())).not.toThrow();
    });

    it('allows a call when the opponent played something other than a 4', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);

      const table: PlayedCards = [
        [null, null],
        [null, null],
        [new Card(3, Suit.Cups), null],
      ];

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player1, table)).not.toThrow();
    });

    it('keeps the previous state when a call is rejected', () => {
      const state = new TrucoCallState();
      state.startNewHand(PlayerId.Player1);
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable())).toThrow();

      expect(state.getCall()).toBe(TrucoCall.Truco);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);
    });
  });
});
