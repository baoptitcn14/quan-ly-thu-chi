import { Injectable, OnDestroy } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, limit } from '@angular/fire/firestore';
import { collectionData } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
import { GroupMessage } from '../models/group.model';
import { AuthService } from './auth.service';
import { first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GroupMessageService {
  private messagesCollection = 'group_messages';

  constructor(
    private firestore: Firestore,
    private authService: AuthService
  ) {}

  getMessages(groupId: string, limitCount: number = 50): Observable<GroupMessage[]> {
    const messagesRef = collection(this.firestore, this.messagesCollection);
    const q = query(
      messagesRef,
      where('groupId', '==', groupId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<GroupMessage[]>;
  }

  async sendMessage(groupId: string, content: string): Promise<void> {
    const userId = this.authService.getCurrentUserId();
    const user = await this.authService.getCurrentUser().pipe(first()).toPromise();
    if (!userId || !user) throw new Error('User not authenticated');

    const message: Partial<GroupMessage> = {
      groupId,
      userId,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL,
      content,
      createdAt: new Date()
    };

    await addDoc(collection(this.firestore, this.messagesCollection), message);
  }
} 