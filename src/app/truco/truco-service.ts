import { Service } from '@angular/core';
import { Deck } from './deck';

@Service()
export class TrucoService {
  private deck: Deck = new Deck();
}
