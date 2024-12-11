import { Component, OnInit, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AIChatService, ChatMessage } from '../../../../core/services/ai-chat.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TimestampPipe } from '../../../../core/pipes/timestamp.pipe';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    TimestampPipe
  ],
  template: `
    <mat-card class="chat-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>smart_toy</mat-icon>
          Tư vấn tài chính thông minh
        </mat-card-title>
        <button class="close-button" mat-icon-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
        </button>
      </mat-card-header>

      @if (!messages.length) {
        <div class="welcome-guide">
          <h3>Chào mừng bạn đến với Trợ lý Tài chính AI!</h3>
          <p>Bạn có thể hỏi tôi về:</p>
          <ul>
            <li>Phân tích chi tiêu của bạn</li>
            <li>Gợi ý tiết kiệm phù hợp</li>
            <li>Tư vấn quản lý ngân sách</li>
            <li>Dự báo chi tiêu tương lai</li>
          </ul>
          <div class="quick-questions">
            <p>Hoặc chọn câu hỏi gợi ý:</p>
            <mat-chip-listbox>
              @for (question of suggestedQuestions; track question) {
                <mat-chip-option (click)="askQuestion(question)">
                  {{ question }}
                </mat-chip-option>
              }
            </mat-chip-listbox>
          </div>
        </div>
      }

      <mat-card-content class="chat-content">
        <div class="messages" #messageContainer>
          @for (message of messages; track message.id) {
            <div class="message" [class.ai]="message.type === 'ai'" [class.user]="message.type === 'user'">
              <div class="message-header">
                <mat-icon>{{ message.type === 'ai' ? 'smart_toy' : 'person' }}</mat-icon>
                <span class="time">{{ message.createdAt | TimestampPipe | date:'HH:mm' }}</span>
              </div>
              
              <div class="message-content" [innerHTML]="formatMessage(message.content)"></div>

              @if (message.suggestedActions?.length) {
                <div class="suggested-actions">
                  <h4>Gợi ý hành động:</h4>
                  <div class="action-chips">
                    @for (action of message.suggestedActions; track action) {
                      <mat-chip (click)="onActionClick(action)">
                        {{ action }}
                      </mat-chip>
                    }
                  </div>
                </div>
              }

              @if (message.type === 'ai' && message.charts) {
                <div class="charts">
                  @for (chart of message.charts; track chart.title) {
                    <div class="chart-container">
                      <h5>{{ chart.title }}</h5>
                      <canvas [id]="chart.id"></canvas>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="chat-input">
          <mat-form-field appearance="outline" class="full-width">
            <input matInput
                   [(ngModel)]="newMessage"
                   [matAutocomplete]="auto"
                   placeholder="Hỏi về tài chính của bạn..."
                   (keyup.enter)="sendMessage()">
            <mat-autocomplete #auto="matAutocomplete">
              @for (suggestion of suggestions; track suggestion) {
                <mat-option [value]="suggestion">{{ suggestion }}</mat-option>
              }
            </mat-autocomplete>
          </mat-form-field>
          <button mat-fab 
                  color="primary" 
                  (click)="sendMessage()" 
                  [disabled]="!newMessage">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .chat-card {
      margin: 1rem;
      height: calc(100vh - 2rem);
      max-height: 700px;
      min-height: 500px;
      width: 100%;
      max-width: 400px;
      display: flex;
      flex-direction: column;
      border-radius: 24px;
      background: #ffffff;
      box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
      position: relative;
      overflow: hidden;
    }

    .welcome-guide {
      padding: 1.5rem;
    }

    mat-card-header {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      padding: 1.25rem;
      
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: white;
        font-size: 1.25rem;
        margin: 0;
        
        mat-icon {
          font-size: 28px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px;
          border-radius: 12px;
          animation: pulse 2s infinite;
        }
      }

      .close-button {
        // background: rgba(255, 255, 255, 0.2);
        // padding: 8px;
        // border-radius: 12px;
        // transform: scale(0.9);
        // transition: all 0.3s ease;
        color: white;
      }
    }

    .chat-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      background: #f8fafc;
    }

    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      padding-bottom: 80px;
      scroll-behavior: smooth;
      
      &::-webkit-scrollbar {
        width: 6px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.8rem;
        margin: 0;
      }
    }

    .message {
      margin: 1rem 0;
      max-width: 85%;
      animation: slideIn 0.3s ease-out;
      
      &.user {
        margin-left: auto;
        .message-content {
          background: linear-gradient(135deg, #4f46e5, #6366f1);
          color: white;
          border-radius: 20px 20px 0 20px;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.2);
        }
      }
      
      &.ai {
        margin-right: auto;
        .message-content {
          background: white;
          border-radius: 20px 20px 20px 0;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }
      }
    }

    .message-content {
      padding: 1rem 1.25rem;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .chat-input {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      display: flex;
      gap: 1rem;
      align-items: center;

      mat-form-field {
        flex: 1;
        margin-bottom: -1.25em;

        ::ng-deep .mat-mdc-form-field-flex {
          background: white;
          border-radius: 16px;
          padding: 0.25rem 1rem;
        }
        
        ::ng-deep .mat-mdc-form-field-underline {
          display: none;
        }
      }

      button {
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        border-radius: 16px;
        transform: scale(0.9);
        transition: all 0.3s ease;
        
        &:hover:not([disabled]) {
          transform: scale(0.95);
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        
        &:disabled {
          background: #e2e8f0;
        }
        
        mat-icon {
          margin: 0;
          font-size: 20px;
        }
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .chat-card {
      margin: 0;
        height: calc(100vh - 246px);
        max-height: none;
        width: 100%;
        max-width: none;
        border-radius: 0;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        z-index: 1000;
      }

      mat-card-header {
        padding: 0.75rem;
        position: sticky;
        top: 0;
        z-index: 10;

        mat-card-title {
          font-size: 1.1rem;

          mat-icon {
            font-size: 24px;
            padding: 6px;
          }
        }
      }

      .messages {
        padding: 1rem;
        padding-bottom: 85px;

        .message {
          max-width: 90%;
          margin: 0.75rem 0;

          .message-content {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      }

      .chat-input {
        position: fixed;
        bottom: 95px;
        left: 0;
        right: 0;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

        mat-form-field {
          ::ng-deep .mat-mdc-form-field-flex {
            padding: 0.15rem 0.75rem;
          }

          input {
            font-size: 0.9rem;
          }
        }

        button {
          transform: scale(0.85);
          
          &:hover:not([disabled]) {
            transform: scale(0.9);
          }
        }
      }

      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        .chat-input {
          padding-bottom: calc(0.75rem + env(safe-area-inset-bottom));
        }
      }
    }

    @media (max-width: 320px) {
      .messages {
        padding: 0.75rem;
        
        .message {
          max-width: 95%;
          
          .message-content {
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
          }
        }
      }

      .chat-input {
        padding: 0.5rem;
        gap: 0.5rem;

        mat-form-field {
          ::ng-deep .mat-mdc-form-field-flex {
            padding: 0.1rem 0.5rem;
          }
        }

        button {
          transform: scale(0.8);
        }
      }
    }

    @media (max-height: 500px) and (orientation: landscape) {
      .chat-card {
        height: 100vh;
      }

      mat-card-header {
        padding: 0.5rem;
      }

      .messages {
        padding: 0.5rem;
        padding-bottom: 70px;
      }

      .chat-input {
        padding: 0.5rem;

        button {
          transform: scale(0.75);
        }
      }
    }
  `]
})
export class AIChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @Output() close = new EventEmitter<void>();
  
  messages: ChatMessage[] = [];
  newMessage = '';
  suggestions = [
    'Làm sao để tiết kiệm tiền hiệu quả?',
    'Phân tích chi tiêu của tôi tháng này',
    'Tôi nên cắt giảm chi tiêu ở đâu?',
    'So sánh chi tiêu của tôi với tháng trước',
    'Đề xuất kế hoạch tiết kiệm cho tôi'
  ];
  suggestedQuestions = [
    'Phân tích chi tiêu tháng này',
    'Làm sao để tiết kiệm hiệu quả?',
    'Tôi đang chi tiêu nhiều nhất ở đâu?',
    'Gợi ý kế hoạch tiết kiệm'
  ];

  constructor(
    private aiChatService: AIChatService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.aiChatService.messages$.subscribe(
      messages => this.messages = messages
    );
    this.aiChatService.loadChatHistory();
  }

  async sendMessage() {
    if (!this.newMessage.trim()) return;

    await this.aiChatService.sendMessage(this.newMessage);
    this.newMessage = '';
  }

  formatMessage(content: string): string {
    // Format message with markdown, highlights, etc
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  onActionClick(action: string) {
    this.newMessage = action;
    this.sendMessage();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = 
        this.messageContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  askQuestion(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }
} 