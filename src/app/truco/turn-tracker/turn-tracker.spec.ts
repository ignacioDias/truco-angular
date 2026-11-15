import { TurnTracker } from './turn-tracker';

describe('TurnTracker', () => {
  describe('initial state', () => {
    it('starts on the first round', () => {
      expect(new TurnTracker().getRound()).toBe(1);
    });

    it('starts with player 0 on turn', () => {
      expect(new TurnTracker().getCurrentPlayer()).toBe(0);
    });

    it('has no mano until the first hand starts', () => {
      expect(new TurnTracker().getMano()).toBe(-1);
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

      expect(players).toEqual([0, 1, 0]);
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
  });

  describe('startNewHand', () => {
    it('makes player 1 the mano on the first hand', () => {
      const tracker = new TurnTracker();

      tracker.startNewHand();

      expect(tracker.getMano()).toBe(1);
      expect(tracker.getCurrentPlayer()).toBe(1);
    });

    it('alternates the mano between hands', () => {
      const tracker = new TurnTracker();

      tracker.startNewHand();
      tracker.startNewHand();

      expect(tracker.getMano()).toBe(0);
      expect(tracker.getCurrentPlayer()).toBe(0);
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
