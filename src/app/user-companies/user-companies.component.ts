import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-user-companies',
  imports: [ RouterOutlet, RouterLink, CommonModule],
  templateUrl: './user-companies.component.html',
  styleUrl: './user-companies.component.scss',
  standalone: true
})
export class UserCompaniesComponent {

  
constructor(private router: Router) {}


  createCompany() {
    this.router.navigate(['/user/companies/create']);
  }
  

}
