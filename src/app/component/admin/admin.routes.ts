import { Routes } from '@angular/router';
import { AdminGuard } from '../../guard/admin.guard';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { CreditPackagesComponent } from './credit-packages/credit-packages.component';
import { ManualCreditsComponent } from './manual-credits/manual-credits.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'credit-packages',
        pathMatch: 'full'
      },
      {
        path: 'credit-packages',
        component: CreditPackagesComponent,
        title: 'Управление на кредитни пакети - Admin'
      },
      {
        path: 'manual-credits',
        component: ManualCreditsComponent,
        title: 'Бонус кредити - Admin'
      },
      {
        path: 'companies',
        loadComponent: () => import('../../company-list/company-list.component').then(m => m.CompanyListComponent),
        title: 'Всички компании - Admin'
      }
    ]
  }
];
