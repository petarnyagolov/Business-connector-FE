import { Routes } from '@angular/router';
import { CardPageComponent } from './card-page/card-page.component';
import { RegisterComponent } from './component/register/register.component';
import { LoginComponent } from './component/login/login.component';
import { AboutComponent } from './component/about/about.component';
import { CreateCompanyComponent } from './component/create-company/create-company.component';
import { CompanyListComponent } from './company-list/company-list.component';
import { AuthGuard } from './interceptor/auth.guard';
import { UserCompaniesComponent } from './component/user-companies/user-companies.component';
import { CompanyDetailComponent } from './company-detail/company-detail.component';
import { CompanyRequestsComponent } from './component/company-requests/company-requests.component';
import { RequestDetailsComponent } from './component/request-details/request-details.component';
import { UserRequestsComponent } from './component/user-requests/user-requests.component';
import { UserResponsesComponent } from './component/user-responses/user-responses.component';
import { EmailVerificationComponent } from './component/email-verification/email-verification.component'; // Added
import { HomeComponent } from './component/home/home.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: EmailVerificationComponent }, // route за email verification
  { path: 'about', component: AboutComponent },
  { path: '', pathMatch: 'full', redirectTo: '/companies' },
  { path: 'list', component: CompanyListComponent },
  { path: 'companies', component: CompanyListComponent },
  { path: 'companies/:id', component: CompanyDetailComponent },
  {
    path: 'user/companies',
    component: UserCompaniesComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'create', component: CreateCompanyComponent, canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'requests', component: CompanyRequestsComponent, canActivate: [AuthGuard]
  },
  {
    path: 'requests/:id', component: RequestDetailsComponent, canActivate: [AuthGuard]
  },
  {
    path: 'my-requests', component: UserRequestsComponent, canActivate: [AuthGuard],
    children: [
      { path: 'create', loadComponent: () => import('./component/create-request/create-request.component').then(m => m.CreateRequestComponent), canActivate: [AuthGuard] }
    ]
  },
  { path: 'my-responses', component: UserResponsesComponent, canActivate: [AuthGuard] },
  {
    path: 'user/companies/update/:vatNumber',
    loadComponent: () => import('./component/company-form/company-form-update-wrapper.component').then(m => m.CompanyFormUpdateWrapperComponent)
  },
];