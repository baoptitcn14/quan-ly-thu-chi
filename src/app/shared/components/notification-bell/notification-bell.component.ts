import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../core/services/notification.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatBadgeModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    RouterModule,
    MatTooltipModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="menu">
      <mat-icon [matBadge]="unreadCount" 
                [matBadgeHidden]="unreadCount === 0"
                matBadgeColor="warn">
        notifications
      </mat-icon>
    </button>

    <mat-menu #menu="matMenu" class="notification-menu">
      <div class="notification-header">
        <h3>Thông báo</h3>
        <div class="actions">
          @if (unreadCount > 0) {
            <button mat-icon-button (click)="markAllAsRead()" matTooltip="Đánh dấu tất cả là đã đọc">
              <mat-icon>mark_email_read</mat-icon>
            </button>
          }
          @if (notifications.length > 0) {
            <button mat-icon-button (click)="clearReadNotifications()" matTooltip="Xóa thông báo đã đọc">
              <mat-icon>delete_sweep</mat-icon>
            </button>
          }
        </div>
      </div>

      @if (notifications.length === 0) {
        <div class="empty-state">
          <p>Không có thông báo mới</p>
        </div>
      } @else {
        @for (notification of notifications; track notification.id) {
          <div class="notification-item" 
               [class.unread]="!notification.read"
               (click)="onNotificationClick(notification)">
            <mat-icon [style.color]="getIconColor(notification)">
              {{getIcon(notification)}}
            </mat-icon>
            <div class="content">
              <div class="title">{{notification.title}}</div>
              <div class="message">{{notification.message}}</div>
              <div class="time">{{notification.createdAt | date:'HH:mm dd/MM/yyyy'}}</div>
            </div>
          </div>
        }
      }
    </mat-menu>
  `,
  styles: [`
    .notification-menu {
      min-width: 360px;
      max-width: 400px;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;

      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }

    .notification-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      &.unread {
        background: #f0f9ff;

        .title {
          font-weight: 600;
        }
      }

      mat-icon {
        margin-top: 0.25rem;
      }

      .content {
        flex: 1;

        .title {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }

        .message {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        .time {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }
    }

    .notification-bell {
      button {
        min-width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f8fafc;
        border: none;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        &:hover {
          background: #e0f2fe;
          
          mat-icon {
            color: #0284c7;
          }
        }

        mat-icon {
          color: #64748b;
          transition: color 0.2s ease;
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          min-width: 18px;
          height: 18px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
        }
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount = 0;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
      this.unreadCount = notifications.filter(n => !n.read).length;
    });
  }

  getIcon(notification: any): string {
    switch (notification.type) {
      case 'overspending':
        return 'warning';
      case 'category_alert':
        return 'trending_up';
      case 'saving_goal':
        return 'savings';
      default:
        return 'notifications';
    }
  }

  getIconColor(notification: any): string {
    switch (notification.type) {
      case 'overspending':
        return '#ef4444';
      case 'category_alert':
        return '#f59e0b';
      case 'saving_goal':
        return '#10b981';
      default:
        return '#64748b';
    }
  }

  async onNotificationClick(notification: any) {
    if (!notification.read) {
      await this.notificationService.markAsRead(notification.id);
    }

    if (notification.type === 'payment_reminder') {
      // Navigate to expense detail
      // this.router.navigate(['/groups', notification.groupId, 'expenses', notification.expenseId]);
    }
  }

  async markAllAsRead() {
    await this.notificationService.markAllAsRead();
  }

  async clearReadNotifications() {
    await this.notificationService.clearReadNotifications();
  }
} 