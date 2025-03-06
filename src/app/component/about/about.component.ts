import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  standalone: true,
  // styleUrls: ['./about.component.css'],
  imports: [CommonModule, FormsModule]
})
export class AboutComponent {
  // Add your component logic here
}