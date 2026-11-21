import { Card, Suit } from '../card/card';
import { PlayedCards, PlayerId, TrucoCall, opponentOf } from '../truco-types';
import { TrucoCallState } from './truco-call-state';

const emptyTable = (): PlayedCards => [
  [null, null],
  [null, null],
  [null, null],
];

const tableWithLastRoundCard = (playerId: PlayerId, numericValue: number): PlayedCards => {
  const table = emptyTable();
  table[2][playerId] = new Card(numericValue, Suit.Cups);
  return table;
};

const newState = (): TrucoCallState => {
  const state = new TrucoCallState();
  state.startNewHand();
  return state;
};

describe('TrucoCallState', () => {
  describe('startNewHand', () => {
    it('starts with no call', () => {
      expect(newState().getCall()).toBe(TrucoCall.None);
    });

    it('resets the call of the previous hand', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());

      state.startNewHand();

      expect(state.getCall()).toBe(TrucoCall.None);
      expect(state.getTrucoPoints()).toBe(1);
    });

    it('lets either player open the first call again after a reset', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      state.startNewHand();

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player0, emptyTable())).not.toThrow();
    });
  });

  describe('getTrucoPoints', () => {
    it('is worth 1 point when nobody called truco', () => {
      expect(newState().getTrucoPoints()).toBe(1);
    });

    it('is worth 2 points after truco', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(state.getTrucoPoints()).toBe(2);
    });

    it('is worth 3 points after retruco', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());

      expect(state.getTrucoPoints()).toBe(3);
    });

    it('is worth 4 points after vale cuatro', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());
      state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable());

      expect(state.getTrucoPoints()).toBe(4);
    });

    it('keeps the last accepted value when a call is rejected', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable())).toThrow();

      expect(state.getTrucoPoints()).toBe(2);
    });
  });

  describe('callTruco - who can open', () => {
    it.each([PlayerId.Player0, PlayerId.Player1])(
      'allows player %s to call the first truco',
      (playerId) => {
        const state = newState();

        state.callTruco(TrucoCall.Truco, playerId, emptyTable());

        expect(state.getCall()).toBe(TrucoCall.Truco);
      },
    );

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'gives the right to raise to the opponent of player %s after the first truco',
      (playerId) => {
        const state = newState();

        state.callTruco(TrucoCall.Truco, playerId, emptyTable());

        expect(state.getPlayerToCall()).toBe(opponentOf(playerId));
      },
    );
  });

  describe('callTruco - order of the calls', () => {
    it.each([TrucoCall.ReTruco, TrucoCall.ValeCuatro])(
      'rejects %s as the first call',
      (call) => {
        const state = newState();

        expect(() => state.callTruco(call, PlayerId.Player1, emptyTable())).toThrow(
          'Invalid Truco call',
        );
        expect(state.getCall()).toBe(TrucoCall.None);
      },
    );

    it('rejects None as a call', () => {
      const state = newState();

      expect(() => state.callTruco(TrucoCall.None, PlayerId.Player1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('accepts truco, retruco and vale cuatro in order', () => {
      const state = newState();

      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());
      state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable());

      expect(state.getCall()).toBe(TrucoCall.ValeCuatro);
    });

    it('rejects skipping retruco', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects repeating the current call', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player0, emptyTable())).toThrow(
        'Invalid Truco call',
      );
    });

    it('rejects going back to a lower call', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable())).toThrow(
        'Invalid Truco call',
      );
      expect(state.getCall()).toBe(TrucoCall.ReTruco);
    });

    it.each([TrucoCall.Truco, TrucoCall.ReTruco, TrucoCall.ValeCuatro])(
      'does not allow %s once vale cuatro was called',
      (call) => {
        const state = newState();
        state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
        state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());
        state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable());

        expect(() => state.callTruco(call, PlayerId.Player0, emptyTable())).toThrow();
        expect(state.getCall()).toBe(TrucoCall.ValeCuatro);
      },
    );
  });

  describe('callTruco - tener el quiero', () => {
    it('does not let the caller raise their own bid', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ReTruco, PlayerId.Player1, emptyTable())).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('lets only the player who accepted raise the bid', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable())).not.toThrow();
    });

    it('moves the right to raise to the other player after every call', () => {
      const state = newState();

      state.callTruco(TrucoCall.Truco, PlayerId.Player0, emptyTable());
      expect(state.getPlayerToCall()).toBe(PlayerId.Player1);

      state.callTruco(TrucoCall.ReTruco, PlayerId.Player1, emptyTable());
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);

      state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable());
      expect(state.getPlayerToCall()).toBe(PlayerId.Player1);
    });

    it('does not let the player who raised raise again', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());

      expect(() => state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player0, emptyTable())).toThrow(
        "It's not your turn to call Truco",
      );
    });

    it('keeps the previous state when a call is rejected', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(() => state.callTruco(TrucoCall.ReTruco, PlayerId.Player1, emptyTable())).toThrow();

      expect(state.getCall()).toBe(TrucoCall.Truco);
      expect(state.getPlayerToCall()).toBe(PlayerId.Player0);
    });
  });

  describe('getNextTrucoCallsFor', () => {
    it.each([PlayerId.Player0, PlayerId.Player1])(
      'offers the truco to player %s when nobody called',
      (playerId) => {
        expect(newState().getNextTrucoCallsFor(playerId, emptyTable())).toEqual([TrucoCall.Truco]);
      },
    );

    it('offers the next level only to the player with the right to raise', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());

      expect(state.getNextTrucoCallsFor(PlayerId.Player0, emptyTable())).toEqual([TrucoCall.ReTruco]);
      expect(state.getNextTrucoCallsFor(PlayerId.Player1, emptyTable())).toEqual([]);
    });

    it('offers nothing after vale cuatro', () => {
      const state = newState();
      state.callTruco(TrucoCall.Truco, PlayerId.Player1, emptyTable());
      state.callTruco(TrucoCall.ReTruco, PlayerId.Player0, emptyTable());
      state.callTruco(TrucoCall.ValeCuatro, PlayerId.Player1, emptyTable());

      expect(state.getNextTrucoCallsFor(PlayerId.Player0, emptyTable())).toEqual([]);
      expect(state.getNextTrucoCallsFor(PlayerId.Player1, emptyTable())).toEqual([]);
    });

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'offers nothing when the opponent of player %s played a 4 in the last round',
      (playerId) => {
        const table = tableWithLastRoundCard(opponentOf(playerId), 4);

        expect(newState().getNextTrucoCallsFor(playerId, table)).toEqual([]);
        expect(newState().getNextTrucoCallsFor(opponentOf(playerId), table)).toEqual([
          TrucoCall.Truco,
        ]);
      },
    );
  });

  describe('callTruco - a 4 played in the last round', () => {
    it.each([PlayerId.Player0, PlayerId.Player1])(
      'rejects a call after the opponent played a 4 (opponent is player %s)',
      (fourBy) => {
        const state = newState();

        expect(() =>
          state.callTruco(TrucoCall.Truco, opponentOf(fourBy), tableWithLastRoundCard(fourBy, 4)),
        ).toThrow('You cannot call Truco after the other player played a 4 in the last round');
        expect(state.getCall()).toBe(TrucoCall.None);
      },
    );

    it('allows the call when the 4 belongs to the caller', () => {
      const state = newState();

      expect(() =>
        state.callTruco(
          TrucoCall.Truco,
          PlayerId.Player1,
          tableWithLastRoundCard(PlayerId.Player1, 4),
        ),
      ).not.toThrow();
    });

    it('allows the call when the opponent played another card in the last round', () => {
      const state = newState();

      expect(() =>
        state.callTruco(
          TrucoCall.Truco,
          PlayerId.Player1,
          tableWithLastRoundCard(PlayerId.Player0, 3),
        ),
      ).not.toThrow();
    });

    it('allows the call when the 4 was played before the last round', () => {
      const state = newState();
      const table = emptyTable();
      table[0][PlayerId.Player0] = new Card(4, Suit.Cups);

      expect(() => state.callTruco(TrucoCall.Truco, PlayerId.Player1, table)).not.toThrow();
    });
  });
});
