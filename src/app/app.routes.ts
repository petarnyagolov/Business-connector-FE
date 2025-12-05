import { Routes } from '@angular/router';
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
import { EmailVerificationComponent } from './component/email-verification/email-verification.component'; // Added
import { HomeComponent } from './component/home/home.component';
import { PrivacyPolicyComponent } from './component/privacy-policy/privacy-policy.component';
import { CookiePolicyComponent } from './component/cookie-policy/cookie-policy.component';
import { PaymentSuccessComponent } from './component/payment-success/payment-success.component';
import { PaymentCancelComponent } from './component/payment-cancel/payment-cancel.component';

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: EmailVerificationComponent }, // route за email verification
  { path: 'about', component: AboutComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
  { path: 'cookies', component: CookiePolicyComponent },
  { path: 'payment/success', component: PaymentSuccessComponent },
  { path: 'payment/cancel', component: PaymentCancelComponent },
  { path: '', pathMatch: 'full', redirectTo: '/requests' },
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
    path: 'my-requests',
    loadComponent: () => import('./component/user-requests/user-requests.component').then(m => m.UserRequestsComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'create', loadComponent: () => import('./component/create-request/create-request.component').then(m => m.CreateRequestComponent), canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'my-responses',
    loadComponent: () => import('./component/user-responses/user-responses.component').then(m => m.UserResponsesComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'saved-requests',
    loadComponent: () => import('./component/saved-requests/saved-requests.component').then(m => m.SavedRequestsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./component/notifications/notifications.component').then(m => m.NotificationsComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'debug',
    loadComponent: () => import('./component/debug/debug.component').then(m => m.DebugComponent)
  },
];