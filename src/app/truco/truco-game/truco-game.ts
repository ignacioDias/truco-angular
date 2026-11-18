import { Deck } from '../deck';
import { Player } from '../player/player';
import { Card } from '../card/card';
import { EnvidoCall, PlayedCards, PlayerId, TrucoCall } from '../truco-types';
import { TurnTracker } from '../turn-tracker/turn-tracker';
import { TrucoCallState } from '../truco-call-state/truco-call-state';
import { EnvidoCallState } from '../envido-call-state/envido-call-state';
export class TrucoGame {

  private deck: Deck = new Deck();
  private pointsRequiredToWin: 15 | 30 = 30;
  private player1: Player = new Player(PlayerId.Player1, 'Nos');
  private player2: Player = new Player(PlayerId.Player0, 'Ellos');
  private turnTracker: TurnTracker = new TurnTracker();
  private currentPlayedCards: PlayedCards = [[null, null], [null, null], [null, null]];
  private playedCards: boolean[] = [false, false];
  private trucoCallState: TrucoCallState = new TrucoCallState();
  private envidoCallState: EnvidoCallState = new EnvidoCallState();

  constructor(player1Name: string, player2Name: string, pointsRequiredToWin: 15 | 30) {
    this.player1.name = player1Name;
    this.player2.name = player2Name;
    this.pointsRequiredToWin = pointsRequiredToWin;
  }

  public setPointsRequiredToWin(points: 15 | 30) {
    this.pointsRequiredToWin = points;
  }

  public finishRound(): void {

  }

  public nextRound(): void {
    if(this.turnTracker.getRound() >= 3) {
      this.newHand();
      return
    }
    this.playedCards = [false, false];
    this.turnTracker.nextRound();
  }

  public newHand(): void {
    this.currentPlayedCards = [[null, null], [null, null], [null, null]];
    this.turnTracker.startNewHand();
    this.playedCards = [false, false];
    this.setPlayersHands();
    this.envidoCallState.startNewHand(this.turnTracker.getMano(), this.player1.getEnvidoPoints(), this.player2.getEnvidoPoints());
    this.trucoCallState.startNewHand(this.turnTracker.getMano());
    this.deck.shuffle();
  }

  private setPlayersHands() {
    const cards : Card[] = [];
    while (cards.length < 6) {
      const card = this.deck.deal();
      cards.push(card);
    }
    this.player1.setHand(cards.slice(0, 3));
    this.player2.setHand(cards.slice(3, 6));
  }

  public playCard(playerId: PlayerId, cardIndex: number): void {
    if (playerId !== this.turnTracker.getCurrentPlayer()) {
      throw new Error("It's not your turn");
    }
    if(this.playedCards[playerId]) {
      throw new Error("You have already played a card this round");
    }
    const player = playerId === PlayerId.Player0 ? this.player2 : this.player1;
    if (cardIndex < 0 || cardIndex >= player.hand.length) {
      throw new Error("Invalid card index");
    }
    this.playedCards[playerId] = true;
    this.currentPlayedCards[this.turnTracker.getRound() - 1][playerId] = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);
    this.turnTracker.nextTurn();
    if (!this.envidoCallState.getEnvidoPlayed()) {
      this.envidoCallState.updateCurrentPlayerWithEnvido(this.turnTracker.getCurrentPlayer());
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

  public callTruco(trucoCall: TrucoCall, userId: PlayerId): void {
    this.trucoCallState.callTruco(trucoCall, userId, this.currentPlayedCards);
  }

  public callEnvido(envidoCall: EnvidoCall, userId: PlayerId): void {
      if(this.turnTracker.getRound() > 1) {
        throw new Error("You cannot call Envido after the first round");
      }
      if(this.trucoCallState.getCall() !== TrucoCall.None) {
        throw new Error('Envido cannot be called after Truco');
      }
    this.envidoCallState.callEnvido(envidoCall, userId, this.playedCards);
  }

  public setPointsFromEnvido(): void {
    const [winnerId, pointsToAdd] = this.envidoCallState.awardEnvidoPoints(this.turnTracker.getMano(), this.pointsRequiredToWin, this.player1, this.player2);
    this.addPointsToPlayer(winnerId, pointsToAdd);
  }

  public addPointsToPlayer(playerId: PlayerId, points: number): void {
    if (playerId === PlayerId.Player0) {
      this.player2.points += points;
    } else if (playerId === PlayerId.Player1) {
      this.player1.points += points;
    } else {
      throw new Error("Invalid player ID");
    }
  }



}
