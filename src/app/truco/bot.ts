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
          return Math.random() < 0.2 ? 'envido' : 'none';
      }
      if (this.player.getEnvidoPoints() < 25) {
          return Math.random() < 0.1 ? 'envido' : 'realEnvido';
      }
      if (this.player.getEnvidoPoints() < 30) {
          return Math.random() < 0.3 ? 'realEnvido' : 'faltaEnvido';
      }
      return 'faltaEnvido';
  }


}
