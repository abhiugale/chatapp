export interface User {
  _id: string;
  name: string;
  email: string;
  isOnline: boolean;
  lastSeen?: string;
  lastMessage?: string;
  conversationId?: string;
}

export interface Message {
  _id: string;
  text: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  conversationId: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  token: string;
}