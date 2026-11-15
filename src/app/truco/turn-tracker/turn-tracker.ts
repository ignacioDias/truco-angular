export class TurnTracker {
  private currentTurn: number = 0;
  private currentRound: 1 | 2 | 3 = 1;
  private mano: number = -1;
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

  public getMano(): number {
    return this.mano;
  }

  public startNewHand(): void {
    this.currentTurn++;
    this.mano = this.currentTurn % 2;
    this.currentRound = 1;
  }

  public getCurrentPlayer(): number {
    return this.currentTurn % 2;
  }

}
