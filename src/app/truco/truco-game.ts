import { Deck } from './deck';
import { Player } from './player';
import { Card } from './card';

type GameStatus = 'waiting' | 'playing' | 'finished';
type EnvidoCall = 'none' | 'envido' | 'dobleEnvido' | 'realEnvido' | 'faltaEnvido';
type TrucoCall = 'none' | 'truco' | 'reTruco' | 'valeCuatro';
type PlayedCards = [
  [Card | null, Card | null],
  [Card | null, Card | null],
  [Card | null, Card | null],
];

export class TrucoGame {

  private deck: Deck = new Deck();
  private pointsRequiredToWin: 15 | 30 = 30;
  private player1: Player = {id: 1, name: 'Nos', hand: [], points: 0};
  private player2: Player = {id: 0, name: 'Ellos', hand: [], points: 0};
  private currentTurn: number = 1;
  private gameStatus: GameStatus = 'waiting';
  private currentPlayedCards: PlayedCards = [[null, null], [null, null], [null, null]];
  private currentEnvido: EnvidoCall = 'none';
  private currentTruco: TrucoCall = 'none';
  private currentPlayerWithEnvido: number = -1;
  private currentPlayerWithTrucoCall: number = -1;
  private currentRound: 1 | 2 | 3 = 1;

  public setPointsRequiredToWin(points: 15 | 30) {
    this.pointsRequiredToWin = points;
  }

  public setGameStatus(status: GameStatus) {
    this.gameStatus = status;
  }

  public nextRound(): void {
    if(this.currentRound >= 3) {
      this.currentRound = 1;
    } else {
      this.currentRound++;
    }
    this.newHand();
  }

  private newHand(): void {
    this.currentEnvido = 'none';
    this.currentTruco = 'none';
    this.currentPlayedCards = [[null, null], [null, null], [null, null]];
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

  public playCard(playerId: number, cardIndex: number): void {
    if (this.gameStatus !== 'playing') {
      throw new Error("Game is not in playing status");
    }
    if (playerId !== this.currentTurn % 2) {
      throw new Error("It's not your turn");
    }
    const player = playerId === 0 ? this.player2 : this.player1;
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      throw new Error("Invalid card index");
    }
    this.currentPlayedCards[this.currentRound - 1][playerId] = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.currentTurn++;
  }

  public getWinner(): Player | null {
    if (this.player1.points >= this.pointsRequiredToWin) {
      return this.player1;
    } else if (this.player2.points >= this.pointsRequiredToWin) {
      return this.player2;
    }
    return null;
  }

  public callTruco(trucoCall: TrucoCall, userId: number): void {
    if(this.currentPlayerWithTrucoCall !== userId) {
      throw new Error("It's not your turn to call Truco");
    }
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

  public callEnvido(envidoCall: EnvidoCall, userId: number): void {
    if(this.currentPlayerWithEnvido !== userId) {
      throw new Error("It's not your turn to call Envido");
    }
    if(this.currentRound > 1) {
      throw new Error("Envido can only be called in the first round");
    }
    if(envidoCall === 'dobleEnvido' && this.currentEnvido !== 'envido') {
      throw new Error("Invalid Envido call");
    }
    if(!this.checkEnvidoCallValidity(envidoCall)) {
      throw new Error("Invalid Envido call");
    }
    this.currentEnvido = envidoCall;
    this.currentPlayerWithEnvido = this.currentTurn % 2;
  }

  private checkEnvidoCallValidity(envidoCall: EnvidoCall): boolean {
    const callOrder: Record<EnvidoCall, number> = {
      none: 0,
      envido: 1,
      dobleEnvido: 2,
      realEnvido: 3,
      faltaEnvido: 4,
    };
    return callOrder[envidoCall] > callOrder[this.currentEnvido];
  }
}
