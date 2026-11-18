import { Player } from './player/player';
import { EnvidoCall } from './truco-types';

export class Bot {
    player: Player;
    roundsWon: [boolean, boolean, boolean] = [false, false, false];
    constructor(player: Player) {
        this.player = player;
    }

  public getAnswerToEnvido(): EnvidoCall {
      if (this.player.getEnvidoPoints() < 22) {
          return Math.random() < 0.2 ? EnvidoCall.Envido : EnvidoCall.None;
      }
      if (this.player.getEnvidoPoints() < 25) {
          return Math.random() < 0.1 ? EnvidoCall.Envido : EnvidoCall.RealEnvido;
      }
      if (this.player.getEnvidoPoints() < 30) {
          return Math.random() < 0.3 ? EnvidoCall.RealEnvido : EnvidoCall.FaltaEnvido;
      }
      return EnvidoCall.FaltaEnvido;
  }


}
