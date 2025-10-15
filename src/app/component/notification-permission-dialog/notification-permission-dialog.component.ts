import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-notification-permission-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <h2 mat-dialog-title>Разрешаване на известия</h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <div class="permission-icon">
          <mat-icon color="primary" class="large-icon">notifications_active</mat-icon>
        </div>
        
        <div class="browser-instructions">
          <h3>Как да активирате известия в браузъра</h3>
          
          <div class="instruction-set">
            <h4>За Chrome:</h4>
            <ol>
              <li>Кликнете върху иконата за заключване (🔒) до URL адреса</li>
              <li>Изберете "Известия" от менюто</li>
              <li>Променете от "Блокирани" на "Разрешени"</li>
              <li>Обновете страницата</li>
            </ol>
          </div>
          
          <div class="instruction-set">
            <h4>За Firefox:</h4>
            <ol>
              <li>Кликнете върху иконата за информация (i) до URL адреса</li>
              <li>Изберете "Разрешения за сайта"</li>
              <li>Променете настройката за "Известия" на "Разрешени"</li>
              <li>Обновете страницата</li>
            </ol>
          </div>
          
          <div class="instruction-set">
            <h4>За Edge:</h4>
            <ol>
              <li>Кликнете върху иконата за заключване (🔒) до URL адреса</li>
              <li>Изберете "Разрешения за сайта"</li>
              <li>Променете настройката за "Известия" на "Разрешени"</li>
              <li>Обновете страницата</li>
            </ol>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Затвори</button>
      <button mat-raised-button color="primary" (click)="refreshPage()">Обнови страницата</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-width: 500px;
    }
    
    .permission-icon {
      display: flex;
      justify-content: center;
      margin-bottom: 1rem;
    }
    
    .large-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
    }
    
    .browser-instructions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .instruction-set {
      background-color: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
    }
    
    h3 {
      margin-top: 0;
      color: #333;
    }
    
    h4 {
      margin: 0 0 0.5rem 0;
      color: #444;
    }
    
    ol {
      margin: 0;
      padding-left: 1.5rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
  `]
})
export class NotificationPermissionDialogComponent {
  constructor(public dialogRef: MatDialogRef<NotificationPermissionDialogComponent>) {}
  
  refreshPage(): void {
    window.location.reload();
  }
}