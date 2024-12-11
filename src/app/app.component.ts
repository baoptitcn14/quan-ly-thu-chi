import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { AuthService } from './core/services/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AIChatComponent } from './features/dashboard/components/ai-chat/ai-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    HeaderComponent,
    MatButtonModule,
    MatIconModule,
    AIChatComponent
  ],
  template: `
    <app-header>
      <router-outlet></router-outlet>
    </app-header>

    <!-- Chat AI Button -->
    <button mat-fab 
            class="chat-fab"
            color="primary" 
            (click)="openAIChat()">
      <mat-icon>chat</mat-icon>
    </button>

    <!-- Chat Dialog -->
    @if (showChat) {
      <app-ai-chat 
        class="ai-chat-dialog"
        (close)="closeAIChat()">
      </app-ai-chat>
    }
  `,
  styles: [`
    .chat-fab {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      z-index: 1000;
    }

    .ai-chat-dialog {
      position: fixed;
      bottom: 5rem;
      right: 2rem;
      width: 400px;
      z-index: 999;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      border-radius: 8px;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .ai-chat-dialog {
        width: 90%;
        right: 5%;
      }
    }
  `],
})
export class AppComponent {
  title = 'quan-ly-chi-tieu';
  showChat = false;

  openAIChat(): void {
    this.showChat = true;
  }

  closeAIChat(): void {
    this.showChat = false;
  }
}
