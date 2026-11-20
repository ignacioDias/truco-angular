import { PlayerId } from '../truco-types';
import { TurnTracker } from './turn-tracker';

describe('TurnTracker', () => {
  describe('initial state', () => {
    it('starts on the first round', () => {
      expect(new TurnTracker().getRound()).toBe(1);
    });

    it('starts with player 0 on turn', () => {
      expect(new TurnTracker().getCurrentPlayer()).toBe(PlayerId.Player0);
    });

    it('defaults the mano to player 0 until the first hand starts', () => {
      expect(new TurnTracker().getMano()).toBe(PlayerId.Player0);
    });
  });

  describe('nextTurn', () => {
    it('alternates the current player', () => {
      const tracker = new TurnTracker();
      const players = [tracker.getCurrentPlayer()];

      tracker.nextTurn();
      players.push(tracker.getCurrentPlayer());
      tracker.nextTurn();
      players.push(tracker.getCurrentPlayer());

      expect(players).toEqual([PlayerId.Player0, PlayerId.Player1, PlayerId.Player0]);
    });

    it('gives the turn to the opponent of the mano after the first card of a hand', () => {
      const tracker = new TurnTracker();
      tracker.startNewHand();

      tracker.nextTurn();

      expect(tracker.getCurrentPlayer()).toBe(PlayerId.Player0);
    });
  });

  describe('nextRound', () => {
    it('advances from the first to the second and third round', () => {
      const tracker = new TurnTracker();

      tracker.nextRound();
      expect(tracker.getRound()).toBe(2);

      tracker.nextRound();
      expect(tracker.getRound()).toBe(3);
    });

    it('stays on the third round', () => {
      const tracker = new TurnTracker();

      tracker.nextRound();
      tracker.nextRound();
      tracker.nextRound();

      expect(tracker.getRound()).toBe(3);
    });

    it.each([PlayerId.Player0, PlayerId.Player1])(
      'lets the winner of the round (player %s) play first',
      (winner) => {
        const tracker = new TurnTracker();
        tracker.startNewHand();

        tracker.nextRound(winner);

        expect(tracker.getCurrentPlayer()).toBe(winner);
      },
    );

    it('lets the mano play first after a parda', () => {
      const tracker = new TurnTracker();
      tracker.startNewHand();
      tracker.nextTurn();
      tracker.nextTurn();
      tracker.nextTurn();

      tracker.nextRound(null);

      expect(tracker.getCurrentPlayer()).toBe(tracker.getMano());
    });

    it('lets the mano play first when no winner is given', () => {
      const tracker = new TurnTracker();
      tracker.startNewHand();
      tracker.nextTurn();

      tracker.nextRound();

      expect(tracker.getCurrentPlayer()).toBe(tracker.getMano());
    });
  });

  describe('startNewHand', () => {
    it('makes player 1 the mano on the first hand', () => {
      const tracker = new TurnTracker();

      tracker.startNewHand();

      expect(tracker.getMano()).toBe(PlayerId.Player1);
      expect(tracker.getCurrentPlayer()).toBe(PlayerId.Player1);
    });

    it('alternates the mano between hands', () => {
      const tracker = new TurnTracker();

      tracker.startNewHand();
      tracker.startNewHand();

      expect(tracker.getMano()).toBe(PlayerId.Player0);
      expect(tracker.getCurrentPlayer()).toBe(PlayerId.Player0);
    });

    it('starts on the first round with the mano on turn', () => {
      const tracker = new TurnTracker();
      tracker.startNewHand();
      tracker.nextTurn();
      tracker.nextRound(PlayerId.Player0);

      tracker.startNewHand();

      expect(tracker.getRound()).toBe(1);
      expect(tracker.getCurrentPlayer()).toBe(tracker.getMano());
    });

    it('goes back to the first round', () => {
      const tracker = new TurnTracker();
      tracker.nextRound();
      tracker.nextRound();

      tracker.startNewHand();

      expect(tracker.getRound()).toBe(1);
    });
  });
});
