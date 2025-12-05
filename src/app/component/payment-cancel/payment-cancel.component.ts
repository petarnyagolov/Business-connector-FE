import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  templateUrl: './payment-cancel.component.html',
  styleUrl: './payment-cancel.component.scss'
})
export class PaymentCancelComponent { }
