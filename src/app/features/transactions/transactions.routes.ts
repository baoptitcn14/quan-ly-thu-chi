import { Routes } from '@angular/router';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';

export const TRANSACTION_ROUTES: Routes = [
  {
    path: '',
    component: TransactionListComponent
  },
  {
    path: 'new',
    component: TransactionFormComponent
  },
  {
    path: 'edit/:id',
    component: TransactionFormComponent
  }
]; 