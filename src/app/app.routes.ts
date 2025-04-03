import { Routes } from '@angular/router';
import { CardPageComponent } from './card-page/card-page.component';
import { CardStandaloneComponent } from './card-standalone.component';
import { RegisterComponent } from './component/register/register.component';
import { LoginComponent } from './component/login/login.component';
import { AboutComponent } from './component/about/about.component';
import { CreateCompanyComponent } from './component/create-company/create-company.component';
import { CompanyListComponent } from './company-list/company-list.component';
import { AuthGuard } from './interceptor/auth.guard';
import { UserCompaniesComponent } from './user-companies/user-companies.component';

export const routes: Routes = [
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  // { path: 'cards', component: CardPageComponent },
  { path: 'about', component: AboutComponent },
  { path: '', pathMatch: 'full', redirectTo: '/companies' },
  { path: 'list', component: CardStandaloneComponent },
  { path: 'companies', component: CompanyListComponent },
  {
    path: 'user/companies',
    component: UserCompaniesComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'create', component: CreateCompanyComponent, canActivate: [AuthGuard] }
    ]
  }
];