import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user.interface';
import { Observable } from 'rxjs';
import { ProfileDialogComponent } from './profile-dialog.component';

@Component({
  selector: 'app-header',
  template: `
    <header class="header">
      <div class="header-container">
        <div class="logo">
          <a routerLink="/">
            <img src="assets/logo.svg" alt="Logo">
          </a>
        </div>

        <nav class="navigation">
          <ul class="nav-links">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-link">
                <div class="nav-icon">
                  <mat-icon>home</mat-icon>
                </div>
                <span class="nav-text">Trang chủ</span>
              </a>
            </li>
            <li>
              <a routerLink="/transactions" routerLinkActive="active" class="nav-link">
                <div class="nav-icon">
                  <mat-icon>account_balance_wallet</mat-icon>
                </div>
                <span class="nav-text">Quản lý chi tiêu</span>
              </a>
            </li>
            <li>
              <a routerLink="/budgets" routerLinkActive="active" class="nav-link">
                <div class="nav-icon">
                  <mat-icon>savings</mat-icon>
                </div>
                <span class="nav-text">Ngân sách</span>
              </a>
            </li>
            <li>
              <a routerLink="/analytics" routerLinkActive="active" class="nav-link">
                <div class="nav-icon">
                  <mat-icon>analytics</mat-icon>
                </div>
                <span class="nav-text">Phân tích chi tiêu</span>
              </a>
            </li>
          </ul>
        </nav>

        <!-- User Profile Menu -->
        <div class="user-menu">
          <button
            mat-button
            [matMenuTriggerFor]="userMenu"
            class="profile-button"
          >
            <img
              [src]="
                (currentUser$ | async)?.photoURL || 'assets/default-avatar.svg'
              "
              alt="Avatar"
              class="avatar"
            />
            <mat-icon>arrow_drop_down</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="openProfileDialog()">
              <mat-icon>account_circle</mat-icon>
              <span>Thông tin cá nhân</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Đăng xuất</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        width: 100%;
        background: #fff;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
      }

      .header-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0.8rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo img {
        height: 40px;
        transition: transform 0.2s ease;
      }

      .logo img:hover {
        transform: scale(1.05);
      }

      .navigation {
        flex: 1;
        margin-left: 2rem;
        justify-items: flex-end;
      }

      .nav-links {
        display: flex;
        gap: 1rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .nav-link {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        color: #666;
        text-decoration: none;
        border-radius: 8px;
        transition: all 0.2s ease;
      }

      .nav-link:hover {
        background: rgba(0, 0, 0, 0.04);
        color: #2196f3;
      }

      .nav-link.active {
        background: #e3f2fd;
        color: #1976d2;
      }

      .nav-icon {
        display: flex;
        align-items: center;
        margin-right: 0.5rem;
      }

      .nav-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .nav-text {
        font-weight: 500;
        font-size: 0.9rem;
      }

      .menu-toggle {
        display: none;
        padding: 0.5rem;
        color: #666;
        border-radius: 50%;
        transition: background 0.2s ease;
      }

      .menu-toggle:hover {
        background: rgba(0, 0, 0, 0.04);
      }

      /* Mobile styles */
      @media (max-width: 768px) {
        .header-container {
          padding: 0.8rem 1rem;
        }

        .menu-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
        }

        .navigation {
          position: fixed;
          top: 60px;
          left: 0;
          width: 100%;
          height: calc(100vh - 60px);
          background: #fff;
          margin: 0;
          padding: 1rem;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
          box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
          justify-items: initial;
        }

        .navigation.active {
          transform: translateX(0);
        }

        .nav-links {
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.8rem 1rem;
        }

        .nav-text {
          font-size: 1rem;
        }
      }

      /* Tablet styles */
      @media (min-width: 769px) and (max-width: 1024px) {
        .header-container {
          padding: 0.8rem 1.5rem;
        }

        .nav-links {
          gap: 0.5rem;
        }

        .nav-link {
          padding: 0.5rem 0.8rem;
        }

        .nav-text {
          font-size: 0.85rem;
        }
      }

      .user-menu {
        margin-left: 1rem;

        .profile-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 4px 8px;

          .avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
          }

          .username {
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }

      @media (max-width: 768px) {
        .username {
          display: none;
        }

        .profile-button {
          padding: 4px !important;
        }
      }
    `,
  ],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
  ],
})
export class HeaderComponent {
  currentUser$: Observable<User | null>;

  constructor(private authService: AuthService, private dialog: MatDialog) {
    this.currentUser$ = this.authService.getCurrentUser();
  }

  openProfileDialog(): void {
    const dialogRef = this.dialog.open(ProfileDialogComponent, {
      width: '400px',
      data: this.authService.getCurrentUserValue(),
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Cập nhật thông tin người dùng
        this.authService.updateProfile(result);
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
