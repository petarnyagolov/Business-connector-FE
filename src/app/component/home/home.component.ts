import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <h1>Намерете точния партньор за вашия бизнес</h1>
          <p>
            XDealHub свързва фирми за покупка, продажба и услуги от различни индустрии
            и производства – бързо, прозрачно и сигурно.
          </p>
          <div class="hero-actions">
            <button class="btn ghost" routerLink="/requests">Прегледай публикации</button>
            <button class="btn ghost" routerLink="/about">Научи повече</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="hero-notification hero-notification--primary">
            <div class="hero-notification-icon">
              <span class="material-symbol">notifications</span>
            </div>
            <div class="hero-notification-text">
              <div class="title">Ново запитване</div>
              <div class="subtitle">Получихте нова публикация от партньор</div>
            </div>
          </div>

          <div class="hero-notification hero-notification--secondary">
            <div class="hero-notification-icon">
              <span class="material-symbol">chat</span>
            </div>
            <div class="hero-notification-text">
              <div class="title">Съобщение</div>
              <div class="subtitle">Нов отговор по ваша оферта</div>
            </div>
          </div>

          <div class="hero-orbit"></div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="feature">
        <div class="feature-icon">
          <span class="material-symbol">insights</span>
        </div>
        <h3>Интелигентни съвпадения</h3>
        <p>Получавате предложения само от релевантни партньори и доставчици.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <span class="material-symbol">handshake</span>
        </div>
        <h3>Прозрачни сделки</h3>
        <p>Управлявайте оферти, договаряне и финализиране на едно място.</p>
      </div>
      <div class="feature">
        <div class="feature-icon">
          <span class="material-symbol">lock</span>
        </div>
        <h3>Сигурна платформа</h3>
        <p>Защитени данни и надеждни партньори за вашия бизнес.</p>
      </div>
    </section>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {}
