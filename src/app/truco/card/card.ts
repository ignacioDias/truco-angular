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

}
