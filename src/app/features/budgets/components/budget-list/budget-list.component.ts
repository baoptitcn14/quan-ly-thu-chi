import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterModule } from '@angular/router';
import { BudgetService, Budget } from '../../../../core/services/budget.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    RouterModule
  ],
  template: `
    <div class="budget-container">
      <div class="header">
        <h2>Quản lý ngân sách</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Thêm ngân sách
        </button>
      </div>

      <div class="budgets-grid">
        @for (budget of budgets; track budget.id) {
          <mat-card [ngClass]="budget.status">
            <mat-card-header>
              <mat-icon [color]="getStatusColor(budget.status)">
                {{getStatusIcon(budget.status)}}
              </mat-icon>
              <mat-card-title>{{budget.categoryName}}</mat-card-title>
              <mat-card-subtitle>
                {{getBudgetPeriodLabel(budget.period)}}
              </mat-card-subtitle>
            </mat-card-header>

            <mat-card-content>
              <div class="budget-info">
                <div class="amount">
                  <span class="label">Ngân sách:</span>
                  <span class="value">{{budget.amount | number:'1.0-0'}}đ</span>
                </div>
                <div class="spent">
                  <span class="label">Đã chi:</span>
                  <span class="value">{{budget.spent | number:'1.0-0'}}đ</span>
                </div>
                <div class="remaining">
                  <span class="label">Còn lại:</span>
                  <span class="value" [class.negative]="budget.remaining! < 0">
                    {{budget.remaining | number:'1.0-0'}}đ
                  </span>
                </div>
              </div>

              <div class="progress-bar">
                <div class="progress" 
                     [style.width.%]="getProgressPercentage(budget)"
                     [ngClass]="budget.status">
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions align="end">
              <button mat-button color="primary" 
                      [routerLink]="['edit', budget.id]">
                <mat-icon>edit</mat-icon>
                Sửa
              </button>
              <button mat-button color="warn" 
                      (click)="deleteBudget(budget.id!)">
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
    .budget-container {
      padding: 1rem;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .budgets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
      }

      mat-card {
        &.normal { border-left: 4px solid #4caf50; }
        &.warning { border-left: 4px solid #ff9800; }
        &.exceeded { border-left: 4px solid #f44336; }

        .budget-info {
          margin: 1rem 0;
          
          .amount, .spent, .remaining {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;

            .value {
              font-weight: 500;
              &.negative { color: #f44336; }
            }
          }
        }

        .progress-bar {
          height: 4px;
          background: #eee;
          border-radius: 2px;
          margin: 1rem 0;

          .progress {
            height: 100%;
            border-radius: 2px;
            transition: width 0.3s ease;

            &.normal { background: #4caf50; }
            &.warning { background: #ff9800; }
            &.exceeded { background: #f44336; }
          }
        }
      }
    }
  `]
})
export class BudgetListComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();
  budgets: Budget[] = [];

  constructor(
    private budgetService: BudgetService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const subscription = this.budgetService.getBudgets()
      .subscribe(budgets => {
        this.budgets = budgets;
      });
    this.subscriptions.add(subscription);
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  getStatusColor(status: string | undefined): string {
    switch(status) {
      case 'exceeded': return 'warn';
      case 'warning': return 'accent';
      default: return 'primary';
    }
  }

  getStatusIcon(status: string | undefined): string {
    switch(status) {
      case 'exceeded': return 'error';
      case 'warning': return 'warning';
      default: return 'check_circle';
    }
  }

  getBudgetPeriodLabel(period: string): string {
    const labels: { [key: string]: string } = {
      daily: 'Hàng ngày',
      weekly: 'Hàng tuần',
      monthly: 'Hàng tháng',
      yearly: 'Hàng năm'
    };
    return labels[period] || period;
  }

  getProgressPercentage(budget: Budget): number {
    if (!budget.spent || !budget.amount) return 0;
    const percentage = (budget.spent / budget.amount) * 100;
    return Math.min(percentage, 100);
  }

  async deleteBudget(id: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: 'Bạn có chắc chắn muốn xóa ngân sách này?',
        confirmText: 'Xóa',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.budgetService.deleteBudget(id);
        } catch (error) {
          console.error('Lỗi khi xóa ngân sách:', error);
        }
      }
    });
  }
} 