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
import { Company } from '../../model/company';
import { CompanyService } from '../../service/company.service';

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
    userCompanies: Company[] = [];
    responsesByRequestId: { [requestId: string]: any[] } = {};
    expandedRequestId: string | null = null;

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

  constructor(private router: Router, private companyRequestService: CompanyRequestService, private companyService: CompanyService) {
    // this.loadRequests(); // Remove initial call from constructor
  }

  ngOnInit(): void {
    this.loadRequests();
    this.companyService.getAllCompaniesByUser().subscribe({
      next: (companies) => {
        this.userCompanies = companies;
      },
      error: (err) => {
        this.userCompanies = [];
      }
    });
    // Listen to route changes and toggle the button visibility
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.loadRequests();
        this.showCancelButton = this.router.url.includes('/create');
      });
  }

  getCompanyNameById(id: string): string {
    const company = this.userCompanies.find(c => String(c.id) === String(id));
    return company ? company.name +  ' (' + company.vatNumber + ')' : '';
  }

  loadRequests(): void {
    this.companyRequestService.getAllRequestsByUser().subscribe({
      next: (data: any[]) => {
        // data is now array of {request, responses}
        this.companyRequests = data.map(item => {
          const req = item.request;
          let activeFrom = req.activeFrom;
          let activeTo = req.activeTo;
          if (Array.isArray(activeFrom) && activeFrom.length >= 3) {
            activeFrom = new Date(activeFrom[0], activeFrom[1] - 1, activeFrom[2], activeFrom[3] || 0, activeFrom[4] || 0);
          } else if (typeof activeFrom === 'string' || typeof activeFrom === 'number') {
            activeFrom = new Date(activeFrom);
          }
          if (Array.isArray(activeTo) && activeTo.length >= 3) {
            activeTo = new Date(activeTo[0], activeTo[1] - 1, activeTo[2], activeTo[3] || 0, activeTo[4] || 0);
          } else if (typeof activeTo === 'string' || typeof activeTo === 'number') {
            activeTo = new Date(activeTo);
          }
          // Store responses by request id
          this.responsesByRequestId[req.id] = item.responses || [];
          return {
            ...req,
            activeFrom,
            activeTo
          };
        });
        // If you want to keep responses for each request:
        // this.responsesByRequestId = Object.fromEntries(data.map(item => [item.request.id, item.responses]));
      },
      error: (error: Error) => {
        console.error('Error fetching companies:', error);
      }
    });
  }

  toggleResponses(requestId: string): void {
    this.expandedRequestId = this.expandedRequestId === requestId ? null : requestId;
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

  getUnitLabel(unit: string): string {
    switch (unit) {
      case 'count': return 'Бр.';
      case 'box': return 'Кашон/и';
      case 'pallet': return 'Пале/та';
      default: return unit || '';
    }
  }
}
