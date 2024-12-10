import { Component, Input, Output, EventEmitter } from "@angular/core";
import { Group, GroupExpense } from "../../../../core/models/group.model";
import { ExpenseCardComponent } from "../expense-card/expense-card.component";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    CommonModule,
    ExpenseCardComponent,
    MatIconModule
  ],
  template: `
    <div class="expenses-list">
      @if (expenses.length === 0) {
        <div class="empty-state">
          <mat-icon>receipt_long</mat-icon>
          <p>Chưa có chi tiêu nào</p>
        </div>
      } @else {
        <div class="grid-container">
          @for (expense of expenses; track expense.id) {
            <app-expense-card
              [expense]="expense"
              [isAdmin]="isAdmin"
              [currentUserId]="currentUserId"
              [group]="group"
              (onEdit)="onEdit.emit($event)"
              (onDelete)="onDelete.emit($event)">
            </app-expense-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .expenses-list {
      padding: 1.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: linear-gradient(to bottom right, #f8fafc, #f1f5f9);
      border-radius: 24px;
      border: 2px dashed #e2e8f0;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 1.5rem;
        color: #94a3b8;
      }

      p {
        font-size: 1.125rem;
        color: #64748b;
        margin: 0;
      }
    }

    .grid-container {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(1, 1fr);
      
      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (min-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 2.5rem;
      }

      @media (min-width: 1536px) {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `]
})
export class ExpenseListComponent {
  @Input() expenses: GroupExpense[] = [];
  @Input() isAdmin = false;
  @Input() currentUserId = '';
  @Input() group: Group | null = null;
  @Output() onEdit = new EventEmitter<GroupExpense>();
  @Output() onDelete = new EventEmitter<GroupExpense>();
}