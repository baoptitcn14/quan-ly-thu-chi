import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, limit, collectionData, doc, updateDoc, writeBatch, getDocs } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, of, Subscription } from 'rxjs';
import { SavingSuggestion } from '../models/saving-suggestion.model';

export interface Notification {
  id?: string;
  userId: string;
  type: 'payment_reminder' | 'saving_suggestion';
  title: string;
  message: string;
  expenseId?: string;
  amount?: number;
  groupId?: string;
  groupName?: string;
  createdAt: Date;
  read: boolean;
  suggestedActions?: string[];
  priority?: 'high' | 'medium' | 'low';
  potentialSaving?: number;
}

interface NotificationSavingSuggestion extends SavingSuggestion {
  userId: string;
  createdAt: Date;
  read: boolean;
  potentialSaving: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notificationsCollection = 'notifications';
  private subscriptions = new Subscription();

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
    }
  }

  async sendPaymentReminder(data: {
    userId: string,
    expenseId: string,
    amount: number,
    groupId: string,
    groupName: string,
    expenseDesc: string
  }) {
    const notification: Notification = {
      userId: data.userId,
      type: 'payment_reminder',
      title: 'Nhắc nhở thanh toán',
      message: `Bạn có khoản chi tiêu "${data.expenseDesc}" cần thanh toán trong nhóm ${data.groupName}`,
      expenseId: data.expenseId,
      amount: data.amount,
      groupId: data.groupId,
      groupName: data.groupName,
      createdAt: new Date(),
      read: false
    };

    await addDoc(collection(this.firestore, this.notificationsCollection), notification);
  }

  getNotifications(): Observable<Notification[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return of([]);

    const notificationsRef = collection(this.firestore, this.notificationsCollection);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    return collectionData(q, { idField: 'id' }) as Observable<Notification[]>;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(this.firestore, this.notificationsCollection, notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  async markAllAsRead(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const batch = writeBatch(this.firestore);
    const notificationsRef = collection(this.firestore, this.notificationsCollection);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
  }

  async clearReadNotifications(): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return;

    const batch = writeBatch(this.firestore);
    const notificationsRef = collection(this.firestore, this.notificationsCollection);
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', true)
    );

    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }

  async sendSavingSuggestion(suggestion: NotificationSavingSuggestion) {
    await addDoc(collection(this.firestore, this.notificationsCollection), suggestion);
  }
} 