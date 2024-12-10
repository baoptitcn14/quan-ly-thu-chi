import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes')
      .then(m => m.DASHBOARD_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'transactions',
    loadChildren: () => import('./features/transactions/transactions.routes')
      .then(m => m.TRANSACTION_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.routes')
      .then(m => m.REPORTS_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'budgets',
    loadChildren: () => import('./features/budgets/budgets.routes')
      .then(m => m.BUDGET_ROUTES)
  },
  {
    path: 'analytics',
    loadChildren: () => import('./features/analytics/analytics.routes')
      .then(m => m.ANALYTICS_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'saving-goals',
    loadChildren: () => import('./features/saving-goals/saving-goals.routes')
      .then(m => m.SAVING_GOALS_ROUTES),
    canActivate: [AuthGuard]
  },
  {
    path: 'groups',
    loadChildren: () => import('./features/groups/groups.routes')
      .then(m => m.GROUP_ROUTES),
    canActivate: [AuthGuard]
  }
];
