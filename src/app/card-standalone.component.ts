import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-card-standalone',
  standalone: true,
  imports: [CommonModule],
  template: '<div>Card Standalone works!</div>',
  styleUrl: './card-standalone.component.css'
})
export class CardStandaloneComponent implements OnInit {
  constructor(readonly cardStandAlone: CardStandaloneComponent) { }

  ngOnInit(): void {
  }

}
