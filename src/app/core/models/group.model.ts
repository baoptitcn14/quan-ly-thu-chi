export interface Group {
  id?: string;
  name: string;
  description?: string;
  memberIds: string[];
  members: GroupMember[];
  createdBy: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface GroupExpense {
  id?: string;
  description: string;
  amount: number;
  paidBy: string;
  splitBetween: {
    userId: string;
    displayName: string;
    amount: number;
    status: 'pending' | 'paid';
  }[];
  date: any; // hoặc Date | firebase.firestore.Timestamp
  category: string;
  groupId: string;
}

export interface SplitDetail {
  userId: string;
  displayName: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt?: Date;
}

export interface GroupMessage {
  id?: string;
  groupId: string;
  userId: string;
  displayName: string;
  photoURL?: string;
  content: string;
  createdAt: Date;
} 