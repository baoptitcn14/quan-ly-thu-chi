import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SavingGoalService, SavingGoal } from '../../../../core/services/saving-goal.service';
import { ContributionDialogComponent } from '../contribution-dialog/contribution-dialog.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { TimestampPipe } from '../../../../shared/pipes/timestamp.pipe';

@Component({
  selector: 'app-saving-goal-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RouterModule,
    MatDialogModule,
    TimestampPipe
  ],
  template: `
    <div class="goals-container">
      <div class="header">
        <h2>Mục tiêu tiết kiệm</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Thêm mục tiêu
        </button>
      </div>

      <div class="goals-grid">
        @for (goal of savingGoals; track goal.id) {
          <mat-card [ngClass]="goal.status">
            <mat-card-header>
              <mat-icon [ngClass]="goal.status">
                {{getStatusIcon(goal.status)}}
              </mat-icon>
              <mat-card-title>{{goal.name}}</mat-card-title>
              <mat-card-subtitle>
                Hạn: {{goal.deadline | timestamp | date:'dd/MM/yyyy'}}
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="goal-info">
                <div class="target">
                  <span class="label">Mục tiêu:</span>
                  <span class="value">{{goal.targetAmount | number:'1.0-0'}}đ</span>
                </div>
                <div class="current">
                  <span class="label">Đã tiết kiệm:</span>
                  <span class="value">{{goal.currentAmount | number:'1.0-0'}}đ</span>
                </div>
                <div class="remaining">
                  <span class="label">Còn thiếu:</span>
                  <span class="value">{{goal.remainingAmount | number:'1.0-0'}}đ</span>
                </div>
                <div class="monthly">
                  <span class="label">Cần tiết kiệm/tháng:</span>
                  <span class="value">{{goal.monthlyRequired | number:'1.0-0'}}đ</span>
                </div>
              </div>

              <mat-progress-bar
                [value]="goal.progress"
                [color]="getProgressColor(goal)"
                mode="determinate">
              </mat-progress-bar>

              <div class="progress-info">
                <span class="percentage">{{goal.progress | number:'1.0-0'}}%</span>
                <span class="days-left">Còn {{goal.remainingDays}} ngày</span>
              </div>
            </mat-card-content>

            <mat-card-actions align="end">
              <button mat-button (click)="addContribution(goal)">
                <mat-icon>add_circle</mat-icon>
                Thêm tiền
              </button>
              <button mat-button color="primary" [routerLink]="['edit', goal.id]">
                <mat-icon>edit</mat-icon>
                Sửa
              </button>
              <button mat-button color="warn" (click)="deleteGoal(goal.id!)">
                <mat-icon>delete</mat-icon>
                Xóa
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .goals-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;

        h2 {
          font-size: 1.5rem;
          font-weight: 500;
          color: #333;
        }
      }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;

        mat-card {
          &.active { border-left: 4px solid #2196f3; }
          &.completed { border-left: 4px solid #4caf50; }
          &.failed { border-left: 4px solid #f44336; }

          mat-card-header {
            margin-bottom: 1rem;

            mat-icon {
              margin-right: 0.5rem;
              &.active { color: #2196f3; }
              &.completed { color: #4caf50; }
              &.failed { color: #f44336; }
            }
          }

          .goal-info {
            margin: 1rem 0;
            
            .target, .current, .remaining, .monthly {
              display: flex;
              justify-content: space-between;
              margin: 0.5rem 0;
              font-size: 0.9rem;

              .label {
                color: #666;
              }

              .value {
                font-weight: 500;
              }
            }
          }

          mat-progress-bar {
            margin: 1rem 0;
          }

          .progress-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.875rem;
            color: #666;

            .percentage {
              font-weight: 500;
            }
          }

          mat-card-actions {
            padding: 0.5rem;
            button {
              mat-icon {
                margin-right: 0.25rem;
              }
            }
          }
        }
      }
    }

    @media (max-width: 600px) {
      .goals-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SavingGoalListComponent implements OnInit {
  savingGoals: SavingGoal[] = [];

  constructor(
    private savingGoalService: SavingGoalService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSavingGoals();
  }

  private loadSavingGoals() {
    this.savingGoalService.getSavingGoals().subscribe(goals => {
      this.savingGoals = goals;
    });
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return 'check_circle';
      case 'failed': return 'error';
      default: return 'schedule';
    }
  }

  getProgressColor(goal: SavingGoal): string {
    if (goal.status === 'completed') return 'primary';
    if (goal.status === 'failed') return 'warn';
    return 'accent';
  }

  async addContribution(goal: SavingGoal) {
    const dialogRef = this.dialog.open(ContributionDialogComponent, {
      width: '400px',
      data: { goalName: goal.name }
    });

    dialogRef.afterClosed().subscribe(async (amount: number) => {
      if (amount) {
        try {
          await this.savingGoalService.addContribution(goal.id!, amount);
        } catch (error) {
          console.error('Lỗi khi thêm tiền:', error);
        }
      }
    });
  }

  async deleteGoal(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: 'Bạn có chắc chắn muốn xóa mục tiêu này?'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.savingGoalService.deleteSavingGoal(id);
        } catch (error) {
          console.error('Lỗi khi xóa mục tiêu:', error);
        }
      }
    });
  }
} 