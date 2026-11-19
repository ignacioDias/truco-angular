import { Player } from '../player/player';
import { EnvidoCall, PlayerId } from '../truco-types';
import { EnvidoCallState } from './envido-call-state';

const NO_CARDS_PLAYED = [false, false];

const newState = (player1EnvidoPoints = 0, player2EnvidoPoints = 0): EnvidoCallState => {
  const state = new EnvidoCallState();
  state.startNewHand(player1EnvidoPoints, player2EnvidoPoints);
  return state;
};

// Mirrors TrucoGame: player1 has id Player1 and player2 has id Player0.
const newPlayers = (): [Player, Player] => [
  new Player(PlayerId.Player1, 'Nos'),
  new Player(PlayerId.Player0, 'Ellos'),
];

describe('EnvidoCallState', () => {
  describe('startNewHand', () => {
    it('starts with envido not played', () => {
      expect(newState().getEnvidoPlayed()).toBe(false);
    });

    it('resets the calls and the resolution of the previous hand', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      state.startNewHand(33, 29);

      expect(state.getEnvidoPlayed()).toBe(false);
      expect(() =>
        state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([
        PlayerId.Player1,
        2,
      ]);
    });
  });

  describe('callEnvido - which calls can open', () => {
    it.each([EnvidoCall.Envido, EnvidoCall.RealEnvido, EnvidoCall.FaltaEnvido])(
      'allows %s as the first call',
      (call) => {
        const state = newState();

        expect(() => state.callEnvido(call, PlayerId.Player1, NO_CARDS_PLAYED)).not.toThrow();
        expect(state.getEnvidoPlayed()).toBe(true);
      },
    );

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'allows player %s to open envido before playing a card',
      (playerId) => {
        const state = newState();

        expect(() =>
          state.callEnvido(EnvidoCall.Envido, playerId, NO_CARDS_PLAYED),
        ).not.toThrow();
      },
    );

    it('rejects EnvidoCall.None', () => {
      const state = newState();

      expect(() => state.callEnvido(EnvidoCall.None, PlayerId.Player1, NO_CARDS_PLAYED)).toThrow(
        'Invalid Envido call',
      );
    });
  });

  describe('callEnvido - hierarchy', () => {
    it('allows envido followed by envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it("doesn't allow a third envido", () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED)).toThrow(
        "You can't call envido a third time",
      );
    });

    it('allows real envido after envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('allows real envido after envido + envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('allows falta envido directly after envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('allows falta envido after real envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('accepts the full chain envido, envido, real envido, falta envido', () => {
      const state = newState();

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('does not allow envido after real envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED)).toThrow(
        'Invalid Envido call',
      );
    });

    it('does not allow envido after falta envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED)).toThrow(
        'Invalid Envido call',
      );
    });

    it('does not allow real envido after falta envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).toThrow('Invalid Envido call');
    });

    it('does not allow repeating real envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).toThrow('Invalid Envido call');
    });

    it('does not allow repeating falta envido', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).toThrow('Invalid Envido call');
    });

    it('keeps the previous stakes when a call is rejected', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED)).toThrow();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([
        PlayerId.Player1,
        3,
      ]);
    });
  });

  describe('callEnvido - turns', () => {
    it('gives the answer to the opponent after a call', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED)).toThrow(
        "It's not your turn to call Envido",
      );
      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('alternates the player who can raise on every call', () => {
      const state = newState();

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED),
      ).toThrow("It's not your turn to call Envido");
      expect(() =>
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, NO_CARDS_PLAYED),
      ).not.toThrow();
    });

    it('stops following the current player once envido has been called', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      state.updateCurrentPlayerWithEnvido(PlayerId.Player1);

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED)).toThrow(
        "It's not your turn to call Envido",
      );
    });
  });

  describe('callEnvido - first card', () => {
    it('rejects opening envido after playing a card', () => {
      const state = newState();

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, [false, true])).toThrow(
        'You cannot call Envido after playing a card',
      );
    });

    it('allows the opponent, who has not played yet, to open envido', () => {
      const state = newState();

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, [false, true])).not.toThrow();
    });

    it('allows a player who already played to raise a bet that was already called', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, [false, false]);

      expect(() =>
        state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, [true, true]),
      ).not.toThrow();
    });
  });

  describe('envido resolution', () => {
    it('cannot be called again after the points were awarded', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED)).toThrow(
        'Envido has already been resolved',
      );
    });

    it('cannot be called again after it was rejected', () => {
      const state = newState();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.getPointsForEnvidoRejected();

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED)).toThrow(
        'Envido has already been resolved',
      );
    });
  });

  describe('awardEnvidoPoints', () => {
    it('gives the points to the player with the highest envido', () => {
      const state = newState(20, 31);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([
        PlayerId.Player0,
        2,
      ]);
    });

    it('gives the points to player 1 when they have more', () => {
      const state = newState(31, 20);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player0, 30, player1, player2)).toEqual([
        PlayerId.Player1,
        2,
      ]);
    });

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'awards a tie to the mano (player %s)',
      (mano) => {
        const state = newState(30, 30);
        const [player1, player2] = newPlayers();
        state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

        expect(state.awardEnvidoPoints(mano, 30, player1, player2)).toEqual([mano, 2]);
      },
    );

    it('is worth 2 points for a single envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(2);
    });

    it('is worth 4 points for envido + envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(4);
    });

    it('is worth 3 points for a single real envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(3);
    });

    it('is worth 5 points for envido + real envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(5);
    });

    it('is worth 7 points for envido + envido + real envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, NO_CARDS_PLAYED);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(7);
    });

    it.each<[15 | 30, number, number]>([
      [30, 0, 30],
      [30, 12, 18],
      [15, 0, 15],
      [15, 9, 6],
    ])(
      'falta envido to %s points gives the loser missing points (loser has %s -> %s)',
      (pointsRequiredToWin, loserPoints, expectedPoints) => {
        const state = newState(33, 29);
        const [player1, player2] = newPlayers();
        player2.points = loserPoints;
        state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

        expect(
          state.awardEnvidoPoints(PlayerId.Player1, pointsRequiredToWin, player1, player2),
        ).toEqual([PlayerId.Player1, expectedPoints]);
      },
    );

    it('uses the points of the loser, not the winner, for falta envido', () => {
      const state = newState(20, 31);
      const [player1, player2] = newPlayers();
      player1.points = 10;
      player2.points = 25;
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, NO_CARDS_PLAYED);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([
        PlayerId.Player0,
        20,
      ]);
    });

    it('awards nothing when nobody called envido', () => {
      const state = newState(33, 29);
      const [player1, player2] = newPlayers();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)[1]).toBe(0);
    });
  });
});
