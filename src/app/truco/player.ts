import { Card, Suit } from './card';

export class Player {
  id: number = 0;
  name: string = '';
  hand: Card[] = [];
  points: number = 0;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  public setHand(cards: Card[]): void {
    this.hand = cards;
  }

  public getEnvidoPoints(): number {
    const valuesBySuit = new Map<Suit, number[]>();

    for (const card of this.hand) {
      const envidoValue = card.numericValue >= 11 ? 0 : card.numericValue;
      const values = valuesBySuit.get(card.suit) ?? [];

      values.push(envidoValue);
      valuesBySuit.set(card.suit, values);
    }

    let points = 0;
    for (const values of valuesBySuit.values()) {
      values.sort((a, b) => b - a);
      const suitPoints =
        values.length >= 2 ? 20 + values[0] + values[1] : values[0];
      points = Math.max(points, suitPoints);
    }

    return points;
  }
}

