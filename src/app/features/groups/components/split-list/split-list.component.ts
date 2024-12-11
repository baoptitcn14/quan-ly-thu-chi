import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationService } from '../../../../core/services/notification.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-split-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="split-list">
      <h5 class="split-title">
        Chi tiết chia tiền
        @if (!allPaid) {
          <button mat-icon-button 
                  class="remind-button" 
                  (click)="sendReminders()"
                  matTooltip="Gửi nhắc nhở thanh toán"
                  matTooltipPosition="left">
            <mat-icon>notifications</mat-icon>
          </button>
        }
      </h5>
      @for (split of splits; track split.userId) {
      <div class="split-item" [class.paid]="split.status === 'paid'">
        <div class="user-info">
          <div class="avatar">{{ split.displayName[0] }}</div>
          <span class="name">{{ split.displayName }}</span>
        </div>
        <div class="split-details">
          <span class="amount">{{ split.amount | number : '1.0-0' }}đ</span>
          <mat-icon
            class="status-icon"
            [class.pending]="split.status !== 'paid'"
            [matTooltip]="
              split.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
            "
          >
            {{ split.status === 'paid' ? 'check_circle' : 'pending' }}
          </mat-icon>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .split-list {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        border: 1px solid #e2e8f0;

        .split-title {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 1rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .remind-button {
            width: 32px;
            height: 32px;
            transition: all 0.3s ease;
            border: none;
            background: transparent;
            border-radius: 50%;
            cursor: pointer;
            
            &::before {
              display: none;
            }
            
            mat-icon {
              color: #94a3b8;
              transition: all 0.3s ease;
            }

            &:hover {
              background: rgba(59, 130, 246, 0.1);
              
              mat-icon {
                color: #3b82f6;
                animation: gentle-shake 0.5s ease;
              }
            }
          }
        }

        .split-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          border: 1px solid transparent;

          &:not(:last-child) {
            margin-bottom: 0.5rem;
          }

          &:hover {
            background: #f8fafc;
            border-color: #e2e8f0;
          }

          &.paid {
            background: #f0fdf4;

            .status-icon {
              color: #22c55e;
            }

            &:hover {
              background: #dcfce7;
            }
          }

          .user-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .avatar {
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #3b82f6;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 500;
              font-size: 0.875rem;
              text-transform: uppercase;
            }

            .name {
              font-weight: 500;
              color: #1e293b;
            }
          }

          .split-details {
            display: flex;
            align-items: center;
            gap: 1rem;

            .amount {
              font-weight: 600;
              color: #0f172a;
              font-size: 0.9375rem;
            }

            .status-icon {
              width: 20px;
              height: 20px;
              font-size: 20px;
              
              &.pending {
                color: #f59e0b;
              }
            }
          }
        }
      }

      @media (max-width: 480px) {
        .split-list {
          padding: 0.75rem;

          .split-item {
            padding: 0.5rem;

            .user-info {
              .avatar {
                width: 28px;
                height: 28px;
                font-size: 0.75rem;
              }

              .name {
                font-size: 0.875rem;
              }
            }

            .split-details {
              gap: 0.5rem;

              .amount {
                font-size: 0.875rem;
              }

              .status-icon {
                width: 18px;
                height: 18px;
                font-size: 18px;
              }
            }
          }
        }
      }

      @keyframes gentle-shake {
        0% { transform: rotate(0); }
        25% { transform: rotate(10deg); }
        50% { transform: rotate(-10deg); }
        75% { transform: rotate(5deg); }
        100% { transform: rotate(0); }
      }
    `,
  ],
})
export class SplitListComponent {
  @Input() splits: any[] = [];
  @Input() expenseId = '';
  @Input() groupId = '';
  @Input() expenseDesc = '';
  @Input() groupName = '';

  constructor(
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  get allPaid(): boolean {
    return this.splits.every((split) => split.status === 'paid');
  }

  async sendReminders() {
    try {
      const unpaidSplits = this.splits.filter((split) => split.status !== 'paid');
      for (const split of unpaidSplits) {
        await this.notificationService.sendPaymentReminder({
          userId: split.userId,
          expenseId: this.expenseId,
          amount: split.amount,
          groupId: this.groupId,
          groupName: this.groupName,
          expenseDesc: this.expenseDesc,
        });
      }
      
      // Hiển thị thông báo thành công
      this.snackBar.open(
        'Đã gửi nhắc nhở thanh toán thành công!', 
        'Đóng', 
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
          
        }
      );
    } catch (error) {
      // Hiển thị thông báo lỗi nếu có
      this.snackBar.open(
        'Có lỗi xảy ra khi gửi nhắc nhở thanh toán!', 
        'Đóng', 
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );
    }
  }
}
