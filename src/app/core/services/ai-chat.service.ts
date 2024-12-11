import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs, Timestamp } from '@angular/fire/firestore';
import * as tf from '@tensorflow/tfjs';
import * as tfconv from '@tensorflow/tfjs-converter';
import { firstValueFrom } from 'rxjs';
import { TransactionService } from './transaction.service';
import { SpendingAnalysisService } from './spending-analysis.service';

export interface ChatMessage {
    id?: string;
    userId: string;
    content: string;
    type: 'user' | 'ai';
    createdAt: Date;
    category?: string;
    relatedAmount?: number;
    suggestedActions?: string[];
    charts?: { title: string; id: string }[];
}

interface BudgetStatus {
    [category: string]: {
        limit: number;
        used: number;
        remaining: number;
    }
}

interface CategoryAverage {
    [category: string]: {
        total: number;
        count: number;
    }
}

interface SpendingPatterns {
    categoryTrends: { [key: string]: Array<{ amount: number, date: Date }> };
    weeklyPatterns: { [key: string]: number };
    monthlyTotals: { [key: string]: number };
    frequentCategories: string[];
}

interface Transaction {
    category: string;
    amount: number;
    date: any; // Timestamp or Date
}

@Injectable({
    providedIn: 'root'
})
export class AIChatService {
    private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
    messages$ = this.messagesSubject.asObservable();
    private readonly chatCollection = 'ai_chat_history';
    private model: tf.GraphModel | null = null;
    private tokenizer: any = null;
    private readonly MAX_LENGTH = 100;

    constructor(
        private firestore: Firestore,
        private authService: AuthService,
        private transactionService: TransactionService,
        private spendingAnalysisService: SpendingAnalysisService
    ) {
        this.initializeModel();
    }

    private async initializeModel() {
        try {
            await tf.ready();
            this.model = await tfconv.loadGraphModel('/assets/models/model.json');
            
            this.tokenizer = {
                encode: (text: string) => {
                    return text.toLowerCase().split(' ').map(word => {
                        return this.hashString(word);
                    });
                },
                decode: (tokens: number[]) => {
                    return tokens.map(token => this.reverseHash(token)).join(' ');
                }
            };

            console.log('Model đã được khởi tạo thành công');
        } catch (error) {
            console.error('Lỗi khởi tạo model:', error);
        }
    }

    async generateResponse(input: string): Promise<string> {
        if (!this.model || !this.tokenizer) {
            throw new Error('Model chưa được khởi tạo');
        }

        try {
            const tokens = this.tokenizer.encode(input);
            
            const inputTensor = tf.tensor2d([tokens], [1, tokens.length]);

            const prediction = await tf.tidy(() => {
                const output = this.model!.predict(inputTensor) as tf.Tensor;
                return output.argMax(-1);
            });

            const result = await prediction.array() as number[][];
            const response = this.tokenizer.decode(result[0]);

            inputTensor.dispose();
            prediction.dispose();

            return this.formatResponse(response);

        } catch (error) {
            console.error('Lỗi khi tạo phản hồi:', error);
            return 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau.';
        }
    }

    async sendMessage(content: string): Promise<void> {
        const userId = this.authService.getCurrentUserId();
        if (!userId) return;

        // Lưu tin nhắn người dùng
        const userMessage: ChatMessage = {
            userId,
            content,
            type: 'user',
            createdAt: new Date()
        };
        await this.saveMessage(userMessage);

        try {
            // Phân tích nội dung và tạo phản hồi
            const transactions = await firstValueFrom(this.transactionService.getTransactions());
            const spendingItems = transactions.map(t => ({
                amount: t.amount,
                category: t.category,
                date: t.date instanceof Date ? t.date : t.date.toDate(),
                note: t.description
            }));

            const analysis = await this.spendingAnalysisService.analyzeSpending(content, spendingItems);
            
            // Tạo tin nhắn phản hồi từ AI
            const aiMessage: ChatMessage = {
                userId,
                content: analysis,
                type: 'ai',
                createdAt: new Date(),
                suggestedActions: this.extractSuggestedActions(analysis)
            };
            await this.saveMessage(aiMessage);

        } catch (error) {
            console.error('Lỗi khi xử lý tin nhắn:', error);
            const errorMessage: ChatMessage = {
                userId,
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
                type: 'ai',
                createdAt: new Date()
            };
            await this.saveMessage(errorMessage);
        }

        await this.loadChatHistory();
    }

    private formatResponse(response: string): string {
        return response
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/([.!?])\s*(?=[A-Z])/g, '$1\n\n');
    }

    private extractSuggestedActions(response: string): string[] {
        const actionRegex = /(?:nên|hãy|cần|có thể)\s+([^.!?]+)[.!?]/gi;
        const matches = response.match(actionRegex) || [];
        return matches.map(action => action.trim());
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    private reverseHash(hash: number): string {
        return hash.toString();
    }

    async loadChatHistory(): Promise<void> {
        const userId = this.authService.getCurrentUserId();
        if (!userId) return;

        const chatRef = collection(this.firestore, this.chatCollection);
        const q = query(
            chatRef,
            where('userId', '==', userId),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as ChatMessage[];

        this.messagesSubject.next(messages);
    }

    private async saveMessage(message: ChatMessage): Promise<void> {
        await addDoc(collection(this.firestore, this.chatCollection), message);
    }
} 