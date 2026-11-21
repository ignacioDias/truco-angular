import { PlayedCards, PlayerId, TrucoCall, opponentOf } from '../truco-types';

const CALL_ORDER: Record<TrucoCall, number> = {
  [TrucoCall.None]: 1,
  [TrucoCall.Truco]: 2,
  [TrucoCall.ReTruco]: 3,
  [TrucoCall.ValeCuatro]: 4,
};

export class TrucoCallState {
  private call: TrucoCall = TrucoCall.None;
  private playerToCall: PlayerId = PlayerId.Player0;

  public getCall(): TrucoCall {
    return this.call;
  }

  public getNextTrucoCall(): TrucoCall[] {
    if(this.call === TrucoCall.ValeCuatro) {
      return [];
    }
    if(this.call === TrucoCall.None) {
      return [TrucoCall.Truco];
    }
    if(this.call === TrucoCall.Truco) {
      return [TrucoCall.ReTruco];
    }
    if(this.call === TrucoCall.ReTruco) {
      return [TrucoCall.ValeCuatro];
    }
    return [];
  }

  /** Calls `playerId` can make right now, following the same rules as `callTruco`. */
  public getNextTrucoCallsFor(playerId: PlayerId, playedCards: PlayedCards): TrucoCall[] {
    if (this.call !== TrucoCall.None && this.playerToCall !== playerId) {
      return [];
    }
    if (playedCards[2][opponentOf(playerId)]?.numericValue === 4) {
      return [];
    }
    return this.getNextTrucoCall();
  }

  public getPlayerToCall(): PlayerId {
    return this.playerToCall;
  }

  public startNewHand(): void {
    this.call = TrucoCall.None;
    this.playerToCall = PlayerId.Player0;
  }

  public callTruco(trucoCall: TrucoCall, playerId: PlayerId, playedCards: PlayedCards): void {
    if (this.playerToCall !== playerId && this.call !== TrucoCall.None) {
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

  public getTrucoPoints(): number {
    return CALL_ORDER[this.call];
  }
}
