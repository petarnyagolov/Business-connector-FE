import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationConfig {
  message: string;
  type: NotificationType;
  duration?: number;
  title?: string;
  autoClose?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() {
    // Инициализираме CSS стиловете при зареждане на сервиса
    this.initializeStyles();
  }

  // Основен метод за показване на notification
  show(config: NotificationConfig): void {
    this.createToastNotification(config);
  }

  // Convenience методи
  success(message: string, title?: string, duration: number = 4000): void {
    this.show({ message, type: 'success', title, duration });
  }

  error(message: string, title?: string, duration: number = 6000): void {
    this.show({ message, type: 'error', title, duration });
  }

  warning(message: string, title?: string, duration: number = 5000): void {
    this.show({ message, type: 'warning', title, duration });
  }

  info(message: string, title?: string, duration: number = 4000): void {
    this.show({ message, type: 'info', title, duration });
  }

  private createToastNotification(config: NotificationConfig): void {
    // Създаваме контейнер за notifications ако не съществува
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    // Определяме цветовата схема
    const colors = this.getColorScheme(config.type);

    // Създаваме toast елемент
    const toast = document.createElement('div');
    toast.style.cssText = `
      min-width: 320px;
      max-width: 500px;
      padding: 16px 20px;
      background: ${colors.background};
      color: ${colors.text};
      border-left: 4px solid ${colors.accent};
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      font-size: 14px;
      line-height: 1.5;
      position: relative;
      animation: slideInRight 0.3s ease-out;
      cursor: pointer;
      word-wrap: break-word;
      pointer-events: auto;
      backdrop-filter: blur(10px);
    `;

    // Определяме иконата
    const icon = this.getIcon(config.type);
    const title = config.title || this.getDefaultTitle(config.type);

    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px; flex-shrink: 0; margin-top: 2px;">${icon}</span>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 6px; color: ${colors.accent};">
            ${title}
          </div>
          <div style="color: ${colors.text};">${config.message}</div>
        </div>
        <button class="toast-close-btn" style="
          background: none;
          border: none;
          color: ${colors.closeButton};
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 8px;
          line-height: 1;
          flex-shrink: 0;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        " onmouseover="this.style.backgroundColor='rgba(0,0,0,0.1)'" 
           onmouseout="this.style.backgroundColor='transparent'"
           onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="progress-bar" style="
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background: ${colors.accent};
        border-radius: 0 0 8px 8px;
        animation: progressBar ${(config.duration || 4000) / 1000}s linear;
        transform-origin: left center;
      "></div>
    `;

    // Добавяме към контейнера
    container.appendChild(toast);

    // Автоматично премахване
    const duration = config.autoClose !== false ? (config.duration || 4000) : 0;
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }

    // Премахване при клик на toast-а
    toast.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('toast-close-btn')) {
        this.removeToast(toast);
      }
    });
  }

  private removeToast(toast: HTMLElement): void {
    if (toast.parentNode) {
      toast.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }

  private getColorScheme(type: NotificationType) {
    switch (type) {
      case 'success':
        return {
          background: '#f8f9fa',
          text: '#155724',
          accent: '#28a745',
          closeButton: '#155724'
        };
      case 'error':
        return {
          background: '#f8f9fa',
          text: '#721c24',
          accent: '#dc3545',
          closeButton: '#721c24'
        };
      case 'warning':
        return {
          background: '#f8f9fa',
          text: '#856404',
          accent: '#ffc107',
          closeButton: '#856404'
        };
      case 'info':
      default:
        return {
          background: '#f8f9fa',
          text: '#0c5460',
          accent: '#17a2b8',
          closeButton: '#0c5460'
        };
    }
  }

  private getIcon(type: NotificationType): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  private getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case 'success':
        return 'Успех';
      case 'error':
        return 'Грешка';
      case 'warning':
        return 'Внимание';
      case 'info':
      default:
        return 'Информация';
    }
  }

  private initializeStyles(): void {
    // Добавяме CSS анимации ако не съществуват
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes progressBar {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}
