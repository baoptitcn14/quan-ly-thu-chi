import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../../../core/services/group.service';
import { Group } from '../../../../core/models/group.model';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { CreateGroupDialogComponent } from '../../../../shared/components/create-group-dialog/create-group-dialog.component';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule
  ],
  template: `
    <div class="groups-container">
      <div class="header">
        <h2>Nhóm chi tiêu</h2>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Tạo nhóm mới
        </button>
      </div>

      <div class="groups-grid">
        @for (group of groups$ | async; track group.id) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{group.name}}</mat-card-title>
              <mat-card-subtitle>
                {{group.members.length}} thành viên
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="group-stats">
                <div class="stat-item">
                  <span class="label">Tổng chi tiêu</span>
                  <span class="value">{{getGroupTotal(group.id!) | number:'1.0-0'}}đ</span>
                </div>
                <div class="stat-item">
                  <span class="label">Số dư của bạn</span>
                  <span class="value" [class.negative]="getMyBalance(group.id!) < 0">
                    {{getMyBalance(group.id!) | number:'1.0-0'}}đ
                  </span>
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions align="end">
              <button mat-button color="primary" [routerLink]="['/groups', group.id]">
                <mat-icon>visibility</mat-icon>
                Chi tiết
              </button>
              @if (isAdmin(group)) {
                <button mat-button color="warn" (click)="deleteGroup(group)">
                  <mat-icon>delete</mat-icon>
                  Xóa
                </button>
              }
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .groups-container {
      padding: 1rem;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .groups-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      mat-card {
        height: 100%;
        display: flex;
        flex-direction: column;

        mat-card-content {
          flex: 1;
        }

        .group-stats {
          margin: 1rem 0;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;

          .stat-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;

            .label {
              color: #64748b;
            }

            .value {
              font-weight: 500;
              color: #1e293b;

              &.negative {
                color: #ef4444;
              }
            }
          }
        }
      }
    }
  `]
})
export class GroupListComponent implements OnInit {
  groups$: Observable<Group[]>;
  groupBalances: { [groupId: string]: { total: number, myBalance: number } } = {};

  constructor(
    private groupService: GroupService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.groups$ = this.groupService.getUserGroups();
  }

  ngOnInit() {
    this.loadGroupStats();
  }

  private async loadGroupStats() {
    this.groups$.subscribe(groups => {
      groups.forEach(group => {
        // Lấy tổng chi tiêu và số dư của nhóm
        this.groupService.getGroupExpenses(group.id!).subscribe(expenses => {
          const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
          
          // Tính số dư của user hiện tại
          const userId = this.authService.getCurrentUserId();
          const myBalance = expenses.reduce((balance, exp) => {
            if (exp.paidBy === userId) {
              balance += exp.amount;
            }
            exp.splitBetween.forEach(split => {
              if (split.userId === userId) {
                balance -= split.amount;
              }
            });
            return balance;
          }, 0);

          this.groupBalances[group.id!] = { total, myBalance };
        });
      });
    });
  }

  getGroupTotal(groupId: string): number {
    return this.groupBalances[groupId]?.total || 0;
  }

  getMyBalance(groupId: string): number {
    return this.groupBalances[groupId]?.myBalance || 0;
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.createGroup(result);
      }
    });
  }

  async deleteGroup(group: Group) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xóa nhóm',
        message: `Bạn có chắc chắn muốn xóa nhóm "${group.name}"?`,
        confirmText: 'Xóa',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        try {
          await this.groupService.deleteGroup(group.id!);
        } catch (error) {
          console.error('Error deleting group:', error);
        }
      }
    });
  }

  isAdmin(group: Group): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return group.createdBy === currentUserId;
  }
} 