import { Service, inject } from '@angular/core';
import { Deck } from './deck';
import { Player } from './player';
import { Card } from './card';

type GameStatus = 'waiting' | 'playing' | 'finished';
type EnvidoCall = 'none' | 'envido' | 'dobleEnvido' | 'realEnvido' | 'faltaEnvido';
type TrucoCall = 'none' | 'truco' | 'reTruco' | 'valeCuatro';

@Service()
export class TrucoService {
  private deck: Deck = new Deck();
  private pointsRequiredToWin: 15 | 30 = 30;
  private player1: Player = {id: 1, name: 'Nos', hand: [], points: 0};
  private player2: Player = {id: 0, name: 'Ellos', hand: [], points: 0};
  private currentTurn: number = 1;
  private gameStatus: GameStatus = 'waiting';
  private currentEnvido: EnvidoCall = 'none';
  private currentTruco: TrucoCall = 'none';
  private currentPlayerWithEnvido: number = -1;
  private currentPlayerWithTrucoCall: number = -1;
  private currentRound: 1 | 2 | 3 = 1;

  public setPointsRequiredToWin(points: 15 | 30) {
    this.pointsRequiredToWin = points;
  }

  public newHand(): void {
    this.currentEnvido = 'none';
    this.currentTruco = 'none';
    this.currentPlayerWithEnvido = this.currentRound % 2;
    this.currentPlayerWithTrucoCall = this.currentRound % 2;
    this.currentRound = 1;
    this.setPlayersHands();
    this.currentTurn++;
  }

  protected setPlayersHands() {
    const cards = new Set<Card>();
    while (cards.size < 6) {
      const card = this.deck.getRandomCard();
      cards.add(card);
    }
    const cardsArray = Array.from(cards);
    this.player1.hand = cardsArray.slice(0, 3);
    this.player2.hand = cardsArray.slice(3, 6);
  }

  public getWinner(): Player | null {
    if (this.player1.points >= this.pointsRequiredToWin) {
      return this.player1;
    } else if (this.player2.points >= this.pointsRequiredToWin) {
      return this.player2;
    }
    return null;
  }

  public callTruco(trucoCall: TrucoCall): void {
    if(!this.checkTrucoCallValidity(trucoCall)) {
      throw new Error("Invalid Truco call");
    }
    this.currentTruco = trucoCall;
    this.currentPlayerWithTrucoCall = this.currentTurn % 2;
  }

  private checkTrucoCallValidity(trucoCall: TrucoCall): boolean {
    const callOrder: Record<TrucoCall, number> = {
      none: 0,
      truco: 1,
      reTruco: 2,
      valeCuatro: 3,
    };
    return callOrder[trucoCall] > callOrder[this.currentTruco];
  }
}
