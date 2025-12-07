import { Component, Inject, OnInit, OnDestroy, SecurityContext } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface PaymentDialogData {
  paymentUrl: string;
  packageInfo: {
    name: string;
    credits: number;
    price: number;
    currency: string;
  };
}

@Component({
  selector: 'app-epay-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>credit_card</mat-icon>
          Плащане чрез ePay.bg
        </h2>
        <button mat-icon-button (click)="onCancel()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" mat-dialog-content>
        <div class="package-info">
          <p><strong>Пакет:</strong> {{ data.packageInfo.name }}</p>
          <p><strong>Кредити:</strong> {{ data.packageInfo.credits }}</p>
          <p><strong>Сума:</strong> {{ data.packageInfo.price }} {{ data.packageInfo.currency }}</p>
        </div>

        @if (isLoading) {
          <div class="loading-overlay">
            <mat-spinner></mat-spinner>
            <p>Зареждане на страницата за плащане...</p>
          </div>
        }

        <iframe
          #paymentFrame
          [src]="safePaymentUrl"
          (load)="onIframeLoad()"
          frameborder="0"
          class="payment-iframe"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        ></iframe>
      </div>

      <div class="dialog-footer" mat-dialog-actions>
        <p class="security-note">
          <mat-icon>lock</mat-icon>
          Сигурно плащане чрез ePay.bg - лицензиран платежен оператор от БНБ
        </p>
        <button mat-button (click)="onCancel()" color="warn">
          Откажи плащането
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-dialog {
      display: flex;
      flex-direction: column;
      height: 100%;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
    }

    .close-button {
      margin-left: auto;
    }

    .dialog-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 !important;
      overflow: hidden;
      position: relative;
    }

    .package-info {
      padding: 16px 24px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .package-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
    }

    .loading-overlay p {
      margin: 0;
      color: #666;
    }

    .payment-iframe {
      flex: 1;
      width: 100%;
      min-height: 400px;
      border: none;
    }

    .dialog-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }

    .security-note {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      color: #4caf50;
      font-size: 13px;
    }

    .security-note mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    @media (max-width: 768px) {
      .package-info {
        font-size: 12px;
      }

      .dialog-header h2 {
        font-size: 18px;
      }

      .security-note {
        font-size: 11px;
      }
    }
  `]
})
export class EpayPaymentDialogComponent implements OnInit, OnDestroy {
  safePaymentUrl: SafeResourceUrl;
  isLoading = true;
  private messageListener: ((event: MessageEvent) => void) | null = null;

  constructor(
    public dialogRef: MatDialogRef<EpayPaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize the payment URL for iframe
    this.safePaymentUrl = this.sanitizer.bypassSecurityTrustResourceUrl(data.paymentUrl);
  }

  ngOnInit() {
    // Listen for messages from the ePay iframe (if they support postMessage)
    this.messageListener = (event: MessageEvent) => {
      // Only accept messages from ePay domain
      if (!event.origin.includes('epay.bg')) {
        return;
      }

      console.log('📨 Message from ePay iframe:', event.data);

      // Check for success/cancel messages
      if (event.data?.status === 'success' || event.data?.type === 'payment-success') {
        this.onPaymentSuccess();
      } else if (event.data?.status === 'cancel' || event.data?.type === 'payment-cancel') {
        this.onCancel();
      }
    };

    window.addEventListener('message', this.messageListener);

    // Also monitor URL changes in iframe (fallback detection)
    this.startUrlMonitoring();
  }

  ngOnDestroy() {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  onIframeLoad() {
    this.isLoading = false;
    console.log('✅ ePay iframe loaded successfully');
  }

  onCancel() {
    const confirmed = confirm('Сигурни ли сте, че искате да откажете плащането?');
    if (confirmed) {
      this.dialogRef.close({ success: false, cancelled: true });
    }
  }

  onPaymentSuccess() {
    console.log('🎉 Payment successful!');
    this.dialogRef.close({ success: true });
  }

  private startUrlMonitoring() {
    // Monitor for URL changes that indicate payment completion
    // This is a fallback if ePay doesn't use postMessage
    const checkInterval = setInterval(() => {
      try {
        const iframe = document.querySelector('.payment-iframe') as HTMLIFrameElement;
        if (!iframe || !iframe.contentWindow) {
          return;
        }

        // Try to read the iframe URL (will fail if cross-origin)
        const iframeUrl = iframe.contentWindow.location.href;
        
        // Check if redirected to success page
        if (iframeUrl.includes('/payment-success') || iframeUrl.includes('status=success')) {
          clearInterval(checkInterval);
          this.onPaymentSuccess();
        } else if (iframeUrl.includes('/payment-cancel') || iframeUrl.includes('status=cancel')) {
          clearInterval(checkInterval);
          this.onCancel();
        }
      } catch (e) {
        // Cross-origin error - expected, ignore
      }
    }, 1000);

    // Clean up interval after 30 minutes
    setTimeout(() => clearInterval(checkInterval), 30 * 60 * 1000);
  }
}
