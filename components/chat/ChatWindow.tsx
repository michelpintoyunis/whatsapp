'use client';

import { useAuth } from '@/context/AuthContext';
import { useChatStore } from '@/store/useChatStore';
import { ArrowLeft, MoreVertical, Search, Video, Phone } from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ChatWindow() {
  const { user } = useAuth();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const chats = useChatStore((state) => state.chats);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const typingUsers = useChatStore((state) => state.typingUsers);

  const chat = chats.find(c => c.id === activeChatId);
  const targetUser = chat?.participants.find(p => p.id !== user?.id);
  const isOnline = targetUser ? onlineUsers[targetUser.id] : false;
  const isTargetTyping = targetUser ? typingUsers[activeChatId!]?.includes(targetUser.id) : false;
  
  const markAsRead = useChatStore((state) => state.markAsRead);
  const messages = useChatStore((state) => state.messages[activeChatId!] || []);

  useEffect(() => {
    if (!activeChatId || !user) return;
    const hasUnread = messages.some(m => !m.is_read && m.sender_id !== user.id);
    
    if (hasUnread) {
      markAsRead(activeChatId, user.id);
      
      supabase
        .from('messages')
        .update({ is_read: true })
        .match({ chat_id: activeChatId, is_read: false })
        .neq('sender_id', user.id)
        .then(({ error }) => {
          if (error) console.error('Failed to mark as read', error);
        });
    }
  }, [activeChatId, messages, user, markAsRead]);

  return (
    <div className="flex flex-col h-full w-full bg-wa-bg-main relative">
      {/* Texture background */}
      <div className="absolute inset-0 wa-bg-texture opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="h-[59px] bg-wa-bg-panel flex items-center justify-between px-4 border-b border-wa-border shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Back button for mobile */}
          <button 
            className="md:hidden text-wa-text-secondary hover:text-wa-text-primary mr-1" 
            onClick={() => setActiveChat(null)}
          >
            <ArrowLeft size={24} />
          </button>
          
          <div className="w-10 h-10 rounded-full bg-wa-border overflow-hidden shrink-0 cursor-pointer">
            {targetUser && (
              <img src={targetUser.avatar_url || `https://ui-avatars.com/api/?name=${targetUser.username}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="flex flex-col cursor-pointer">
            <span className="text-wa-text-primary text-[16px] leading-[21px]">
              {chat?.group_name || targetUser?.username || 'Unknown'}
            </span>
            <span className={`text-[13px] leading-[20px] transition-all flex items-center gap-1 ${isTargetTyping ? 'text-wa-primary' : 'text-wa-text-secondary'}`}>
              {isTargetTyping ? (
                <>
                  <span className="italic">typing</span>
                  <span className="flex gap-[2px] mt-1">
                    <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full"></span>
                    <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full" style={{ animationDelay: '0.2s' }}></span>
                    <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full" style={{ animationDelay: '0.4s' }}></span>
                  </span>
                </>
              ) : isOnline ? 'online' : 'click here for contact info'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-wa-text-secondary">
          <button 
            onClick={() => toast('Video calls coming soon!', { icon: '🚧' })} 
            className="hover:bg-wa-border p-2 rounded-full transition-colors hidden sm:block"><Video size={20} /></button>
          <button 
            onClick={() => toast('Voice calls coming soon!', { icon: '🚧' })} 
            className="hover:bg-wa-border p-2 rounded-full transition-colors hidden sm:block"><Phone size={20} /></button>
          <button 
            onClick={() => toast('Search in chat coming soon!', { icon: '🚧' })} 
            className="border-l border-wa-border pl-4 hover:text-wa-text-primary transition-colors hidden sm:block"><Search size={20} /></button>
          <button 
            onClick={() => toast('Menu coming soon!', { icon: '🚧' })} 
            className="hover:bg-wa-border p-2 rounded-full transition-colors"><MoreVertical size={20} /></button>
        </div>
      </header>

      {/* Message List area */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 custom-scrollbar">
        <MessageList chatId={activeChatId!} />
      </main>

      {/* Input area */}
      <footer className="shrink-0 z-10 px-4 py-3 bg-wa-bg-panel border-t border-wa-border">
        <MessageInput chatId={activeChatId!} targetUser={targetUser} />
      </footer>
    </div>
  );
}
