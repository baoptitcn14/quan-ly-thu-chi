import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import {
  TransactionService,
  Transaction,
} from '../../../../core/services/transaction.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatMenuModule,
    MatDialogModule,
  ],
  template: `
    <div class="transactions-container">
      <div class="header">
        <h2>Danh sách giao dịch</h2>
        <button mat-raised-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon>
          Thêm giao dịch
        </button>
      </div>

      <mat-card class="transactions-list">
        @for (transaction of transactions; track transaction.id) {
        <div class="transaction-item">
          <div class="info">
            <h3>{{ transaction.description }}</h3>
            <span class="category">{{ transaction.categoryName }}</span>
          </div>
          <div class="actions">
            <span
              [class.expense]="transaction.type === 'expense'"
              class="amount"
            >
              {{ transaction.amount | number : '1.0-0' }}đ
            </span>
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editTransaction(transaction)">
                <mat-icon>edit</mat-icon>
                <span>Sửa</span>
              </button>
              <button mat-menu-item (click)="deleteTransaction(transaction.id)">
                <mat-icon color="warn">delete</mat-icon>
                <span>Xóa</span>
              </button>
            </mat-menu>
          </div>
        </div>
        <mat-divider></mat-divider>
        }
      </mat-card>
    </div>
  `,
  styles: [
    `
      .transactions-container {
        padding: 1rem;
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .transactions-list {
          .transaction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            &:hover {
              background: rgba(0, 0, 0, 0.02);
            }
            .info {
              h3 {
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
              }
              .category {
                color: rgba(0, 0, 0, 0.6);
                font-size: 0.875rem;
              }
            }
            .actions {
              display: flex;
              align-items: center;
              gap: 1rem;
              .amount {
                font-weight: 500;
                color: #00b050;

                &.expense {
                  color: #f44336;
                }
              }
            }
          }
        }
      }
    `,
  ],
})
export class TransactionListComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  private subscriptions = new Subscription();

  constructor(
    private transactionService: TransactionService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  private loadTransactions() {
    const subscription = this.transactionService
      .getTransactions()
      .subscribe((data) => {
        this.transactions = data;
      });
    this.subscriptions.add(subscription);
  }

  editTransaction(transaction: Transaction) {
    // Chuyển hướng đến trang chỉnh sửa với ID của giao dịch
    this.router.navigate(['/transactions/edit', transaction.id], {
      state: { transaction }, // Truyền dữ liệu giao dịch qua state
    });
  }

  async deleteTransaction(id: string | undefined) {
    if (!id) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Xác nhận xóa',
        message: 'Bạn có chắc chắn muốn xóa giao dịch này?',
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result) {
        try {
          await this.transactionService.deleteTransaction(id);
          this.loadTransactions();
        } catch (error) {
          console.error('Error deleting transaction:', error);
        }
      }
    });
  }
}
