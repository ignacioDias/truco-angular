import { EnvidoCall, PlayerId } from '../truco-types';
import { Player } from '../player/player';

export class EnvidoCallState {
  public callEnvido(envidoCall: EnvidoCall, userId: PlayerId): void {
      if(this.turnTracker.getRound() > 1) {
        throw new Error("You cannot call Envido after the first round");
      }
      if (this.trucoCallState.getCall() !== 'none') {
        throw new Error('Envido cannot be called after Truco');
      }
      if(this.envidoResolved) {
        throw new Error("Envido has already been resolved");
      }
      if(this.currentPlayerWithEnvido !== userId) {
        throw new Error("It's not your turn to call Envido");
      }
      if(!this.envidoPlayed && this.playedCards[userId]) {
        throw new Error("You cannot call Envido after playing a card");
      }
      if(envidoCall === 'dobleEnvido' && this.currentEnvidoCall !== 'envido') {
        throw new Error("Invalid Envido call");
      }
      if(!this.checkEnvidoCallValidity(envidoCall)) {
        throw new Error("Invalid Envido call");
      }
      this.currentEnvidoCall = envidoCall;
      this.currentPlayerWithEnvido = opponentOf(userId);
      this.currentEnvidoPoints += this.calculateEnvidoPoints(envidoCall);
      this.envidoPlayed = true;
    }

    private calculateEnvidoPoints(envidoCall: EnvidoCall): number {
      switch (envidoCall) {
        case 'envido':
          return 2;
        case 'dobleEnvido':
          return 2;
        case 'realEnvido':
          return 3;
        default:
          return 0;
      }
    }

    private checkEnvidoCallValidity(envidoCall: EnvidoCall): boolean {
      const callOrder: Record<EnvidoCall, number> = {
        none: 0,
        envido: 1,
        dobleEnvido: 2,
        realEnvido: 3,
        faltaEnvido: 4,
      };
      return callOrder[envidoCall] > callOrder[this.currentEnvidoCall];
    }

    public setEnvidoPoints() {
      const winner = this.player1EnvidoPoints > this.player2EnvidoPoints ||
        (this.player1EnvidoPoints === this.player2EnvidoPoints && this.turnTracker.getMano() === 1)
        ? this.player1
        : this.player2;
      const opponent = winner === this.player1 ? this.player2 : this.player1;
      this.addEnvidoPoints(winner, opponent);
      this.envidoResolved = true;
    }

    private addEnvidoPoints(player: Player, opponent: Player): void {
      if (this.currentEnvidoCall === 'faltaEnvido') {
        this.currentEnvidoPoints += this.pointsRequiredToWin - opponent.points;
      }
      player.points += this.currentEnvidoPoints;
      this.currentEnvidoPoints = 0;
    }

}
