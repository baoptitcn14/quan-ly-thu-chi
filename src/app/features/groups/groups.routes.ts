import { Routes } from '@angular/router';
import { GroupListComponent } from './components/group-list/group-list.component';
import { GroupDetailComponent } from './components/group-detail/group-detail.component';

export const GROUP_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: GroupListComponent,
        title: 'Nhóm chi tiêu'
      },
      {
        path: ':id',
        component: GroupDetailComponent,
        title: 'Chi tiết nhóm'
      }
    ]
  }
]; 