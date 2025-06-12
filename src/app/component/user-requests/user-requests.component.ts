import { Component } from '@angular/core';
import { CompanyRequest } from '../../model/companyRequest';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule, MatCardContent, } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { CompanyRequestService } from '../../service/company-request.service';
import { filter } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-user-requests',
  imports: [RouterOutlet, RouterLink, CommonModule, MatGridListModule, MatCardModule, MatButtonModule, MatCardContent, MatIcon],
  templateUrl: './user-requests.component.html',
  styleUrl: './user-requests.component.scss',
  standalone: true
})
export class UserRequestsComponent {
    companyRequests: CompanyRequest[] = [];
    showCancelButton: boolean = false; 

  companyRequest: CompanyRequest = {
    id: '',
    title: '',
    description: '',
    requesterCompanyId: '',
    requesterName: '',
    pictures: [],
    requestType: '',
    status: '',
    activeFrom: new Date(),
    activeTo: new Date()

  };

  constructor(private router: Router, private companyRequestService: CompanyRequestService) {
    // this.loadRequests(); // Remove initial call from constructor
  }

  ngOnInit(): void {
    this.loadRequests();
    // Listen to route changes and toggle the button visibility
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadRequests();
        this.showCancelButton = this.router.url.includes('/create');
      });
  }

  loadRequests(): void {
    this.companyRequestService.getAllRequestsByUser().subscribe({
      next: (data: CompanyRequest[]) => {
        this.companyRequests = data.map(req => {
          let activeFrom = req.activeFrom;
          let activeTo = req.activeTo;
          // Ако е масив, конвертирай в Date, иначе остави както е
          if (Array.isArray(activeFrom) && activeFrom.length >= 3) {
            // JS Date: месеците са 0-based
            activeFrom = new Date(activeFrom[0], activeFrom[1] - 1, activeFrom[2], activeFrom[3] || 0, activeFrom[4] || 0);
          } else if (typeof activeFrom === 'string' || typeof activeFrom === 'number') {
            activeFrom = new Date(activeFrom);
          }
          if (Array.isArray(activeTo) && activeTo.length >= 3) {
            activeTo = new Date(activeTo[0], activeTo[1] - 1, activeTo[2], activeTo[3] || 0, activeTo[4] || 0);
          } else if (typeof activeTo === 'string' || typeof activeTo === 'number') {
            activeTo = new Date(activeTo);
          }
          return {
            ...req,
            activeFrom,
            activeTo
          };
        });
      },
      error: (error: Error) => {
        console.error('Error fetching companies:', error);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.companyRequest.pictures = Array.from(input.files); // Convert FileList to File[]
    }
  }

  createRequest() {
    console.log('createRequest() called'); // Debugging
    // this.showCancelButton = true;
    console.log('showCancelButton:', this.showCancelButton); // Debugging
    this.router.navigate(['/requests/my-requests/create']);
  }
  
  onCancel() {
    console.log('onCancel() called'); // Debugging
    // this.showCancelButton = false;
    console.log('showCancelButton:', this.showCancelButton); // Debugging
    this.router.navigate(['/requests/my-requests']);
    
  }
  getGridColumns(): number {
    if (this.companyRequests.length === 1) {
      return 1; // One big card
    } else if (this.companyRequests.length === 2) {
      return 2; // Two middle-sized cards
    } else {
      return 3; // Three smaller cards
    }
  }

  getRowHeight(): string {
    if (this.companyRequests.length === 1) {
      return '4:3'; // Taller card for a single company
    } else if (this.companyRequests.length === 2) {
      return '3:2'; // Medium height for two companies
    } else {
      return '2:1'; // Shorter cards for three or more companies
    }
  }

  getColSpan(): number {
    if (this.companyRequests.length === 1) {
      return 1; // Single card spans the full width
    } else {
      return 1; // Each card spans one column
    }
  }

  getRowSpan(): number {
    if (this.companyRequests.length === 1) {
      return 2;
    } else if (this.companyRequests.length === 2) {
      return 2;
    } else {
      return 2; // беше 1, но това ще даде повече височина
    }
  }
}
