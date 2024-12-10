import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../../../core/services/group.service';
import { Group, GroupExpense, GroupMessage } from '../../../../core/models/group.model';
import { AddExpenseDialogComponent } from '../add-expense-dialog/add-expense-dialog.component';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { TimestampPipe } from '../../../../core/pipes/timestamp.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Category, CategoryService } from '../../../../core/services/category.service';
import { firstValueFrom } from 'rxjs';
import { GroupMessageService } from '../../../../core/services/group-message.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    TimestampPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="group-detail" *ngIf="group">
      <div class="header-section">
        <div class="group-info">
          <div class="group-title">
            <h2>{{group.name}}</h2>
            <span class="member-count">
              <mat-icon>group</mat-icon>
              {{group.members.length}} thành viên
            </span>
          </div>
          <p class="description">{{group.description}}</p>
          <div class="group-stats">
            <div class="stat-item">
              <span class="label">Tổng chi tiêu</span>
              <span class="value">{{getTotalExpenses() | number:'1.0-0'}}đ</span>
            </div>
            <div class="stat-item">
              <span class="label">Chi tiêu tháng này</span>
              <span class="value">{{getMonthlyExpenses() | number:'1.0-0'}}đ</span>
            </div>
          </div>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="addExpense()">
            <mat-icon>add</mat-icon>
            Thêm chi tiêu
          </button>
          <button mat-stroked-button 
                  *ngIf="isAdmin"
                  (click)="addMember()">
            <mat-icon>person_add</mat-icon>
            Thêm thành viên
          </button>
        </div>
      </div>

      <mat-tab-group animationDuration="200ms" class="content-tabs" mat-align-tabs="center">
        <!-- Tab Chi tiêu -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">receipt</mat-icon>
            Chi tiêu
          </ng-template>
          <div class="tab-content">
            <div class="expenses-container">
              <!-- <div class="header">
                <h3>Chi tiêu nhóm</h3>
                <button mat-raised-button 
                        color="primary"
                        *ngIf="isMember" 
                        (click)="addExpense()">
                  <mat-icon>add</mat-icon>
                  Thêm chi tiêu
                </button>
              </div> -->

              @if (expenses.length === 0) {
                <div class="empty-state">
                  <mat-icon>receipt_long</mat-icon>
                  <p>Chưa có chi tiêu nào</p>
                  <button mat-raised-button color="primary" (click)="addExpense()">
                    <mat-icon>add</mat-icon>
                    Thêm chi tiêu đầu tiên
                  </button>
                </div>
              } @else {
                <div class="expenses-list">
                  @for (expense of expenses; track expense.id) {
                    <mat-card class="expense-item">
                      <div class="expense-header">
                        <div class="category-badge">
                          <mat-icon>{{getCategoryIcon(expense.category)}}</mat-icon>
                          <span>{{getCategoryName(expense.category)}}</span>
                        </div>
                        <div class="actions">
                          @if (isAdmin || expense.paidBy === currentUserId) {
                            <button mat-icon-button 
                                    matTooltip="Sửa chi tiêu"
                                    (click)="editExpense(expense)">
                              <mat-icon>edit</mat-icon>
                            </button>
                            <button mat-icon-button 
                                    color="warn"
                                    matTooltip="Xóa chi tiêu"
                                    (click)="deleteExpense(expense)">
                              <mat-icon>delete</mat-icon>
                            </button>
                          }
                        </div>
                      </div>

                      <div class="expense-content">
                        <h4>{{expense.description}}</h4>
                        <div class="expense-details">
                          <div class="amount">
                            <span class="label" style="margin-right: 10px;">Số tiền:</span>
                            <span class="value">{{expense.amount | number:'1.0-0'}}đ</span>
                          </div>
                          <div class="paid-by">
                            <span class="label" style="margin-right: 10px;">Người trả:</span>
                            <span class="value">{{getPaidByName(expense)}}</span>
                          </div>
                          <div class="date">
                            <span class="label" style="margin-right: 10px;">Ngày:</span>
                            <span class="value">{{expense.date | date:'dd/MM/yyyy'}}</span>
                          </div>
                        </div>

                        <div class="split-info">
                          <h5>Chia cho:</h5>
                          <div class="split-list">
                            @for (split of expense.splitBetween; track split.userId) {
                              <div class="split-item" [class.paid]="split.status === 'paid'">
                                <span class="name">{{split.displayName}}</span>
                                <span class="amount">{{split.amount | number:'1.0-0'}}đ</span>
                                @if (split.status === 'pending') {
                                  <button mat-icon-button 
                                          class="remind-btn"
                                          matTooltip="Nhắc thanh toán"
                                          (click)="remindPayment(expense, split)">
                                    <mat-icon>notifications</mat-icon>
                                  </button>
                                } @else {
                                  <mat-icon class="status-icon">check_circle</mat-icon>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </mat-card>
                  }
                </div>
              }
            </div>
          </div>
        </mat-tab>

        <!-- Tab Thành viên -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">group</mat-icon>
            Thành viên
          </ng-template>
          <div class="tab-content">
            <div class="members-grid">
              @for (member of group.members; track member.userId) {
                <mat-card class="member-card" [class.admin-card]="member.role === 'admin'">
                  <div class="member-header">
                    <img [src]="member.photoURL || 'assets/default-avatar.svg'" 
                         [alt]="member.displayName"
                         class="member-avatar">
                    <div class="member-info">
                      <h3>{{member.displayName}}</h3>
                      <span class="role-badge" [class.admin]="member.role === 'admin'">
                        {{member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}}
                      </span>
                    </div>
                  </div>
                  <div class="member-stats">
                    <div class="stat">
                      <span class="label">Đã chi</span>
                      <span class="value">{{getMemberExpenses(member.userId) | number:'1.0-0'}}đ</span>
                    </div>
                    <div class="stat">
                      <span class="label">Số dư</span>
                      <span class="value" [class.negative]="getMemberBalance(member.userId) < 0">
                        {{getMemberBalance(member.userId) | number:'1.0-0'}}đ
                      </span>
                    </div>
                  </div>
                  <p class="joined-date">
                    <mat-icon>event</mat-icon>
                    Tham gia: {{member.joinedAt | TimestampPipe | date:'dd/MM/yyyy'}}
                  </p>
                  <div class="member-actions" *ngIf="isAdmin && member.role !== 'admin'">
                    <button mat-icon-button color="warn" 
                            (click)="removeMember(member.userId)"
                            matTooltip="Xóa thành viên">
                      <mat-icon>person_remove</mat-icon>
                    </button>
                  </div>
                </mat-card>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab label="Trò chuyện">
          <div class="chat-container">
            <div class="messages-list" #messagesList>
              @for (message of messages$ | async; track message.id) {
                <div class="message-item" [class.own-message]="message.userId === currentUserId">
                  <img [src]="message.photoURL || 'assets/default-avatar.svg'" 
                       [alt]="message.displayName"
                       class="avatar">
                  <div class="message-content">
                    <div class="message-header">
                      <span class="sender-name">{{message.displayName}}</span>
                      <span class="time">{{message.createdAt | TimestampPipe | date:'HH:mm'}}</span>
                    </div>
                    <div class="message-text">{{message.content}}</div>
                  </div>
                </div>
              }
            </div>

            <div class="message-input">
              <mat-form-field appearance="outline">
                <input matInput
                       [formControl]="messageCtrl"
                       placeholder="Nhập tin nhắn..."
                       (keyup.enter)="sendMessage()">
                <div class="input-actions" matSuffix>
                  <button mat-icon-button
                          type="button"
                          (click)="toggleEmojiPicker()">
                    <mat-icon>sentiment_satisfied_alt</mat-icon>
                  </button>
                  <button mat-icon-button
                          [disabled]="!messageCtrl.value"
                          (click)="sendMessage()">
                    <mat-icon>send</mat-icon>
                  </button>
                </div>
              </mat-form-field>
              
              <div class="emoji-picker" *ngIf="showEmojiPicker">
                <div class="emoji-list">
                  @for (emoji of emojis; track emoji) {
                    <button mat-icon-button (click)="addEmoji(emoji)">
                      {{emoji}}
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .group-detail {
      padding: 2rem;
      background: #f8fafc;
      min-height: calc(100vh - 64px);
    }

    .header-section {
      background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
      padding: 2rem;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border: 1px solid rgba(0,0,0,0.05);

      .group-info {
        .group-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;

          h2 {
            margin: 0;
            font-size: 1.75rem;
            color: #1e293b;
            font-weight: 600;
          }

          .member-count {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #f1f5f9;
            border-radius: 20px;
            color: #64748b;
            font-size: 0.875rem;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }

        .description {
          margin: 0 0 1.5rem;
          color: #64748b;
          font-size: 1rem;
          line-height: 1.5;
        }

        .group-stats {
          display: flex;
          gap: 2rem;

          .stat-item {
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;

            .label {
              display: block;
              color: #64748b;
              font-size: 0.875rem;
              margin-bottom: 0.5rem;
            }

            .value {
              color: #1e293b;
              font-size: 1.25rem;
              font-weight: 600;
            }
          }
        }
      }

      .actions {
        display: flex;
        gap: 1rem;

        button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 1.5rem;
          height: 44px;
          border-radius: 10px;
          width: 100%;
          
          mat-icon {
            margin-right: 0;
          }

          &[color="primary"] {
            background: #2563eb;
            &:hover {
              background: #1d4ed8;
            }
          }
        }
      }
    }

    .content-tabs {
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      
      ::ng-deep {
        .mat-mdc-tab-header {
          border-bottom: 1px solid #e2e8f0;
        }

        .mat-mdc-tab {
          height: 64px;
        }

        .tab-icon {
          margin-right: 0.5rem;
        }
      }
      
      .tab-content {
        padding: 2rem;
      }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #64748b;

      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      p {
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
      }
    }

    .expenses-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));

      .expense-card {
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        
        mat-card-header {
          padding: 1rem 1rem 0;
          
          mat-icon {
            color: #3b82f6;
            background: #eff6ff;
            padding: 8px;
            border-radius: 8px;
          }
        }

        .expense-info {
          margin: 1rem 0;
          
          .category-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: #f1f5f9;
            border-radius: 20px;
            margin-bottom: 1rem;
            
            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              color: #3b82f6;
            }

            span {
              font-size: 0.875rem;
              font-weight: 500;
              color: #1e293b;
            }
          }

          .details {
            .amount, .paid-by {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.5rem;
              
              .label {
                color: #64748b;
              }
              
              .value {
                font-weight: 500;
                color: #1e293b;
              }
            }
          }
        }

        .split-details {
          h4 {
            margin: 0 0 1rem;
            color: #1e293b;
            font-size: 1rem;
          }

          .split-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;

            .split-item {
              display: flex;
              align-items: center;
              padding: 0.75rem;
              background: #f8fafc;
              border-radius: 8px;
              
              &.paid {
                background: #f0fdf4;
              }

              .name {
                flex: 1;
                font-weight: 500;
              }

              .amount {
                margin: 0 1rem;
                color: #64748b;
              }

              .status-icon {
                color: #22c55e;
              }
            }
          }
        }
      }
    }

    .members-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

      .member-card {
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        transition: all 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
        }

        &.admin-card {
          background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
          border-color: #bfdbfe;
        }

        .member-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;

          .member-avatar {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            object-fit: cover;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }

          .member-info {
            h3 {
              margin: 0 0 0.5rem;
              font-size: 1.1rem;
              color: #1e293b;
              font-weight: 600;
            }
          }
        }

        .member-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;

          .stat {
            background: rgba(255,255,255,0.8);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;

            .label {
              display: block;
              color: #64748b;
              font-size: 0.875rem;
              margin-bottom: 0.5rem;
            }

            .value {
              color: #1e293b;
              font-size: 1.1rem;
              font-weight: 600;

              &.negative {
                color: #ef4444;
              }
            }
          }
        }

        .joined-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .role-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          background: #f1f5f9;
          color: #64748b;

          &.admin {
            background: #eff6ff;
            color: #2563eb;
            font-weight: 500;
          }
        }
      }
    }

    .member-actions {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }

    @media (max-width: 768px) {
      .group-detail {
        padding: 1rem;
      }

      .header-section {
        flex-direction: column;
        gap: 1.5rem;
        
        .group-info {
          .group-stats {
            flex-direction: column;
            gap: 1rem;
          }
        }
        
        .actions {
          width: 100%;
          flex-direction: column;
        }
      }

      .members-grid {
        grid-template-columns: 1fr;
      }
    }

    .chat-container {
      height: calc(100vh - 300px);
      display: flex;
      flex-direction: column;
    }

    .messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column-reverse;
    }

    .message-item {
      display: flex;
      gap: 12px;
      margin-bottom: 1rem;
      
      &.own-message {
        flex-direction: row-reverse;
        
        .message-content {
          background: #e3f2fd;
        }
      }

      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
      }

      .message-content {
        background: #f1f5f9;
        padding: 0.75rem;
        border-radius: 12px;
        max-width: 70%;

        .message-header {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;

          .sender-name {
            font-weight: 500;
            color: #1e293b;
          }

          .time {
            color: #64748b;
            font-size: 0.875rem;
          }
        }

        .message-text {
          color: #334155;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }
    }

    .message-input {
      position: relative;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;

      mat-form-field {
        width: 100%;
      }

      .input-actions {
        display: flex;
        gap: 4px;
      }
    }

    .emoji-picker {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
      padding: 1rem;

      .emoji-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
        gap: 8px;
        max-height: 200px;
        overflow-y: auto;

        button {
          font-size: 1.25rem;
          padding: 8px;
          min-width: 40px;
          height: 40px;
          line-height: 1;
        }
      }
    }

    .expenses-container {
      padding: 1.5rem;

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;

        h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          mat-icon {
            color: #3b82f6;
          }
        }
      }

      .expenses-list {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;

        @media (max-width: 1200px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }

        .expense-item {
          height: 100%;
          display: flex;
          flex-direction: column;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          overflow: hidden;

          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15);
            border-color: #cbd5e1;
          }

          .expense-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;

            .category-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              padding: 6px 12px;
              background: white;
              border-radius: 20px;
              border: 1px solid #e2e8f0;
              
              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
                color: #3b82f6;
              }

              span {
                font-size: 0.875rem;
                font-weight: 500;
                color: #1e293b;
              }
            }

            button {
              opacity: 0;
              transform: translateX(10px);
              transition: all 0.2s ease;
            }
          }

          &:hover .expense-header button {
            opacity: 1;
            transform: translateX(0);
          }

          .expense-content {
            flex: 1;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;

            h4 {
              margin: 0;
              font-size: 1.125rem;
              font-weight: 600;
              color: #1e293b;
              line-height: 1.4;
            }

            .expense-details {
              display: grid;
              gap: 1rem;
              padding: 1rem;
              background: #f8fafc;
              border-radius: 12px;

              .label {
                color: #64748b;
                font-size: 0.875rem;
                font-weight: 500;
              }

              .value {
                font-size: 1rem;
                font-weight: 600;
                color: #1e293b;
              }

              .amount .value {
                color: #ef4444;
                font-size: 1.25rem;
              }
            }

            .split-info {
              margin-top: auto;

              h5 {
                font-size: 0.875rem;
                font-weight: 600;
                color: #64748b;
                margin: 0 0 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;

                mat-icon {
                  font-size: 16px;
                  width: 16px;
                  height: 16px;
                }
              }

              .split-list {
                display: grid;
                gap: 0.75rem;
                max-height: 180px;
                overflow-y: auto;
                padding-right: 4px;

                &::-webkit-scrollbar {
                  width: 4px;
                }

                &::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 2px;
                }

                &::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 2px;
                }

                .split-item {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  padding: 10px 12px;
                  background: white;
                  border: 1px solid #e2e8f0;
                  border-radius: 10px;
                  transition: all 0.2s ease;

                  &:hover {
                    border-color: #cbd5e1;
                    background: #f8fafc;
                  }

                  &.paid {
                    background: #f0fdf4;
                    border-color: #86efac;

                    .status-icon {
                      color: #22c55e;
                    }
                  }

                  .name {
                    flex: 1;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }

                  .amount {
                    font-weight: 600;
                    color: #1e293b;
                    white-space: nowrap;
                  }

                  .status-icon {
                    font-size: 16px;
                    width: 16px;
                    height: 16px;
                  }
                }
              }
            }
          }
        }
      }
    }

    .split-item {
      .remind-btn {
        opacity: 0;
        transition: all 0.2s ease;
        color: #f59e0b;
        
        &:hover {
          background: #fef3c7;
        }
      }

      &:hover .remind-btn {
        opacity: 1;
      }
    }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: Group | null = null;
  expenses: GroupExpense[] = [];
  balances: {[key: string]: number} = {};
  categories: Category[] = [];
  messages$!: Observable<GroupMessage[]>;
  messageCtrl = new FormControl('');
  currentUserId = this.authService.getCurrentUserId();
  showEmojiPicker = false;
  emojis = [
    '😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎',
    '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣',
    '😥', '😮', '🤐', '🤤', '😪', '😫', '🥱', '😴',
    '😌', '😛', '😜', '😝', '🤤', '👍', '👎', '👌', '���️', '🤞', '🤝', '👊', '✊',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤',
    '👋', '🎉', '🎊', '🎈', '🎂', '🎁', '🌟', '✨'
  ];

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private dialog: MatDialog,
    private authService: AuthService,
    private categoryService: CategoryService,
    private messageService: GroupMessageService,
    private notificationService: NotificationService
  ) {
    this.loadCategories();
    this.subscribeToGroupChanges();
  }

  ngOnInit() {
    this.subscribeToGroupChanges();
  }

  private subscribeToGroupChanges() {
    this.route.params.pipe(
      switchMap(params => {
        const groupId = params['id'];
        if (groupId) {
          return this.groupService.getGroup(groupId);
        }
        return of(null);
      })
    ).subscribe(group => {
      if (group) {
        this.group = group;
        this.loadExpenses(group.id!);
        this.loadBalances(group.id!);
        this.loadMessages(group.id!);
      }
    });
  }

  private loadExpenses(groupId: string) {
    this.groupService.getGroupExpenses(groupId).subscribe(expenses => {
      this.expenses = expenses;
    });
  }

  private loadBalances(groupId: string) {
    this.groupService.calculateBalances(groupId).subscribe(balances => {
      this.balances = balances;
    });
  }

  private async loadCategories() {
    const categories = await firstValueFrom(this.categoryService.getCategories());
    if (categories) {
      this.categories = categories;
    }
  }

  private loadMessages(groupId: string) {
    if (groupId) {
      this.messages$ = this.messageService.getMessages(groupId);
    }
  }

  async sendMessage() {
    if (this.messageCtrl.value?.trim() && this.group?.id) {
      try {
        await this.messageService.sendMessage(
          this.group.id,
          this.messageCtrl.value
        );
        this.messageCtrl.reset();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  getPaidByName(expense: GroupExpense): string {
    const member = this.group?.members.find(m => m.userId === expense.paidBy);
    return member?.displayName || 'Unknown';
  }

  canSettle(split: any): boolean {
    const currentUserId = this.authService.getCurrentUserId();
    return split.userId === currentUserId;
  }

  async settleExpense(expenseId: string, userId: string) {
    try {
      await this.groupService.settleExpense(expenseId, userId);
    } catch (error) {
      console.error('Error settling expense:', error);
    }
  }

  async addMember() {
    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: '400px',
      data: { group: this.group }
    });

    dialogRef.afterClosed().subscribe(async (email: string) => {
      if (email && this.group?.id) {
        try {
          await this.groupService.addMember(this.group.id, email);
        } catch (error) {
          console.error('Error adding member:', error);
        }
      }
    });
  }

  async removeMember(memberId: string) {
    try {
      const result = await this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Xóa thành viên',
          message: 'Bạn có chắc chắn muốn xóa thành viên này?'
        }
      }).afterClosed().toPromise();

      if (result && this.group?.id) {
        await this.groupService.removeMember(this.group.id, memberId);
      }
    } catch (error) {
      console.error('Error removing member:', error);
    }
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }

  getMonthlyExpenses(): number {
    const now = new Date();
    return this.expenses
      .filter(exp => {
        try {
          const expDate = exp.date instanceof Date 
            ? exp.date 
            : typeof exp.date === 'object' && 'toDate' in (exp.date as any)
              ? (exp.date as any).toDate() 
              : new Date(exp.date);
              
          return expDate.getMonth() === now.getMonth() && 
                 expDate.getFullYear() === now.getFullYear();
        } catch (error) {
          console.error('Lỗi khi xử lý ngày tháng:', error);
          return false;
        }
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getMemberExpenses(userId: string): number {
    return this.expenses
      .filter(exp => exp.paidBy === userId)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getMemberBalance(userId: string): number {
    const paid = this.getMemberExpenses(userId);
    const share = this.expenses
      .flatMap(exp => exp.splitBetween)
      .filter(split => split.userId === userId)
      .reduce((sum, split) => sum + split.amount, 0);
    return paid - share;
  }

  get isAdmin(): boolean {
    const userId = this.authService.getCurrentUserId();
    return this.group?.members.some(m => m.userId === userId && m.role === 'admin') || false;
  }

  getCategoryName(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.name || 'Không có danh mục';
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.icon || 'category';
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    const currentValue = this.messageCtrl.value || '';
    const cursorPosition = (document.activeElement as HTMLInputElement)?.selectionStart || currentValue.length;
    
    const newValue = currentValue.slice(0, cursorPosition) + 
                     emoji + 
                     currentValue.slice(cursorPosition);
                     
    this.messageCtrl.setValue(newValue);
    this.showEmojiPicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.emoji-picker') && !target.closest('button')) {
      this.showEmojiPicker = false;
    }
  }

  async addExpense() {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '500px',
      data: { group: this.group }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.addGroupExpense(result);
        this.loadExpenses(this.group!.id!);
        this.loadBalances(this.group!.id!);
      }
    });
  }

  get isMember(): boolean {
    const userId = this.authService.getCurrentUserId();
    return this.group?.members.some(m => m.userId === userId) || false;
  }

  async deleteExpense(expense: GroupExpense) {
    try {
      const result = await this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Xóa chi tiêu',
          message: 'Bạn có chắc chắn muốn xóa chi tiêu này?'
        }
      }).afterClosed().toPromise();

      if (result && this.group?.id) {
        await this.groupService.deleteExpense(expense.id!);
        this.loadExpenses(this.group.id);
        this.loadBalances(this.group.id);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }

  async remindPayment(expense: GroupExpense, split: any) {
    try {
      await this.notificationService.sendPaymentReminder({
        userId: split.userId,
        expenseId: expense.id!,
        amount: split.amount,
        groupId: this.group!.id!,
        groupName: this.group!.name,
        expenseDesc: expense.description
      });

      // Show success message
      // You can use MatSnackBar or other notification component
      console.log('Đã gửi nhắc nhở thanh toán');
    } catch (error) {
      console.error('Error sending reminder:', error);
    }
  }

  async editExpense(expense: GroupExpense) {
    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '500px',
      data: { 
        group: this.group,
        expense: expense // Truyền expense hiện tại để edit
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && this.group?.id) {
        try {
          await this.groupService.updateExpense(expense.id!, result);
          this.loadExpenses(this.group.id);
          this.loadBalances(this.group.id);
        } catch (error) {
          console.error('Error updating expense:', error);
        }
      }
    });
  }
} 