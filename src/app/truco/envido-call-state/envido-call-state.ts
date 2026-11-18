import { EnvidoCall, PlayerId, opponentOf } from '../truco-types';
import { Player } from '../player/player';
export class EnvidoCallState {

  private currentCall: EnvidoCall = EnvidoCall.None;
  private currentEnvidoPoints: number = 0;
  private currentPlayerWithEnvido: PlayerId = PlayerId.Player0;
  private player1EnvidoPoints: number = 0;
  private player2EnvidoPoints: number = 0;
  private envidoResolved = false;
  private envidoPlayed: boolean = false;

  public startNewHand(mano: PlayerId, player1EnvidoPoints: number, player2EnvidoPoints: number): void {
    this.currentCall = EnvidoCall.None;
    this.currentPlayerWithEnvido = mano;
    this.envidoPlayed = false;
    this.currentEnvidoPoints = 0;
    this.player1EnvidoPoints = player1EnvidoPoints;
    this.player2EnvidoPoints = player2EnvidoPoints;
    this.envidoResolved = false;

  }

  public updateCurrentPlayerWithEnvido(currentPlayer: PlayerId): void {
    if (!this.envidoPlayed) {
      this.currentPlayerWithEnvido = currentPlayer;
    }
  }
  public getEnvidoPlayed(): boolean {
    return this.envidoPlayed;
  }

  public callEnvido(envidoCall: EnvidoCall, userId: PlayerId, playedCards: boolean[]): void {
      if(this.envidoResolved) {
        throw new Error("Envido has already been resolved");
      }
      if(this.currentPlayerWithEnvido !== userId) {
        throw new Error("It's not your turn to call Envido");
      }
      if(!this.envidoPlayed && playedCards[userId]) {
        throw new Error("You cannot call Envido after playing a card");
      }
      if(!this.checkEnvidoCallValidity(envidoCall)) {
        throw new Error("Invalid Envido call");
      }
      this.currentCall = envidoCall;
      this.currentPlayerWithEnvido = opponentOf(userId);
      this.currentEnvidoPoints += this.convertEnvidoCallToPoints(envidoCall);
      this.envidoPlayed = true;
    }

    private convertEnvidoCallToPoints(envidoCall: EnvidoCall): number {
      switch (envidoCall) {
        case EnvidoCall.Envido:
          return 2;
        case EnvidoCall.RealEnvido:
          return 3;
        default:
          return 0;
      }
    }

  private checkEnvidoCallValidity(envidoCall: EnvidoCall): boolean {
      if(envidoCall === EnvidoCall.Envido && this.currentCall === EnvidoCall.Envido) {
        return true;
      }
      const callOrder: Record<EnvidoCall, number> = {
        [EnvidoCall.None]: 0,
        [EnvidoCall.Envido]: 1,
        [EnvidoCall.RealEnvido]: 3,
        [EnvidoCall.FaltaEnvido]: 4,
      };
      return callOrder[envidoCall] > callOrder[this.currentCall];
    }

    public awardEnvidoPoints(currentMano: PlayerId, pointsRequiredToWin: 15 | 30, player1: Player, player2: Player): [PlayerId, number] {
      const winner = this.player1EnvidoPoints > this.player2EnvidoPoints ||
        (this.player1EnvidoPoints === this.player2EnvidoPoints && currentMano === PlayerId.Player1) ? player1 : player2;
      const opponent = winner === player1 ? player2 : player1;
      const pointsToAdd = this.calculateEnvidoPoints(opponent, pointsRequiredToWin);
      const output: [PlayerId, number] = [winner.getId(), pointsToAdd];
      this.envidoResolved = true;
      return output;
    }

    private calculateEnvidoPoints(opponent: Player, pointsRequiredToWin: 15 | 30): number {
      if (this.currentCall === EnvidoCall.FaltaEnvido) {
        this.currentEnvidoPoints += pointsRequiredToWin - opponent.points;
      }
      const pointsToAdd = this.currentEnvidoPoints;
      this.currentEnvidoPoints = 0;
      return pointsToAdd;
    }

}
