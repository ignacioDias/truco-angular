import { PlayerId } from '../truco-types';

export class TurnTracker {
  private currentTurn: number = 0;
  private currentRound: 1 | 2 | 3 = 1;
  private mano: PlayerId = PlayerId.Player0;
  public nextTurn(): void {
    this.currentTurn++;
  }

  public getRound(): 1 | 2 | 3 {
    return this.currentRound;
  }

  public nextRound(): void {
    if(this.currentRound < 3) {
      this.currentRound++;
    }
  }

  public getMano(): PlayerId {
    return this.mano;
  }

  public startNewHand(): void {
    this.currentTurn++;
    this.mano = this.getCurrentPlayer();
    this.currentRound = 1;
  }

  public getCurrentPlayer(): PlayerId {
    return this.currentTurn % 2 === PlayerId.Player0 ? PlayerId.Player0 : PlayerId.Player1;
  }

}
