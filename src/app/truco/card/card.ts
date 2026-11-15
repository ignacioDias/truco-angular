export enum Suit {
  Clubs = 'clubs',
  Coins = 'coins',
  Cups = 'cups',
  Swords = 'swords'
}

export class Card {
  numericValue: number;
  suit: Suit;

  constructor(numericValue: number, suit: Suit) {
    this.numericValue = numericValue;
    this.suit = suit;
  }
  public compareCards(card1: Card, card2: Card): number {
    const power1 = this.getTrucoPower(card1);
    const power2 = this.getTrucoPower(card2);
    return power1 - power2;
  }

  private getTrucoPower(card: Card): number {
    if (card.numericValue === 1 && card.suit === Suit.Swords) return 14;
    if (card.numericValue === 1 && card.suit === Suit.Clubs) return 13;
    if (card.numericValue === 7 && card.suit === Suit.Swords) return 12;
    if (card.numericValue === 7 && card.suit === Suit.Coins) return 11;
    if (card.numericValue === 3) return 10;
    if (card.numericValue === 2) return 9;
    if (card.numericValue === 1) return 8;
    if (card.numericValue === 12) return 7;
    if (card.numericValue === 11) return 6;
    if (card.numericValue === 7) return 5;
    if (card.numericValue === 6) return 4;
    if (card.numericValue === 5) return 3;
    if (card.numericValue === 4) return 2;
    return 0;
  }
}

