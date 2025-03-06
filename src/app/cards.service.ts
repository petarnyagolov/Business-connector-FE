import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardsService {
  public cards = [
    { title: 'Card 1', subtitle: 'Subtitle 1', content: 'Content 1' },
    { title: 'Card 2', subtitle: 'Subtitle 2', content: 'Content 2' },
    { title: 'Card 3', subtitle: 'Subtitle 3', content: 'Content 3' },
    { title: 'Card 4', subtitle: 'Subtitle 4', content: 'Content 4' },
    { title: 'Card 5', subtitle: 'Subtitle 5', content: 'Content 5' },
    { title: 'Card 6', subtitle: 'Subtitle 6', content: 'Content 6' },
    { title: 'Card 7', subtitle: 'Subtitle 7', content: 'Content 7' },
    { title: 'Card 8', subtitle: 'Subtitle 8', content: 'Content 8' },
    { title: 'Card 9', subtitle: 'Subtitle 9', content: 'Content 9' },
    { title: 'Card 10', subtitle: 'Subtitle 10', content: 'Content 10' },
    { title: 'Card 11', subtitle: 'Subtitle 11', content: 'Content 11' },
    { title: 'Card 12', subtitle: 'Subtitle 12', content: 'Content 12' }
  ];

  constructor() { }
}
