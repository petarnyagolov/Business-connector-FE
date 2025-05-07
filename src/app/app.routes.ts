import { Routes } from '@angular/router';
import { CardPageComponent } from './card-page/card-page.component';
import { RegisterComponent } from './component/register/register.component';
import { LoginComponent } from './component/login/login.component';
import { AboutComponent } from './component/about/about.component';
import { CreateCompanyComponent } from './component/create-company/create-company.component';
import { CompanyListComponent } from './company-list/company-list.component';
import { AuthGuard } from './interceptor/auth.guard';
import { UserCompaniesComponent } from './user-companies/user-companies.component';
import { CompanyDetailComponent } from './company-detail/company-detail.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'about', component: AboutComponent },
  { path: '', pathMatch: 'full', redirectTo: '/companies' },
  { path: 'list', component: CompanyListComponent },
  { path: 'companies', component: CompanyListComponent },
  { path: 'companies/:vatNumber', component: CompanyDetailComponent },
  {
    path: 'user/companies',
    component: UserCompaniesComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'create', component: CreateCompanyComponent, canActivate: [AuthGuard] }
    ]
  }
];