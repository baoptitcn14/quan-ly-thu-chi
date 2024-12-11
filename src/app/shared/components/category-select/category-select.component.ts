import { Component, Input, forwardRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { firstValueFrom } from 'rxjs';
import { Category } from '../../../core/services/category.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AddCategoryDialogComponent } from './add-category-dialog.component';
import { CategoryDialogComponent } from '../../../features/categories/components/category-dialog/category-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategorySelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="category-select-container">
      <mat-form-field appearance="outline" [style.width]="'100%'">
        <mat-label>{{label}}</mat-label>
        <mat-select [(ngModel)]="value" autoWidth (ngModelChange)="onChange($event)">
          <div class="select-header">
            <button mat-button color="primary" (click)="openAddCategoryDialog($event)">
              <mat-icon>add</mat-icon>
              Thêm danh mục
            </button>
          </div>
          
          @for (category of categories; track category.id) {
            <mat-option [value]="category.id">
              <div class="category-option">
                <mat-icon class="category-icon">{{category.icon}}</mat-icon>
                <span class="category-name">{{category.name}}</span>
                @if (!category.isDefault) {
                  <button mat-icon-button 
                          class="delete-btn"
                          matTooltip="Xóa danh mục"
                          (click)="deleteCategory($event, category)">
                    <mat-icon class="delete-icon">remove_circle</mat-icon>
                  </button>
                }
              </div>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: [`
    .category-select-container {
      position: relative;
    }

    .select-header {
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
      padding: 8px;
      border-bottom: 1px solid #e2e8f0;
    }

    .category-option {
      display: flex;
      align-items: center;
      padding: 8px 4px;
      width: 100%;

      .category-icon {
        color: #64748b;
        margin-right: 12px;
      }

      .category-name {
        flex: 1;
        font-size: 0.9375rem;
      }

      .delete-btn {
        width: 28px;
        height: 28px;
        padding: 2px;
        margin-right: -4px;
        opacity: 0.6;
        transition: all 0.2s ease;

        .delete-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          color: #dc2626;
        }

        &:hover {
          opacity: 1;
          background-color: #fee2e2;
        }
      }
    }

    ::ng-deep .mat-mdc-select-panel {
      max-height: 400px !important;
    }

    ::ng-deep .mat-mdc-option {
      min-height: 44px !important;
    }
  `]
})
export class CategorySelectComponent implements ControlValueAccessor, OnDestroy {
  @Input() label = 'Danh mục';
  categories: Category[] = [];
  value: string = '';

  onChange: any = () => {};
  onTouch: any = () => {};

  private subscriptions = new Subscription();

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog
  ) {
    this.loadCategories();
  }

  async loadCategories() {
    const subscription = this.categoryService.getCategories()
      .subscribe(categories => {
        if (categories) {
          this.categories = categories;
        }
      });
    this.subscriptions.add(subscription);
  }

  async openAddCategoryDialog(event: Event) {
    event.stopPropagation();
    // Implement dialog to add new category
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '400px'
    });

    const result = await firstValueFrom(dialogRef.afterClosed());
    if (result) {
      await this.categoryService.addCategory(result);
      this.loadCategories();
    }
  }

  async deleteCategory(event: Event, category: Category) {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Xóa danh mục',
        message: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`
      }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      try {
        await this.categoryService.deleteCategory(category.id!);
        this.loadCategories();
      } catch (error) {
        console.error('Lỗi khi xóa danh mục:', error);
      }
    }
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }
} 