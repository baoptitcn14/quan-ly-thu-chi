import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AnalysisManagerService } from '../../../../core/services/analysis-manager.service';
import { AuthService } from '../../../../core/services/auth.service';
import { SavingSuggestion } from '../../../../core/models/saving-suggestion.model';

export interface Notification {
    id?: string;
    userId: string;
    type: 'payment_reminder' | 'saving_suggestion';
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
}

@Component({
    selector: 'app-saving-suggestions',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
    template: `
    <mat-card class="suggestions-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>lightbulb</mat-icon>
          Gợi ý tiết kiệm thông minh
        </mat-card-title>
        
        <button mat-raised-button 
                color="primary" 
                (click)="analyzeSpendings()"
                [disabled]="isAnalyzing">
          <mat-icon>analytics</mat-icon>
          {{ isAnalyzing ? 'Đang phân tích...' : 'Phân tích chi tiêu' }}
        </button>
      </mat-card-header>

      <mat-card-content>
        @for (suggestion of suggestions; track suggestion.title) {
          <div class="suggestion-item" [class]="suggestion.priority">
            <div class="suggestion-header">
              <mat-icon>{{ getSuggestionIcon(suggestion.type) }}</mat-icon>
              <h3>{{ suggestion.title }}</h3>
            </div>
            
            <p class="message">{{ suggestion.message }}</p>
            
            @if (suggestion.potentialSaving) {
              <div class="potential-saving">
                Tiết kiệm tiềm năng: {{ suggestion.potentialSaving | number:'1.0-0' }}đ
              </div>
            }

            <div class="actions">
              <h4>Gợi ý hành động:</h4>
              <ul>
                @for (action of suggestion.suggestedActions; track action) {
                  <li>{{ action }}</li>
                }
              </ul>
            </div>
          </div>
        }

        @if (suggestions.length === 0) {
          <div class="empty-state">
            <mat-icon>thumb_up</mat-icon>
            <p>Bạn đang quản lý chi tiêu rất tốt!</p>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
    styles: [`

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .suggestions-card {
      margin: 1rem;
      
      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #1e293b;
        
        mat-icon {
          color: #eab308;
        }
      }
    }

    .suggestion-item {
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid;

      &.high { border-left-color: #ef4444; }
      &.medium { border-left-color: #f59e0b; }
      &.low { border-left-color: #22c55e; }

      .suggestion-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        }

        mat-icon {
          color: #64748b;
        }
      }

      .message {
        color: #475569;
        margin-bottom: 1rem;
      }

      .potential-saving {
        font-weight: 500;
        color: #22c55e;
        margin-bottom: 1rem;
      }

      .actions {
        h4 {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 0.5rem;
        }

        ul {
          margin: 0;
          padding-left: 1.5rem;
          
          li {
            color: #475569;
            margin-bottom: 0.25rem;
          }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #64748b;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #22c55e;
      }
    }


  `]
})
export class SavingSuggestionsComponent implements OnInit, OnDestroy {
    suggestions: SavingSuggestion[] = [];
    isAnalyzing = false;

    constructor(
        private analysisManager: AnalysisManagerService,
        private authService: AuthService
    ) {
        this.analysisManager.suggestions$.subscribe(
            suggestions => this.suggestions = suggestions
        );
    }

    ngOnInit() {
        const userId = this.authService.getCurrentUserId();
        if (userId) {
            this.analysisManager.startRealtimeSuggestions(userId);
        }
    }

    ngOnDestroy() {
        this.analysisManager.stopRealtimeSuggestions();
    }

    async analyzeSpendings() {
        this.isAnalyzing = true;
        try {
            await this.analysisManager.startAnalysis();
        } catch (error) {
            console.error('Lỗi khi phân tích chi tiêu:', error);
        } finally {
            this.isAnalyzing = false;
        }
    }

    getSuggestionIcon(type: string): string {
        switch (type) {
            case 'category_alert':
                return 'trending_up';
            case 'unusual_spending':
                return 'warning';
            case 'saving_opportunity':
                return 'savings';
            default:
                return 'info';
        }
    }
} 