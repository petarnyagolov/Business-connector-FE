import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-section">
      <h2>⏰ Изтичащи обяви</h2>
      <div class="section-content">Тук ще се показват изтичащите обяви.</div>
    </div>
    <div class="home-section">
      <h2>🛒 Обяви за продаване на използвани машини</h2>
      <div class="section-content">Тук ще се показват обяви за продаване на използвани машини.</div>
    </div>
    <div class="home-section">
      <h2>🔎 Обяви за купуване на машини</h2>
      <div class="section-content">Тук ще се показват обяви за купуване на машини.</div>
    </div>
    <div class="home-section">
      <h2>⚙️ Металообработка</h2>
      <div class="section-content">Тук ще се показват обяви за металообработка.</div>
    </div>
    <div class="home-section">
      <h2>🪵 Дървообработка</h2>
      <div class="section-content">Тук ще се показват обяви за дървообработка.</div>
    </div>
    <div class="home-section">
      <h2>🧴 Производство на пластмасови изделия</h2>
      <div class="section-content">Тук ще се показват обяви за производство на пластмасови изделия.</div>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
