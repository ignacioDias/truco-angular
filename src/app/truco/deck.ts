import { Card, Suit } from "./card/card";

export class Deck {
  private cards: Card[] = this.generateDeck();
  private shuffledCards: Card[] = this.shuffleArray(this.cards);

  private generateDeck() {
    const cards: Card[] = [];
    const values = [1, 2, 3, 4, 5, 6, 7, 11, 12];
    for (const suit of Object.values(Suit) as Suit[]) {
      for (const value of values) {
        cards.push(new Card(value, suit));
      }
    }
    return cards;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]; // Swap elements
    }
    return copy;
  }

  public shuffle(): void {
    this.shuffledCards = this.shuffleArray(this.cards);
  }

  public deal(): Card {
    if (this.shuffledCards.length === 0) {
      throw new Error("No enough cards in the deck");
    }
    const randomIndex = this.getRandomIndex(this.shuffledCards);
    const card = this.shuffledCards[randomIndex];
    this.shuffledCards.splice(randomIndex, 1);
    return card;
  }

  private getRandomIndex<T>(arr: T[]): number {
    if (arr.length === 0) return -1;
    const randomIndex = Math.floor(Math.random() * arr.length);
    return randomIndex;
  }

}
