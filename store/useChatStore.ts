import { create } from 'zustand';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  status_message: string;
  last_seen: string;
  public_key: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  group_name: string | null;
  participants: Profile[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  encrypted_content: string;
  decrypted_content?: string; // Stored in memory only after decryption
  is_delivered: boolean;
  is_read: boolean;
  deleted_for_everyone?: boolean;
  deleted_by?: string[];
  created_at: string;
}

interface ChatState {
  activeChatId: string | null;
  chats: Chat[];
  messages: Record<string, Message[]>;
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, string[]>;
  setActiveChat: (id: string | null) => void;
  setChats: (chats: Chat[]) => void;
  addMessage: (message: Message, currentUserId?: string) => void;
  setMessages: (chatId: string, messages: Message[]) => void;
  setOnlineStatus: (userId: string, isOnline: boolean) => void;
  setTypingStatus: (chatId: string, userId: string, isTyping: boolean) => void;
  markAsRead: (chatId: string, userId: string) => void;
  updateMessage: (chatId: string, messageId: string, updates: Partial<Message>) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChatId: null,
  chats: [],
  messages: {},
  onlineUsers: {},
  typingUsers: {},
  setActiveChat: (id) => set({ activeChatId: id }),
  setChats: (chats) => set({ chats }),
  addMessage: (message, currentUserId) => set((state) => {
    const chatMsgs = state.messages[message.chat_id] || [];
    if (chatMsgs.find(m => m.id === message.id)) return state; // Prevent dupes

    const updatedChats = state.chats.map(chat => {
      if (chat.id === message.chat_id) {
        const isActive = state.activeChatId === message.chat_id;
        const isFromMe = currentUserId ? message.sender_id === currentUserId : false;
        const newUnreadCount = (!isFromMe && !isActive) ? (chat.unread_count || 0) + 1 : (chat.unread_count || 0);
        return {
          ...chat,
          last_message: message,
          unread_count: newUnreadCount
        };
      }
      return chat;
    });

    return {
      messages: {
        ...state.messages,
        [message.chat_id]: [...chatMsgs, message]
      },
      chats: updatedChats
    };
  }),
  setMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages,
    }
  })),
  setOnlineStatus: (userId, isOnline) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: isOnline
    }
  })),
  setTypingStatus: (chatId, userId, isTyping) => set((state) => {
    const currentTyping = state.typingUsers[chatId] || [];
    const newTyping = isTyping
      ? (currentTyping.includes(userId) ? currentTyping : [...currentTyping, userId])
      : currentTyping.filter(id => id !== userId);
    return {
      typingUsers: {
        ...state.typingUsers,
        [chatId]: newTyping
      }
    };
  }),
  markAsRead: (chatId, userId) => set((state) => {
    const chatMsgs = state.messages[chatId] || [];
    let updatedMsgs = false;
    const newMsgs = chatMsgs.map(m => {
      if (!m.is_read && m.sender_id !== userId) {
        updatedMsgs = true;
        return { ...m, is_read: true };
      }
      return m;
    });

    const updatedChats = state.chats.map(c => {
      if (c.id === chatId) {
        return { ...c, unread_count: 0 };
      }
      return c;
    });

    if (updatedMsgs) {
      return { messages: { ...state.messages, [chatId]: newMsgs }, chats: updatedChats };
    }
    return { chats: updatedChats };
  }),
  updateMessage: (chatId, messageId, updates) => set((state) => {
    const chatMsgs = state.messages[chatId] || [];
    const newMsgs = chatMsgs.map(m => m.id === messageId ? { ...m, ...updates } : m);
    
    // Also update last_message in chat if it's the one modified
    const updatedChats = state.chats.map(c => {
      if (c.id === chatId && c.last_message?.id === messageId) {
        return { ...c, last_message: { ...c.last_message, ...updates } };
      }
      return c;
    });

    return {
      messages: { ...state.messages, [chatId]: newMsgs },
      chats: updatedChats
    };
  }),
}));
