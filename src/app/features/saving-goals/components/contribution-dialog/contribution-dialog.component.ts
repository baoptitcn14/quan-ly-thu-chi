import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NumberFormatter } from '../../../../shared/utils/number-formatter';

@Component({
  selector: 'app-contribution-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <h2 mat-dialog-title>Thêm tiền tiết kiệm</h2>
    <mat-dialog-content>
      <p>Thêm tiền vào mục tiêu: {{data.goalName}}</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Số tiền</mat-label>
          <input matInput formControlName="amount" (input)="formatNumber($event)">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button mat-raised-button color="primary" 
              [disabled]="!form.valid"
              (click)="onSubmit()">
        Thêm
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
    }
  `]
})
export class ContributionDialogComponent {
  form: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ContributionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { goalName: string },
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]]
    });
  }

  formatNumber(event: Event): void {
    NumberFormatter.formatCurrency(event);
  }

  onSubmit(): void {
    if (this.form.valid) {
      const amount = parseFloat(this.form.value.amount.toString().replace(/[^0-9]/g, ''));
      this.dialogRef.close(amount);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
} 