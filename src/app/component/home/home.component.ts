import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-section">
      <h2>⏰ Изтичащи Публикации</h2>
      <div class="section-content">Тук ще се показват изтичащите публикации.</div>
    </div>
    <div class="home-section">
      <h2>🛒 Публикации за продаване на използвани машини</h2>
      <div class="section-content">Тук ще се показват публикации за продаване на използвани машини.</div>
    </div>
    <div class="home-section">
      <h2>🔎 Публикации за купуване на машини</h2>
      <div class="section-content">Тук ще се показват публикации за купуване на машини.</div>
    </div>
    <div class="home-section">
      <h2>⚙️ Металообработка</h2>
      <div class="section-content">Тук ще се показват публикации за металообработка.</div>
    </div>
    <div class="home-section">
      <h2>🪵 Дървообработка</h2>
      <div class="section-content">Тук ще се показват публикации за дървообработка.</div>
    </div>
    <div class="home-section">
      <h2>🧴 Производство на пластмасови изделия</h2>
      <div class="section-content">Тук ще се показват публикации за производство на пластмасови изделия.</div>
    </div>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
