import { Routes } from '@angular/router';
import { SavingGoalListComponent } from './components/saving-goal-list/saving-goal-list.component';
import { SavingGoalFormComponent } from './components/saving-goal-form/saving-goal-form.component';

export const SAVING_GOALS_ROUTES: Routes = [
  {
    path: '',
    component: SavingGoalListComponent
  },
  {
    path: 'new',
    component: SavingGoalFormComponent
  },
  {
    path: 'edit/:id',
    component: SavingGoalFormComponent
  }
]; 