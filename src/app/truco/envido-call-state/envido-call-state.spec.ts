import { EnvidoCall, PlayerId } from '../truco-types';
import { Player } from '../player/player';
import { EnvidoCallState } from './envido-call-state';

interface EnvidoCallStateInternals {
  currentCall: EnvidoCall;
  currentEnvidoPoints: number;
  currentPlayerWithEnvido: PlayerId;
  player1EnvidoPoints: number;
  player2EnvidoPoints: number;
  envidoPlayed: boolean;
  envidoResolved: boolean;
}

const internals = (state: EnvidoCallState): EnvidoCallStateInternals =>
  state as unknown as EnvidoCallStateInternals;

const noCardsPlayed = (): boolean[] => [false, false];

function newState(
  mano: PlayerId = PlayerId.Player1,
  player1EnvidoPoints = 33,
  player2EnvidoPoints = 29,
): EnvidoCallState {
  const state = new EnvidoCallState();
  state.startNewHand(mano, player1EnvidoPoints, player2EnvidoPoints);
  return state;
}

function players(): [Player, Player] {
  return [new Player(PlayerId.Player1, 'Nos'), new Player(PlayerId.Player0, 'Ellos')];
}

describe('EnvidoCallState', () => {
  describe('startNewHand', () => {
    it('starts with no call and the mano as the player to call', () => {
      const state = newState(PlayerId.Player1);

      expect(internals(state).currentCall).toBe(EnvidoCall.None);
      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player1);
      expect(internals(state).currentEnvidoPoints).toBe(0);
      expect(state.getEnvidoPlayed()).toBe(false);
      expect(internals(state).envidoResolved).toBe(false);
    });

    it('snapshots the envido points of both players', () => {
      const state = newState(PlayerId.Player1, 33, 29);

      expect(internals(state).player1EnvidoPoints).toBe(33);
      expect(internals(state).player2EnvidoPoints).toBe(29);
    });

    it('resets the call of the previous hand', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();
      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      state.startNewHand(PlayerId.Player0, 20, 25);

      expect(internals(state).currentCall).toBe(EnvidoCall.None);
      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player0);
      expect(internals(state).currentEnvidoPoints).toBe(0);
      expect(state.getEnvidoPlayed()).toBe(false);
      expect(internals(state).envidoResolved).toBe(false);
      expect(internals(state).player1EnvidoPoints).toBe(20);
      expect(internals(state).player2EnvidoPoints).toBe(25);
    });
  });

  describe('updateCurrentPlayerWithEnvido', () => {
    it('moves the call to the given player while envido is not played', () => {
      const state = newState(PlayerId.Player1);

      state.updateCurrentPlayerWithEnvido(PlayerId.Player0);

      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player0);
    });

    it('ignores updates once envido has been played', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());

      state.updateCurrentPlayerWithEnvido(PlayerId.Player1);

      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player0);
    });
  });

  describe('getEnvidoPlayed', () => {
    it('is false before any call and true after one', () => {
      const state = newState(PlayerId.Player1);
      expect(state.getEnvidoPlayed()).toBe(false);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());

      expect(state.getEnvidoPlayed()).toBe(true);
    });
  });

  describe('callEnvido', () => {
    it('accepts envido from the mano and gives the answer to the opponent', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.Envido);
      expect(internals(state).currentEnvidoPoints).toBe(2);
      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player0);
      expect(state.getEnvidoPlayed()).toBe(true);
    });

    it('rejects a call from the player who does not hold the envido', () => {
      const state = newState(PlayerId.Player1);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed())).toThrow(
        "It's not your turn to call Envido",
      );
    });

    it('rejects a call from a player who already played a card', () => {
      const state = newState(PlayerId.Player1);

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, [false, true])).toThrow(
        'You cannot call Envido after playing a card',
      );
    });

    it('allows the non-mano to call after the turn moved to them', () => {
      const state = newState(PlayerId.Player1);
      state.updateCurrentPlayerWithEnvido(PlayerId.Player0);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, [false, true]);

      expect(internals(state).currentCall).toBe(EnvidoCall.Envido);
      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player1);
    });

    it('allows a player who already played to answer once envido is in play', () => {
      const state = newState(PlayerId.Player1);
      state.updateCurrentPlayerWithEnvido(PlayerId.Player0);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, [false, true]);

      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, [false, true]);

      expect(internals(state).currentCall).toBe(EnvidoCall.RealEnvido);
      expect(internals(state).currentEnvidoPoints).toBe(5);
    });

    it('accepts envido followed by envido', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.Envido);
      expect(internals(state).currentEnvidoPoints).toBe(4);
    });

    it('accepts real envido as the first call', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.RealEnvido);
      expect(internals(state).currentEnvidoPoints).toBe(3);
    });

    it('accepts envido followed by real envido', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.RealEnvido);
      expect(internals(state).currentEnvidoPoints).toBe(5);
    });

    it('accepts falta envido as the first call', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.FaltaEnvido);
    });

    it('accepts the full escalating chain', () => {
      const state = newState(PlayerId.Player1);

      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed());
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player0, noCardsPlayed());

      expect(internals(state).currentCall).toBe(EnvidoCall.FaltaEnvido);
      expect(internals(state).currentEnvidoPoints).toBe(7);
    });

    it('rejects repeating the same call other than envido', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, noCardsPlayed());

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, noCardsPlayed())).toThrow(
        'Invalid Envido call',
      );
    });

    it('rejects lowering the current call', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, noCardsPlayed());

      expect(() => state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed())).toThrow(
        'Invalid Envido call',
      );
    });

    it('rejects a none call', () => {
      const state = newState(PlayerId.Player1);

      expect(() => state.callEnvido(EnvidoCall.None, PlayerId.Player1, noCardsPlayed())).toThrow(
        'Invalid Envido call',
      );
    });

    it('rejects a call after envido was resolved', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();
      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      expect(() => state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, noCardsPlayed())).toThrow(
        'Envido has already been resolved',
      );
    });

    it('keeps the previous state when a call is rejected', () => {
      const state = newState(PlayerId.Player1);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());

      expect(() => state.callEnvido(EnvidoCall.None, PlayerId.Player0, noCardsPlayed())).toThrow();

      expect(internals(state).currentCall).toBe(EnvidoCall.Envido);
      expect(internals(state).currentEnvidoPoints).toBe(2);
      expect(internals(state).currentPlayerWithEnvido).toBe(PlayerId.Player0);
    });
  });

  describe('awardEnvidoPoints', () => {
    it('returns the winner id and the points, and marks envido resolved', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      const result = state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      expect(result).toEqual([PlayerId.Player1, 2]);
      expect(internals(state).envidoResolved).toBe(true);
    });

    it('does not change the players points itself', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      expect(player1.points).toBe(0);
      expect(player2.points).toBe(0);
    });

    it('awards player 1 when they have more envido points', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 2]);
    });

    it('awards player 2 when they have more envido points', () => {
      const state = newState(PlayerId.Player1, 20, 30);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player0, 2]);
    });

    it('awards a tie to player 1 when they are the mano', () => {
      const state = newState(PlayerId.Player1, 30, 30);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 2]);
    });

    it('awards a tie to player 2 when they are the mano', () => {
      const state = newState(PlayerId.Player0, 30, 30);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player0, 30, player1, player2)).toEqual([PlayerId.Player0, 2]);
    });

    it('awards 4 points for envido plus envido', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player0, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 4]);
    });

    it('awards 3 points for real envido', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 3]);
    });

    it('awards 5 points for envido plus real envido', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      state.callEnvido(EnvidoCall.RealEnvido, PlayerId.Player0, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 5]);
    });

    it('awards the points the opponent needs for falta envido', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();
      player2.points = 10;

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 20]);
    });

    it('awards the full target for falta envido when the opponent has no points', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 30]);
    });

    it('respects a 15 point game for falta envido', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.FaltaEnvido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();
      player2.points = 5;

      expect(state.awardEnvidoPoints(PlayerId.Player1, 15, player1, player2)).toEqual([PlayerId.Player1, 10]);
    });

    it('uses the envido points snapshot, not the current hands', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();
      player1.setHand([]);

      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 2]);
    });

    it('clears the accumulated points after awarding them', () => {
      const state = newState(PlayerId.Player1, 33, 29);
      state.callEnvido(EnvidoCall.Envido, PlayerId.Player1, noCardsPlayed());
      const [player1, player2] = players();

      state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2);

      expect(internals(state).currentEnvidoPoints).toBe(0);
      expect(state.awardEnvidoPoints(PlayerId.Player1, 30, player1, player2)).toEqual([PlayerId.Player1, 0]);
    });
  });
});