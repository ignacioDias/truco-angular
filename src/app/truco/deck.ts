import { Card, Suit } from "./card";

export class Deck {
  private cards: Card[] = this.generateDeck();

  private generateDeck() {
    const cards: Card[] = [];
    const values = [1, 2, 3, 4, 5, 6, 7, 11, 12];
    for (const suit of Object.values(Suit) as Suit[]) {
      for (const value of values) {
        cards.push({ numericValue: value, suit: suit });
      }
    }
    return cards;
  }

  public getRandomCard(): Card {
    if (this.cards.length === 0) {
      throw new Error("No enough cards in the deck");
    }
     return this.getRandomElement(this.cards)!;
  }

  private getRandomElement<T>(arr: T[]): T | undefined {
    if (arr.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
  }

}
