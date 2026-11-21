import { Player } from './player/player';
import { Card } from './card/card';
import { RoundResolver } from './round-resolver/round-resolver';
import {
  EnvidoCall,
  PlayedCards,
  TrucoCall,
} from './truco-types';

export class Bot {
  player: Player;
  roundsWon: [boolean, boolean, boolean] = [false, false, false];

  constructor(player: Player) {
    this.player = player;
  }

  public getAnswerToEnvido(availableCalls: EnvidoCall[] = []): EnvidoCall {
    const points = this.player.getEnvidoPoints();
    let preferred: EnvidoCall;

    if (points >= 30) {
      preferred = EnvidoCall.FaltaEnvido;
    } else if (points >= 27) {
      preferred = EnvidoCall.RealEnvido;
    } else if (points >= 23) {
      preferred = EnvidoCall.Envido;
    } else {
      preferred = EnvidoCall.None;
    }

    if (availableCalls.length === 0) {
      return preferred;
    }
    if (availableCalls.includes(preferred)) {
      return preferred;
    }
    if (preferred === EnvidoCall.FaltaEnvido && availableCalls.includes(EnvidoCall.RealEnvido)) {
      return EnvidoCall.RealEnvido;
    }
    if (preferred !== EnvidoCall.None && availableCalls.includes(preferred)) {
      return preferred;
    }
    return availableCalls.includes(EnvidoCall.Envido)
      ? EnvidoCall.Envido
      : EnvidoCall.None;
  }

  public getEnvidoCall(availableCalls: EnvidoCall[] = []): EnvidoCall {
    return this.getAnswerToEnvido(availableCalls);
  }

  public getAnswerToTruco(
    trucoCall: TrucoCall = TrucoCall.Truco,
    playedCards: PlayedCards | null = null,
  ): boolean {
    const strongest = this.getStrongestCardPower();
    const handStrength = this.getHandStrength();

    if (trucoCall === TrucoCall.ValeCuatro) {
      return strongest >= 10 || handStrength >= 17;
    }
    if (trucoCall === TrucoCall.ReTruco) {
      return strongest >= 12 && handStrength >= 14;
    }

    if (playedCards) {
      const opponentId = 1 - this.player.getId();
      const round = this.findCurrentRound(playedCards);
      const opponentCard = playedCards[round - 1]?.[opponentId];
      if (opponentCard) {
        const winningCards = this.player.hand.filter(
          (card) => RoundResolver.compareCards(card, opponentCard) > 0,
        );
        if (winningCards.length > 0) {
          return true;
        }
      }
    }

    return strongest >= 9 && handStrength >= 12;
  }

  public shouldAcceptTruco(
    trucoCall: TrucoCall = TrucoCall.Truco,
    playedCards: PlayedCards | null = null,
  ): boolean {
    return this.getAnswerToTruco(trucoCall, playedCards);
  }

  public getTrucoCall(
    availableCalls: TrucoCall[] = [TrucoCall.Truco],
    playedCards: PlayedCards | null = null,
  ): TrucoCall {
    if (availableCalls.length === 0) {
      return TrucoCall.None;
    }

    const strongest = this.getStrongestCardPower();
    const handStrength = this.getHandStrength();
    let desired: TrucoCall = TrucoCall.None;

    if (handStrength >= 24 || strongest >= 13) {
      desired = TrucoCall.ValeCuatro;
    } else if (handStrength >= 17 || strongest >= 11) {
      desired = TrucoCall.ReTruco;
    } else if (handStrength >= 11 || strongest >= 9) {
      desired = TrucoCall.Truco;
    }

    if (playedCards) {
      const round = this.findCurrentRound(playedCards);
      if (round === 3 && desired !== TrucoCall.None) {
        desired = TrucoCall.Truco;
      }
    }

    if (availableCalls.includes(desired)) {
      return desired;
    }
    return availableCalls.includes(TrucoCall.Truco)
      ? (strongest >= 8 ? TrucoCall.Truco : TrucoCall.None)
      : TrucoCall.None;
  }

  public getCardToPlay(
    playedCards: PlayedCards | null = null,
    round: 1 | 2 | 3 = 1,
  ): number {
    if (this.player.hand.length === 0) {
      return -1;
    }

    if (!playedCards) {
      const sorted = this.getSortedHandIndexes();
      return round === 1 && sorted.length === 3
        ? sorted[1]
        : sorted[0];
    }

    const opponentId = 1 - this.player.getId();
    const opponentCard = playedCards[round - 1]?.[opponentId] ?? null;

    if (opponentCard) {
      const winningIndexes = this.player.hand
        .map((card, index) => ({ card, index }))
        .filter(({ card }) => RoundResolver.compareCards(card, opponentCard) > 0)
        .sort((a, b) => this.getCardPower(a.card) - this.getCardPower(b.card));

      if (winningIndexes.length > 0) {
        return winningIndexes[0].index;
      }

      const weakestIndex = this.getSortedHandIndexes()[0];
      return weakestIndex;
    }

    const sorted = this.getSortedHandIndexes();
    if (round === 1 && sorted.length === 3) {
      return sorted[1];
    }
    if (round === 3) {
      return sorted[0];
    }
    return sorted[0];
  }

  public chooseCard(
    playedCards: PlayedCards | null = null,
    round: 1 | 2 | 3 = 1,
  ): number {
    return this.getCardToPlay(playedCards, round);
  }

  public getCardIndexToPlay(
    playedCards: PlayedCards | null = null,
    round: 1 | 2 | 3 = 1,
  ): number {
    return this.getCardToPlay(playedCards, round);
  }

  public shouldGiveUp(playedCards: PlayedCards | null = null): boolean {
    if (this.player.hand.length === 0) {
      return true;
    }
    if (playedCards) {
      const round = this.findCurrentRound(playedCards);
      const remainingStrength = this.getHandStrength();
      const roundStrength = round === 3 ? this.getStrongestCardPower() : remainingStrength;
      return roundStrength < 4 && round === 3;
    }
    return this.getStrongestCardPower() < 2 && this.player.hand.length === 1;
  }

  private findCurrentRound(playedCards: PlayedCards): 1 | 2 | 3 {
    for (let index = 0; index < playedCards.length; index++) {
      if (playedCards[index][0] === null || playedCards[index][1] === null) {
        return (index + 1) as 1 | 2 | 3;
      }
    }
    return 3;
  }

  private getSortedHandIndexes(): number[] {
    return this.player.hand
      .map((card, index) => ({ card, index }))
      .sort((a, b) => this.getCardPower(a.card) - this.getCardPower(b.card))
      .map(({ index }) => index);
  }

  private getStrongestCardPower(): number {
    return this.player.hand.reduce(
      (strongest, card) => Math.max(strongest, this.getCardPower(card)),
      0,
    );
  }

  private getHandStrength(): number {
    return this.player.hand
      .map((card) => this.getCardPower(card))
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((total, power) => total + power, 0);
  }

  private getCardPower(card: Card): number {
    if (card.numericValue === 1) {
      if (card.suit === 'swords') return 14;
      if (card.suit === 'clubs') return 13;
    }
    if (card.numericValue === 7) {
      if (card.suit === 'swords') return 12;
      if (card.suit === 'coins') return 11;
    }

    const rankPowers: Record<number, number> = {
      3: 10,
      2: 9,
      1: 8,
      12: 7,
      11: 6,
      7: 5,
      6: 4,
      5: 3,
      4: 2,
    };
    return rankPowers[card.numericValue] ?? 0;
  }
}
