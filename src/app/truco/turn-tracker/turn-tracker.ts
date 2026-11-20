import { opponentOf, PlayerId } from '../truco-types';

export class TurnTracker {
  private currentRound: 1 | 2 | 3 = 1;
  private mano: PlayerId = PlayerId.Player0;
  private currentPlayer: PlayerId = PlayerId.Player0;

  public nextTurn(): void {
    this.currentPlayer = opponentOf(this.currentPlayer);
  }

  public getRound(): 1 | 2 | 3 {
    return this.currentRound;
  }

  /**
   * Moves to the next round. The winner of the previous round plays first; after a
   * parda (`null`) the mano plays first.
   */
  public nextRound(roundWinner: PlayerId | null = null): void {
    if (this.currentRound < 3) {
      this.currentRound++;
    }
    this.currentPlayer = roundWinner ?? this.mano;
  }

  public getMano(): PlayerId {
    return this.mano;
  }

  public startNewHand(): void {
    this.mano = opponentOf(this.mano);
    this.currentRound = 1;
    this.currentPlayer = this.mano;
  }

  public getCurrentPlayer(): PlayerId {
    return this.currentPlayer;
  }

}
