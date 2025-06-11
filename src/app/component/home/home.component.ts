import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-section">
      <h2>⏰ Изтичащи Заявления</h2>
      <div class="section-content">Тук ще се показват изтичащите заявления.</div>
    </div>
    <div class="home-section">
      <h2>🛒 Заявления за продаване на използвани машини</h2>
      <div class="section-content">Тук ще се показват заявления за продаване на използвани машини.</div>
    </div>
    <div class="home-section">
      <h2>🔎 Заявления за купуване на машини</h2>
      <div class="section-content">Тук ще се показват заявления за купуване на машини.</div>
    </div>
    <div class="home-section">
      <h2>⚙️ Металообработка</h2>
      <div class="section-content">Тук ще се показват заявления за металообработка.</div>
    </div>
    <div class="home-section">
      <h2>🪵 Дървообработка</h2>
      <div class="section-content">Тук ще се показват заявления за дървообработка.</div>
    </div>
    <div class="home-section">
      <h2>🧴 Производство на пластмасови изделия</h2>
      <div class="section-content">Тук ще се показват заявления за производство на пластмасови изделия.</div>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
