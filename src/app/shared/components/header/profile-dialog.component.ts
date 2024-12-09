import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { User } from '../../../core/models/user.interface';

@Component({
  selector: 'app-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Cập nhật thông tin</h2>
    <mat-dialog-content>
      <form [formGroup]="profileForm">
        <mat-form-field appearance="outline">
          <mat-label>Tên hiển thị</mat-label>
          <input matInput formControlName="displayName" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>URL ảnh đại diện</mat-label>
          <input matInput formControlName="photoURL" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Hủy</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!profileForm.valid"
        (click)="onSubmit()"
      >
        Cập nhật
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        padding: 1rem !important;
      }
      mat-form-field {
        width: 100%;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class ProfileDialogComponent {
  profileForm: FormGroup;

  constructor(
    private dialogRef: MatDialogRef<ProfileDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: User,
    private fb: FormBuilder
  ) {
    this.profileForm = this.fb.group({
      displayName: [data.displayName, Validators.required],
      photoURL: [data.photoURL],
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.dialogRef.close(this.profileForm.value);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
