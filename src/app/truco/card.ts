export enum Suit {
  Clubs = 'clubs',
  Coins = 'coins',
  Cups = 'cups',
  Swords = 'swords'
}

export interface Card {
  numericValue: number;
  suit: Suit;
}

