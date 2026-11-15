import { PlayedCards, PlayerId, TrucoCall, opponentOf } from '../truco-types';

const CALL_ORDER: Record<TrucoCall, number> = {
  none: 0,
  truco: 1,
  reTruco: 2,
  valeCuatro: 3,
};

export class TrucoCallState {
  private call: TrucoCall = 'none';
  private playerToCall: number = -1;

  public getCall(): TrucoCall {
    return this.call;
  }

  public getPlayerToCall(): number {
    return this.playerToCall;
  }

  public startNewHand(mano: number): void {
    this.call = 'none';
    this.playerToCall = mano;
  }

  public callTruco(trucoCall: TrucoCall, playerId: PlayerId, playedCards: PlayedCards): void {
    if (this.playerToCall !== playerId && this.call !== 'none') {
      throw new Error("It's not your turn to call Truco");
    }
    const opponentCard = playedCards[2][opponentOf(playerId)];
    if (opponentCard?.numericValue === 4) {
      throw new Error('You cannot call Truco after the other player played a 4 in the last round');
    }
    if (!this.isValidCall(trucoCall)) {
      throw new Error('Invalid Truco call');
    }
    this.call = trucoCall;
    this.playerToCall = opponentOf(playerId);
  }

  private isValidCall(trucoCall: TrucoCall): boolean {
    return CALL_ORDER[trucoCall] === CALL_ORDER[this.call] + 1;
  }
}
