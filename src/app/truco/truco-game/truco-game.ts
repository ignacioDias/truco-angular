import { Deck } from '../deck';
import { Player } from '../player/player';
import { Card } from '../card';
import { EnvidoCall, TrucoCall, PlayedCards } from '../truco-types';

export class TrucoGame {

  private deck: Deck = new Deck();
  private pointsRequiredToWin: 15 | 30 = 30;
  private player1: Player = new Player(1, 'Nos');
  private player2: Player = new Player(0, 'Ellos');
  private currentTurn: number = 0;
  private currentPlayedCards: PlayedCards = [[null, null], [null, null], [null, null]];
  private currentEnvidoCall: EnvidoCall = 'none';
  private currentEnvidoPoints: number = 0;
  private currentTruco: TrucoCall = 'none';
  private currentPlayerWithEnvido: number = -1;
  private currentPlayerWithTrucoCall: number = -1;
  private currentRound: 1 | 2 | 3 = 1;
  private playedCards: boolean[] = [false, false];
  private envidoPlayed: boolean = false;
  private mano: number = -1;
  private player1EnvidoPoints: number = 0;
  private player2EnvidoPoints: number = 0;
  private envidoResolved = false;

  constructor(player1Name: string, player2Name: string, pointsRequiredToWin: 15 | 30) {
    this.player1.name = player1Name;
    this.player2.name = player2Name;
    this.pointsRequiredToWin = pointsRequiredToWin;
  }

  public setPointsRequiredToWin(points: 15 | 30) {
    this.pointsRequiredToWin = points;
  }

  public nextRound(): void {
    if(this.currentRound >= 3) {
      this.newHand();
      return
    }
    this.playedCards = [false, false];
    this.currentRound++;
  }

  public newHand(): void {
    this.currentEnvidoCall = 'none';
    this.currentTruco = 'none';
    this.currentPlayedCards = [[null, null], [null, null], [null, null]];
    this.currentTurn++;
    this.mano = this.currentTurn % 2;
    this.currentPlayerWithEnvido = this.currentTurn % 2;
    this.currentPlayerWithTrucoCall = this.currentTurn % 2;
    this.currentRound = 1;
    this.envidoPlayed = false;
    this.playedCards = [false, false];
    this.currentEnvidoPoints = 0;
    this.setPlayersHands();
    this.player1EnvidoPoints = this.player1.getEnvidoPoints();
    this.player2EnvidoPoints = this.player2.getEnvidoPoints();
    this.envidoResolved = false;
  }

  private setPlayersHands() {
    const cards = new Set<Card>();
    while (cards.size < 6) {
      const card = this.deck.getRandomCard();
      cards.add(card);
    }
    const cardsArray = Array.from(cards);
    this.player1.setHand(cardsArray.slice(0, 3));
    this.player2.setHand(cardsArray.slice(3, 6));
  }

  public playCard(playerId: number, cardIndex: number): void {
    if (playerId !== this.currentTurn % 2) {
      throw new Error("It's not your turn");
    }
    if(this.playedCards[playerId]) {
      throw new Error("You have already played a card this round");
    }
    const player = playerId === 0 ? this.player2 : this.player1;
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      throw new Error("Invalid card index");
    }
    this.playedCards[playerId] = true;
    this.currentPlayedCards[this.currentRound - 1][playerId] = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.currentTurn++;
    if (!this.envidoPlayed) {
      this.currentPlayerWithEnvido = this.currentTurn % 2;
    }
  }

  public getGameWinner(): Player | null {
    if (this.player1.points >= this.pointsRequiredToWin) {
      return this.player1;
    } else if (this.player2.points >= this.pointsRequiredToWin) {
      return this.player2;
    }
    return null;
  }

  public callTruco(trucoCall: TrucoCall, userId: number): void {
    if(this.currentPlayerWithTrucoCall !== userId && this.currentTruco !== 'none') {
      throw new Error("It's not your turn to call Truco");
    }
    if(!this.checkTrucoCallValidity(trucoCall)) {
      throw new Error("Invalid Truco call");
    }
    this.currentTruco = trucoCall;
    this.currentPlayerWithTrucoCall = (userId + 1) % 2;
  }

  private checkTrucoCallValidity(trucoCall: TrucoCall): boolean {
    const callOrder: Record<TrucoCall, number> = {
      none: 0,
      truco: 1,
      reTruco: 2,
      valeCuatro: 3,
    };
    return callOrder[trucoCall] === callOrder[this.currentTruco] + 1;
  }

  public callEnvido(envidoCall: EnvidoCall, userId: number): void {
    if(this.currentRound > 1) {
      throw new Error("You cannot call Envido after the first round");
    }
    if (this.currentTruco !== 'none') {
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
    this.currentPlayerWithEnvido = this.currentPlayerWithEnvido === 0 ? 1 : 0;
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
      (this.player1EnvidoPoints === this.player2EnvidoPoints && this.mano === 1)
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

  public addPointsToPlayer(playerId: number, points: number): void {
    if (playerId === 0) {
      this.player2.points += points;
    } else if (playerId === 1) {
      this.player1.points += points;
    } else {
      throw new Error("Invalid player ID");
    }
  }

}
