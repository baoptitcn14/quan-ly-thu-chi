import { CommonModule } from "@angular/common";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { Group, GroupExpense } from "../../../../core/models/group.model";
import { SplitListComponent } from "../split-list/split-list.component";
import { CategoryService } from "../../../../core/services/category.service";
import { GroupService } from "../../../../core/services/group.service";
import { TimestampPipe } from "../../../../core/pipes/timestamp.pipe";

@Component({
  selector: 'app-expense-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    SplitListComponent,
    TimestampPipe,
  ],
  template: `
    <mat-card class="expense-item">
      <div class="expense-header">
        <div class="category-badge">
          <mat-icon>{{getCategoryIcon(expense.category)}}</mat-icon>
          <span>{{getCategoryName(expense.category)}}</span>
        </div>
        @if (isAdmin || expense.paidBy === currentUserId) {
          <div class="actions">
            <button mat-icon-button (click)="onEdit.emit(expense)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="onDelete.emit(expense)">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        }
      </div>

      <mat-card-content>
        <h4>{{expense.description}}</h4>
        <div class="expense-details">
          <div class="amount">{{expense.amount | number:'1.0-0'}}đ</div>
          <div class="paid-by">
            <mat-icon>person</mat-icon>
            <div class="paid-info">
              <span class="label">Người trả</span>
              <span class="value">{{getPaidByName(expense)}}</span>
            </div>
          </div>
          <div class="date">
            <mat-icon>event</mat-icon>
            <div class="date-info">
              <span class="label">Ngày chi</span>
              <span class="value">{{expense.createdAt | TimestampPipe | date:'dd/MM/yyyy'}}</span>
            </div>
          </div>
        </div>
        <app-split-list [splits]="expense.splitBetween"></app-split-list>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .expense-item {
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      background: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: #3b82f6;

        .actions {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .expense-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);

        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: white;
          border-radius: 99px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          
          mat-icon {
            color: #3b82f6;
            font-size: 20px;
          }

          span {
            font-weight: 500;
            color: #1e293b;
          }
        }

        .actions {
          transform: translateX(10px);
          transition: all 0.2s ease;

          button {
            margin-left: 0.5rem;
            &:hover {
              background: rgba(59, 130, 246, 0.1);
            }
          }
        }
      }

      mat-card-content {
        padding: 1.5rem;

        h4 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 1.5rem;
          line-height: 1.4;
        }

        .expense-details {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 1rem;

          .amount {
            font-size: 1.75rem;
            font-weight: 700;
            color: #3b82f6;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            gap: 0.5rem;

            &::before {
              content: '';
              display: block;
              width: 4px;
              height: 24px;
              background: #3b82f6;
              border-radius: 2px;
            }
          }

          .paid-by, .date {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;

            mat-icon {
              color: #64748b;
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            .paid-info, .date-info {
              display: flex;
              flex-direction: column;
              gap: 0.25rem;

              .label {
                font-size: 0.75rem;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }

              .value {
                font-weight: 500;
                color: #1e293b;
              }
            }
          }
        }

        app-split-list {
          margin-top: 1rem;
        }
      }
    }
  `]
})
export class ExpenseCardComponent {
  @Input() expense!: GroupExpense;
  @Input() isAdmin = false;
  @Input() currentUserId = '';
  @Input() group: Group | null = null;
  @Output() onEdit = new EventEmitter<GroupExpense>();
  @Output() onDelete = new EventEmitter<GroupExpense>();

  constructor(
    private categoryService: CategoryService,
  ) {}

  getCategoryIcon(categoryId: string): string {
    const category = this.categoryService.getCategory(categoryId);
    return category?.icon || 'category';
  }

  getCategoryName(categoryId: string): string {
    const category = this.categoryService.getCategory(categoryId);
    return category?.name || 'Danh mục';
  }

  getPaidByName(expense: GroupExpense): string {
    const member = this.group?.members.find((m) => m.userId === expense.paidBy);
    return member?.displayName || 'Không xác định';
  }
} 