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

    // Определяме иконата и title
    const icon = this.getIcon(config.type);
    const title = config.title || this.getDefaultTitle(config.type);

    // SECURITY FIX: Escape HTML за да избегнем XSS
    const escapedTitle = this.escapeHtml(title);
    const escapedMessage = this.escapeHtml(config.message);

    // Създаваме структурата със DOM методи вместо innerHTML
    const contentWrapper = document.createElement('div');
    contentWrapper.style.cssText = 'display: flex; align-items: flex-start; gap: 12px;';

    const iconSpan = document.createElement('span');
    iconSpan.style.cssText = 'font-size: 20px; flex-shrink: 0; margin-top: 2px;';
    iconSpan.textContent = icon;

    const textContainer = document.createElement('div');
    textContainer.style.cssText = 'flex: 1;';

    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `font-weight: 600; margin-bottom: 6px; color: ${colors.accent};`;
    titleDiv.textContent = title;

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `color: ${colors.text};`;
    messageDiv.textContent = config.message;

    textContainer.appendChild(titleDiv);
    textContainer.appendChild(messageDiv);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close-btn';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
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
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = 'rgba(0,0,0,0.1)';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = 'transparent';
    closeBtn.onclick = () => toast.remove();

    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressBar.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: ${colors.accent};
      border-radius: 0 0 8px 8px;
      animation: progressBar ${(config.duration || 4000) / 1000}s linear;
      transform-origin: left center;
    `;

    contentWrapper.appendChild(iconSpan);
    contentWrapper.appendChild(textContainer);
    contentWrapper.appendChild(closeBtn);

    toast.appendChild(contentWrapper);
    toast.appendChild(progressBar);

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

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
