import { Routes } from '@angular/router';
import { BudgetListComponent } from './components/budget-list/budget-list.component';
import { BudgetFormComponent } from './components/budget-form/budget-form.component';

export const BUDGET_ROUTES: Routes = [
  {
    path: '',
    component: BudgetListComponent
  },
  {
    path: 'new',
    component: BudgetFormComponent
  },
  {
    path: 'edit/:id',
    component: BudgetFormComponent
  }
]; 