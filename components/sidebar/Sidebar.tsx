'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatStore } from '@/store/useChatStore';
import { MessageSquare, MoreVertical, Search, Users, CircleDashed, LogOut, ChevronDown } from 'lucide-react';
import NewChatModal from './NewChatModal';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

export default function Sidebar({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const chats = useChatStore((state) => state.chats);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const setChats = useChatStore((state) => state.setChats);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const [showNewChat, setShowNewChat] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!user) return;
    
    const { error } = await supabase
      .from('chat_participants')
      .delete()
      .match({ chat_id: chatId, user_id: user.id });
      
    if (error) {
      toast.error('Could not delete chat');
      return;
    }
    
    if (activeChatId === chatId) setActiveChat(null);
    setChats(chats.filter(c => c.id !== chatId));
  };

  return (
    <div className={`flex flex-col bg-wa-bg-panel w-full h-full border-r border-wa-border ${className}`}>
      {/* Header */}
      <header className="h-[59px] bg-wa-bg-panel flex items-center justify-between px-4 border-b border-wa-border shrink-0">
        <div className="w-10 h-10 rounded-full bg-wa-border overflow-hidden cursor-pointer">
          {user ? (
            <img src={`https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-500" />
          )}
        </div>
        <div className="flex items-center gap-4 text-wa-text-secondary">
          <button 
            onClick={() => toast('Communities coming soon!', { icon: '🚧' })} 
            className="hover:bg-wa-border p-2 rounded-full transition-colors hidden sm:block"><Users size={20} /></button>
          <button 
            onClick={() => toast('Status coming soon!', { icon: '🚧' })} 
            className="hover:bg-wa-border p-2 rounded-full transition-colors hidden sm:block"><CircleDashed size={20} /></button>
          <button onClick={() => setShowNewChat(true)} className="hover:bg-wa-border p-2 rounded-full transition-colors"><MessageSquare size={20} /></button>
          <button onClick={handleLogout} className="hover:bg-wa-border p-2 rounded-full transition-colors"><LogOut size={20} /></button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="p-2 border-b border-wa-border shrink-0">
        <div className="bg-wa-bg-main rounded-lg flex items-center px-3 h-[35px]">
          <Search size={18} className="text-wa-text-secondary mr-4" />
          <input 
            type="text"
            placeholder="Search or start new chat"
            className="bg-transparent w-full text-sm outline-none text-wa-text-primary placeholder:text-wa-text-secondary"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {chats.length > 0 ? chats.map((chat) => {
          const isActive = activeChatId === chat.id;
          // In a real app we'll pick the other participant's profile
          const target = chat.participants.find(p => p.id !== user?.id) || chat.participants[0];
          const isTargetTyping = typingUsers[chat.id]?.includes(target?.id || '');
          
          return (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat.id)}
              className={`flex items-center px-3 hover:bg-wa-bg-main cursor-pointer transition-colors group relative ${isActive ? 'bg-wa-bg-main' : ''}`}
            >
              <div className="w-12 h-12 rounded-full bg-wa-border overflow-hidden shrink-0 mr-3">
                <img src={target?.avatar_url || `https://ui-avatars.com/api/?name=${target?.username || 'G'}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 border-b border-wa-border py-3 flex flex-col justify-center pr-4">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-wa-text-primary text-[16px] truncate pr-2">{chat.group_name || target?.username || 'Unknown'}</span>
                  <span suppressHydrationWarning className={`text-[12px] shrink-0 ${chat.unread_count && chat.unread_count > 0 ? 'text-wa-primary font-medium' : 'text-wa-text-secondary'}`}>
                    {chat.last_message ? new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center relative">
                  <span className={`text-[13px] truncate pr-4 ${isTargetTyping ? 'text-wa-primary font-medium' : 'text-wa-text-secondary'}`}>
                    {isTargetTyping ? (
                      <div className="flex items-center gap-1">
                        <span className="italic">typing</span>
                        <span className="flex gap-[2px]">
                          <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full"></span>
                          <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full" style={{ animationDelay: '0.2s' }}></span>
                          <span className="animate-bounce w-1 h-1 bg-wa-primary rounded-full" style={{ animationDelay: '0.4s' }}></span>
                        </span>
                      </div>
                    ) : (
                      <>
                        {chat.last_message && chat.last_message.sender_id === user?.id && <span className="mr-1">You:</span>}
                        {chat.last_message ? chat.last_message.encrypted_content : 'No messages yet'}
                      </>
                    )}
                  </span>
                  
                  <div className="flex items-center gap-2 shrink-0 h-5">
                    {/* Delete chat button (shows on hover) */}
                    <button 
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-wa-text-secondary hover:text-wa-text-primary bg-wa-bg-panel/80 rounded-full"
                      title="Delete chat"
                    >
                      <ChevronDown size={20} />
                    </button>
                    
                    {chat.unread_count && chat.unread_count > 0 ? (
                      <span className="bg-wa-primary text-white text-[11px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 font-medium shadow-sm transition-all duration-300 scale-100">
                        {chat.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex items-center justify-center h-full text-wa-text-secondary text-sm">
            No chats found. Click the message icon to start one.
          </div>
        )}
      </div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
}
