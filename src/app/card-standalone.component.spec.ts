import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardStandaloneComponent } from './card-standalone.component';

describe('CardStandaloneComponent', () => {
  let component: CardStandaloneComponent;
  let fixture: ComponentFixture<CardStandaloneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardStandaloneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardStandaloneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
