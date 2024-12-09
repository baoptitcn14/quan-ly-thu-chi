import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <h1>Quản Lý Chi Tiêu</h1>
          </mat-card-title>
          <mat-card-subtitle> Đăng nhập để tiếp tục </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email là bắt buộc
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Email không hợp lệ
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Mật khẩu</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
              />
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="hidePassword = !hidePassword"
              >
                <mat-icon>{{
                  hidePassword ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>
              <mat-error
                *ngIf="loginForm.get('password')?.hasError('required')"
              >
                Mật khẩu là bắt buộc
              </mat-error>
              <mat-error
                *ngIf="loginForm.get('password')?.hasError('minlength')"
              >
                Mật khẩu phải có ít nhất 6 ký tự
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="loginForm.invalid"
              >
                <mat-icon>login</mat-icon>
                Đăng nhập
              </button>

              <mat-divider>hoặc</mat-divider>

              <button
                mat-stroked-button
                type="button"
                (click)="loginWithGoogle()"
                class="google-btn"
              >
                <img
                  src="assets/images/google-logo.svg"
                  alt="Google Logo"
                  class="google-logo"
                />
                <span class="button-text">Đăng nhập bằng Google</span>
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-footer>
          <p class="footer-text">
            Chưa có tài khoản?
            <a routerLink="/auth/register" class="register-link"
              >Đăng ký ngay</a
            >
          </p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }

      .login-card {
        width: 100%;
        max-width: 400px;
        padding: 2rem;

        mat-card-header {
          text-align: center;
          display: block;
          margin-bottom: 2rem;

          h1 {
            margin: 0;
            font-size: 1.8rem;
            color: #333;
          }

          mat-card-subtitle {
            margin-top: 0.5rem;
            font-size: 1rem;
          }
        }

        mat-form-field {
          width: 100%;
          margin-bottom: 1rem;

          mat-icon {
            color: #666;
          }
        }

        .actions {
          margin-top: 2rem;

          button {
            width: 100%;
            padding: 0.5rem;
            font-size: 1rem;
            margin-bottom: 1rem;

            mat-icon {
              margin-right: 0.5rem;
            }
          }

          mat-divider {
            margin: 1.5rem 0;
            &::before {
              margin: 0 1rem;
            }
          }

          .google-btn {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 1px 24px;
            height: 40px;
            background-color: white;
            border: 1px solid #dadce0;
            border-radius: 4px;
            box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15);
            transition: background-color .3s, box-shadow .3s;
            
            &:hover {
              background-color: #f8f9fa;
              box-shadow: 0 1px 2px 0 rgba(60,64,67,.3), 0 2px 6px 2px rgba(60,64,67,.15);
            }

            .google-logo {
              width: 18px;
              height: 18px;
              object-fit: contain;
            }

            .button-text {
              color: #3c4043;
              font-family: "Google Sans", Roboto, Arial, sans-serif;
              font-size: 14px;
              font-weight: 500;
              letter-spacing: .25px;
              line-height: 16px;
            }
          }
        }
      }

      .footer-text {
        text-align: center;
        margin-top: 2rem;
        color: #666;

        .register-link {
          color: #1a73e8;
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 1.5rem;
        }
      }
    `,
  ],
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.googleLogin();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Google login error:', error);
    }
  }
}
