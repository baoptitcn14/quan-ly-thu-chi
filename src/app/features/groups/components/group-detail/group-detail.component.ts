import {
  Component,
  OnInit,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../../../core/services/group.service';
import {
  Group,
  GroupExpense,
  GroupMessage,
} from '../../../../core/models/group.model';
import { AddExpenseDialogComponent } from '../add-expense-dialog/add-expense-dialog.component';
import { AddMemberDialogComponent } from '../add-member-dialog/add-member-dialog.component';
import { AuthService } from '../../../../core/services/auth.service';
import { TimestampPipe } from '../../../../core/pipes/timestamp.pipe';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  Category,
  CategoryService,
} from '../../../../core/services/category.service';
import { firstValueFrom } from 'rxjs';
import { GroupMessageService } from '../../../../core/services/group-message.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { ExpenseListComponent } from '../expense-list/expense-list.component';
import { MatSelectModule } from '@angular/material/select';

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
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ExpenseListComponent,
    TimestampPipe,
  ],
  template: `
    <div class="group-detail" *ngIf="group">
      <div class="header-section">
        <div class="group-info">
          <div class="group-title">
            <h2>{{ group.name }}</h2>
            <span class="member-count">
              <mat-icon>group</mat-icon>
              {{ group.members.length }} thành viên
            </span>
          </div>
          <p class="description">{{ group.description }}</p>
          <div class="group-stats">
            <div class="stat-item">
              <span class="label">Tổng chi tiêu</span>
              <span class="value"
                >{{ getTotalExpenses() | number : '1.0-0' }}đ</span
              >
            </div>
            <div class="stat-item">
              <span class="label">Chi tiêu tháng này</span>
              <span class="value"
                >{{ getMonthlyExpenses() | number : '1.0-0' }}đ</span
              >
            </div>
          </div>
        </div>
        <div class="actions">
          <button mat-raised-button color="primary" (click)="addExpense()">
            <mat-icon>add</mat-icon>
            Thêm chi tiêu
          </button>
          <button mat-stroked-button *ngIf="isAdmin" (click)="addMember()">
            <mat-icon>person_add</mat-icon>
            Thêm thành viên
          </button>
        </div>
      </div>

      <mat-tab-group
        animationDuration="200ms"
        class="content-tabs"
        mat-align-tabs="center"
      >
        <mat-tab label="Chi tiêu">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">receipt</mat-icon>
            Chi tiêu
          </ng-template>
          <div class="tab-content expenses-tab">
            <app-expense-list
              [expenses]="expenses"
              [isAdmin]="isAdmin"
              [currentUserId]="currentUserId"
              [group]="group"
              (onEdit)="editExpense($event)"
              (onDelete)="deleteExpense($event)"
            >
            </app-expense-list>
          </div>
        </mat-tab>

        <mat-tab label="Thành viên">
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">group</mat-icon>
            Thành viên
          </ng-template>
          <div class="tab-content members-tab">
            <div class="members-list">
              @for (member of group.members; track member.userId) {
              <div class="member-item" [class.admin]="member.role === 'admin'">
                <div class="member-main">
                  <div class="avatar-wrapper">
                    <img
                      [src]="member.photoURL || 'assets/default-avatar.svg'"
                      [alt]="member.displayName"
                      class="avatar"
                    />
                    <span
                      class="status-dot"
                      [class.online]="isOnline(member.userId)"
                    ></span>
                  </div>

                  <div class="info">
                    <div class="name-role">
                      <h4>{{ member.displayName }}</h4>
                      @if (member.role === 'admin') {
                      <span class="role-tag">
                        <mat-icon>admin_panel_settings</mat-icon>
                        Admin
                      </span>
                      }
                    </div>
                    <span class="joined-date">
                      Tham gia
                      {{
                        member.joinedAt | TimestampPipe | date : 'dd/MM/yyyy'
                      }}
                    </span>
                  </div>
                </div>

                <div class="member-stats">
                  <div class="stat-item">
                    <div class="stat-value">
                      {{ getMemberExpenses(member.userId) | number : '1.0-0' }}đ
                    </div>
                    <div class="stat-label">Đã chi</div>
                    <div
                      class="stat-trend"
                      [class.up]="getMemberExpenses(member.userId) > 0"
                    >
                      <mat-icon>trending_up</mat-icon>
                      +25%
                    </div>
                  </div>

                  <div class="stat-item">
                    <div
                      class="stat-value"
                      [class.negative]="getMemberBalance(member.userId) < 0"
                    >
                      {{ getMemberBalance(member.userId) | number : '1.0-0' }}đ
                    </div>
                    <div class="stat-label">Số dư</div>
                    <div
                      class="stat-trend"
                      [class.down]="getMemberBalance(member.userId) < 0"
                    >
                      <mat-icon>{{
                        getMemberBalance(member.userId) < 0
                          ? 'trending_down'
                          : 'trending_up'
                      }}</mat-icon>
                      {{ getMemberBalance(member.userId) < 0 ? '-' : '+' }}15%
                    </div>
                  </div>
                </div>

                @if (isAdmin && member.userId !== currentUserId) {
                <button
                  mat-icon-button
                  class="remove-btn"
                  color="warn"
                  matTooltip="Xóa thành viên"
                  (click)="removeMember(member.userId)"
                >
                  <mat-icon>person_remove</mat-icon>
                </button>
                }
              </div>
              }
            </div>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon">chat</mat-icon>
            Trò chuyện
          </ng-template>
          <div class="tab-content chat-tab">
            <div class="messages-container">
              <div class="messages-list" #messagesList>
                @for (message of messages$ | async; track message.id) {
                <div
                  class="message-item"
                  [class.own-message]="message.userId === currentUserId"
                >
                  <img
                    [src]="message.photoURL || 'assets/default-avatar.svg'"
                    [alt]="message.displayName"
                    class="avatar"
                  />
                  <div class="message-content">
                    <div class="message-header">
                      <span class="sender">{{ message.displayName }}</span>
                      <span class="time">{{
                        message.createdAt | TimestampPipe | date : 'HH:mm'
                      }}</span>
                    </div>
                    <div class="message-text">{{ message.content }}</div>
                  </div>
                </div>
                }
              </div>

              <div class="message-input">
                <mat-form-field appearance="outline">
                  <input
                    matInput
                    [formControl]="messageCtrl"
                    placeholder="Nhập tin nhắn..."
                    (keyup.enter)="sendMessage()"
                  />
                  <div class="input-actions" matSuffix>
                    <button mat-icon-button (click)="toggleEmojiPicker()">
                      <mat-icon>sentiment_satisfied_alt</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      color="primary"
                      [disabled]="!messageCtrl.value"
                      (click)="sendMessage()"
                    >
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </mat-form-field>

                @if (showEmojiPicker) {
                <div class="emoji-picker">
                  <div class="emoji-list">
                    @for (emoji of emojis; track emoji) {
                    <button mat-button (click)="addEmoji(emoji)">
                      {{ emoji }}
                    </button>
                    }
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      .group-detail {
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        .header-section {
          padding: 1rem;
          background: linear-gradient(135deg, #e0f2fe, #f0f9ff);
          border-radius: 12px 12px 0 0;

          @media (min-width: 768px) {
            padding: 2rem;
          }

          .group-info {
            .group-title {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1rem;

              h2 {
                margin: 0;
                font-size: 1.75rem;
                color: #0f172a;
              }

              .member-count {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 20px;
                font-size: 0.875rem;
                color: #64748b;
              }
            }

            .description {
              color: #475569;
              margin-bottom: 1.5rem;
            }

            .group-stats {
              display: grid;
              grid-template-columns: 1fr;
              gap: 1rem;

              @media (min-width: 768px) {
                grid-template-columns: repeat(2, 1fr);
                gap: 1.5rem;
              }

              .stat-item {
                background: white;
                padding: 1.5rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

                .label {
                  display: block;
                  font-size: 0.875rem;
                  color: #64748b;
                  margin-bottom: 0.5rem;
                }

                .value {
                  font-size: 1.5rem;
                  font-weight: 600;
                  color: #0f172a;
                }
              }
            }
          }

          .actions {
            margin-top: 2rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;

            @media (min-width: 768px) {
              flex-direction: row;
            }

            button {
              padding: 0.75rem 1.5rem;
              border-radius: 8px;

              mat-icon {
                margin-right: 0.5rem;
              }
            }
          }
        }

        .content-tabs {
          .expenses-tab {
            .search-filter {
              background: #f8fafc;
              padding: 1.5rem;
              border-radius: 8px;
              margin-bottom: 2rem;
            }

            app-expense-list {
              margin-top: 1.5rem;
            }
          }

          .members-tab {
            padding: 2rem;

            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 2rem;

              .title-section {
                h3 {
                  font-size: 1.75rem;
                  font-weight: 700;
                  color: #0f172a;
                  margin: 0 0 0.5rem;
                }

                .member-count {
                  color: #64748b;
                  font-size: 0.875rem;
                }
              }

              button {
                gap: 0.5rem;
                padding: 0 1.5rem;
                height: 42px;
                border-radius: 8px;
              }
            }

            .members-list {
              display: grid;
              grid-template-columns: 1fr;
              gap: 1rem;

              @media (min-width: 768px) {
                grid-template-columns: repeat(2, 1fr);
              }

              .member-item {
                background: white;
                border-radius: 16px;
                padding: 1rem;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                position: relative;
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;

                @media (min-width: 768px) {
                  flex-direction: row;
                  padding: 1.5rem;
                  gap: 2rem;
                }

                &:hover {
                  border-color: #3b82f6;
                  transform: translateX(8px);
                  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

                  .remove-btn {
                    opacity: 1;
                    transform: translateX(0);
                  }
                }

                &.admin {
                  background: linear-gradient(to right, #f0f9ff, #e0f2fe);
                  border-left: 4px solid #3b82f6;
                }

                .member-main {
                  display: flex;
                  align-items: center;
                  gap: 1rem;
                  flex: 1;

                  .avatar-wrapper {
                    position: relative;

                    .avatar {
                      width: 56px;
                      height: 56px;
                      border-radius: 16px;
                      object-fit: cover;
                    }

                    .status-dot {
                      position: absolute;
                      bottom: -2px;
                      right: -2px;
                      width: 12px;
                      height: 12px;
                      border-radius: 50%;
                      border: 2px solid white;
                      background: #94a3b8;

                      &.online {
                        background: #22c55e;
                      }
                    }
                  }

                  .info {
                    .name-role {
                      display: flex;
                      align-items: center;
                      gap: 0.75rem;
                      margin-bottom: 0.25rem;

                      h4 {
                        margin: 0;
                        font-size: 1rem;
                        font-weight: 600;
                        color: #0f172a;
                      }

                      .role-tag {
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                        padding: 0.25rem 0.75rem;
                        background: #3b82f6;
                        color: white;
                        border-radius: 99px;
                        font-size: 0.75rem;
                        font-weight: 500;

                        mat-icon {
                          font-size: 14px;
                          width: 14px;
                          height: 14px;
                        }
                      }
                    }

                    .joined-date {
                      font-size: 0.875rem;
                      color: #64748b;
                    }
                  }
                }

                .member-stats {
                  display: flex;
                  gap: 2rem;
                  padding: 0;
                  border-left: none;
                  gap: 1rem;

                  @media (min-width: 768px) {
                    padding: 0 2rem;
                    border-left: 1px solid #e2e8f0;
                    gap: 2rem;
                  }

                  .stat-item {
                    text-align: center;

                    .stat-value {
                      font-size: 1.25rem;
                      font-weight: 700;
                      color: #0f172a;
                      margin-bottom: 0.25rem;

                      &.negative {
                        color: #ef4444;
                      }
                    }

                    .stat-label {
                      font-size: 0.75rem;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      color: #64748b;
                      margin-bottom: 0.5rem;
                    }

                    .stat-trend {
                      display: inline-flex;
                      align-items: center;
                      gap: 0.25rem;
                      padding: 0.25rem 0.5rem;
                      border-radius: 6px;
                      font-size: 0.75rem;
                      font-weight: 500;
                      color: #22c55e;
                      background: #f0fdf4;

                      mat-icon {
                        font-size: 14px;
                        width: 14px;
                        height: 14px;
                      }

                      &.down {
                        color: #ef4444;
                        background: #fef2f2;
                      }
                    }
                  }
                }

                .remove-btn {
                  opacity: 0;
                  transform: translateX(-8px);
                  transition: all 0.2s ease;

                  &:hover {
                    background: #fee2e2;
                  }
                }
              }
            }
          }

          .chat-tab {
            height: calc(100vh - 300px);
            padding: 0;

            .messages-container {
              height: 100%;
              display: flex;
              flex-direction: column;

              .messages-list {
                flex: 1;
                overflow-y: auto;
                padding: 1.5rem;
                display: flex;
                flex-direction: column;

                .message-item {
                  display: flex;
                  gap: 1rem;
                  margin-bottom: 1.5rem;
                  max-width: 80%;

                  &.own-message {
                    flex-direction: row-reverse;
                    align-self: flex-end;

                    .message-content {
                      background: #eff6ff;
                      border: 1px solid #bfdbfe;

                      .message-header {
                        flex-direction: row-reverse;
                      }
                    }
                  }

                  .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    object-fit: cover;
                  }

                  .message-content {
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;

                    .message-header {
                      display: flex;
                      align-items: center;
                      gap: 0.75rem;
                      margin-bottom: 0.5rem;

                      .sender {
                        font-weight: 500;
                        font-size: 0.875rem;
                        color: #1e293b;
                      }

                      .time {
                        font-size: 0.75rem;
                        color: #64748b;
                      }
                    }

                    .message-text {
                      color: #334155;
                      line-height: 1.5;
                      white-space: pre-wrap;
                      word-break: break-word;
                    }
                  }
                }
              }

              .message-input {
                padding: 1rem;
                background: white;
                border-top: 1px solid #e2e8f0;
                position: relative;

                mat-form-field {
                  width: 100%;
                }

                .input-actions {
                  display: flex;
                  gap: 0.5rem;
                }

                .emoji-picker {
                  position: absolute;
                  bottom: 100%;
                  left: 0;
                  right: 0;
                  background: white;
                  border: 1px solid #e2e8f0;
                  border-radius: 12px;
                  padding: 1rem;
                  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);

                  .emoji-list {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
                    gap: 0.5rem;
                    max-height: 200px;
                    overflow-y: auto;

                    button {
                      min-width: 40px;
                      height: 40px;
                      padding: 0;
                      font-size: 1.25rem;

                      &:hover {
                        background: #f1f5f9;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  ],
})
export class GroupDetailComponent implements OnInit {
  group: Group | null = null;
  expenses: GroupExpense[] = [];
  balances: { [key: string]: number } = {};
  categories: Category[] = [];
  messages$!: Observable<GroupMessage[]>;
  messageCtrl = new FormControl('');
  currentUserId = this.authService.getCurrentUserId()!;
  showEmojiPicker = false;
  emojis = [
    '😀',
    '😂',
    '🤣',
    '😊',
    '😍',
    '🥰',
    '😘',
    '😎',
    '🤔',
    '🤨',
    '😐',
    '😑',
    '😶',
    '🙄',
    '😏',
    '😣',
    '😥',
    '😮',
    '🤐',
    '🤤',
    '😪',
    '😫',
    '🥱',
    '😴',
    '😌',
    '😛',
    '😜',
    '😝',
    '🤤',
    '👍',
    '👎',
    '👌',
    '👍',
    '🤞',
    '🤝',
    '👊',
    '✊',
    '❤️',
    '🧡',
    '💛',
    '💚',
    '💙',
    '💜',
    '🖤',
    '👋',
    '🎉',
    '🎊',
    '🎈',
    '🎂',
    '🎁',
    '🌟',
    '✨',
  ];

  @ViewChild('messagesList') private messagesList!: ElementRef;

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
    this.route.params
      .pipe(
        switchMap((params) => {
          const groupId = params['id'];
          if (groupId) {
            return this.groupService.getGroup(groupId);
          }
          return of(null);
        })
      )
      .subscribe((group) => {
        if (group) {
          this.group = group;
          this.loadExpenses(group.id!);
          this.loadBalances(group.id!);
          this.loadMessages(group.id!);
        }
      });
  }

  private loadExpenses(groupId: string) {
    this.groupService.getGroupExpenses(groupId).subscribe((expenses) => {
      this.expenses = expenses;
    });
  }

  private loadBalances(groupId: string) {
    this.groupService.calculateBalances(groupId).subscribe((balances) => {
      this.balances = balances;
    });
  }

  private async loadCategories() {
    const categories = await firstValueFrom(
      this.categoryService.getCategories()
    );
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

        // Debug
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  getPaidByName(expense: GroupExpense): string {
    const member = this.group?.members.find((m) => m.userId === expense.paidBy);
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
      data: { group: this.group },
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
      const result = await this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Xóa thành viên',
            message: 'Bạn có chắc chắn muốn xóa thành viên này?',
          },
        })
        .afterClosed()
        .toPromise();

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
      .filter((exp) => {
        try {
          const expDate =
            exp.date instanceof Date
              ? exp.date
              : typeof exp.date === 'object' && 'toDate' in (exp.date as any)
              ? (exp.date as any).toDate()
              : new Date(exp.date);

          return (
            expDate.getMonth() === now.getMonth() &&
            expDate.getFullYear() === now.getFullYear()
          );
        } catch (error) {
          console.error('Lỗi khi xử lý ngày tháng:', error);
          return false;
        }
      })
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getMemberExpenses(userId: string): number {
    return this.expenses
      .filter((exp) => exp.paidBy === userId)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }

  getMemberBalance(userId: string): number {
    const paid = this.getMemberExpenses(userId);
    const share = this.expenses
      .flatMap((exp) => exp.splitBetween)
      .filter((split) => split.userId === userId)
      .reduce((sum, split) => sum + split.amount, 0);
    return paid - share;
  }

  get isAdmin(): boolean {
    const userId = this.authService.getCurrentUserId();
    return (
      this.group?.members.some(
        (m) => m.userId === userId && m.role === 'admin'
      ) || false
    );
  }

  getCategoryName(categoryId: string): string {
    return (
      this.categories.find((c) => c.id === categoryId)?.name ||
      'Không có danh mục'
    );
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories.find((c) => c.id === categoryId)?.icon || 'category';
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(emoji: string) {
    const currentValue = this.messageCtrl.value || '';
    const cursorPosition =
      (document.activeElement as HTMLInputElement)?.selectionStart ||
      currentValue.length;

    const newValue =
      currentValue.slice(0, cursorPosition) +
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
      data: { group: this.group },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.groupService.addGroupExpense(result);
        this.loadExpenses(this.group!.id!);
        this.loadBalances(this.group!.id!);
      }
    });
  }

  get isMember(): boolean {
    const userId = this.authService.getCurrentUserId();
    return this.group?.members.some((m) => m.userId === userId) || false;
  }

  async deleteExpense(expense: GroupExpense) {
    try {
      const result = await this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: 'Xóa chi tiêu',
            message: 'Bạn có chắc chắn muốn xóa chi tiêu này?',
          },
        })
        .afterClosed()
        .toPromise();

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
        expenseDesc: expense.description,
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
        expense: expense, // Truyền expense hiện tại để edit
      },
    });

    dialogRef.afterClosed().subscribe(async (result) => {
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

  isOnline(userId: string): boolean {
    // Implement logic kiểm tra online status
    return false; // Hoặc true tùy vào logic thực tế
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messagesList.nativeElement.scrollTop =
        this.messagesList.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
