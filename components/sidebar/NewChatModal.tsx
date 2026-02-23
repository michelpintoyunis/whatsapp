'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, Profile } from '@/store/useChatStore';
import toast from 'react-hot-toast';

export default function NewChatModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const chats = useChatStore((state) => state.chats);
  const setChats = useChatStore((state) => state.setChats);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id) // exclude self
        .limit(50);

      if (error) {
        console.error(error);
        toast.error('Failed to load contacts');
      } else {
        setProfiles(data as Profile[]);
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [user]);

  const handleStartChat = async (targetUser: Profile) => {
    // 1. Check if chat already exists
    const existingChat = chats.find(c =>
      c.type === 'direct' && c.participants.some(p => p.id === targetUser.id)
    );

    if (existingChat) {
      setActiveChat(existingChat.id);
      onClose();
      return;
    }

    // 2. Create new chat instance
    const { data: newChat, error: chatError } = await supabase
      .from('chats')
      .insert({ type: 'direct' })
      .select()
      .single();

    if (chatError || !newChat) {
      console.error('FAILED TO CREATE CHAT:', chatError);
      toast.error('Could not create chat. Check console.');
      return;
    }

    // 3. Add both participants (Self + Target)
    const { error: partError } = await supabase
      .from('chat_participants')
      .insert([
        { chat_id: newChat.id, user_id: user!.id },
        { chat_id: newChat.id, user_id: targetUser.id }
      ]);

    if (partError) {
      toast.error('Could not add participants');
      return;
    }

    // Optimistic UI update or let `useChats` handle the refetch
    // We construct the Chat instance to conform to the Store exactly as useChats does
    const newChatObj = {
      id: newChat.id,
      type: 'direct' as const,
      group_name: null,
      participants: [
        { 
          id: user!.id, 
          username: user!.user_metadata?.username || 'Me', 
          avatar_url: user!.user_metadata?.avatar_url || '', 
          status_message: '', 
          last_seen: new Date().toISOString(), 
          public_key: '' 
        },
        targetUser
      ]
    };
    
    setChats([...chats, newChatObj]);
    setActiveChat(newChat.id);
    onClose();
  };

  const filtered = profiles.filter(p => p.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="absolute inset-0 z-50 bg-wa-bg-panel w-full flex flex-col translate-x-0 transition-transform duration-300">
      <header className="h-[108px] bg-[#008069] text-white flex items-end px-6 pb-4 shrink-0 transition-colors">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="hover:opacity-80 transition-opacity"><ArrowLeft size={24} /></button>
          <span className="text-[19px] font-medium">New chat</span>
        </div>
      </header>
      
      <div className="p-2 border-b border-wa-border shrink-0 bg-wa-bg-panel">
        <div className="bg-wa-bg-main rounded-lg flex items-center px-3 h-[35px]">
          <Search size={18} className="text-wa-text-secondary mr-4" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search contacts"
            className="bg-transparent w-full text-sm outline-none text-wa-text-primary placeholder:text-wa-text-secondary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-wa-bg-panel select-none">
        <div className="py-2 px-6 text-wa-primary text-sm uppercase tracking-wider mb-2 mt-2">
          Contacts on WhatsApp Clone
        </div>
        
        {loading ? (
          <div className="flex justify-center mt-8 text-wa-primary"><Loader2 className="animate-spin" /></div>
        ) : filtered.length > 0 ? (
          filtered.map(profile => (
            <div 
              key={profile.id}
              onClick={() => handleStartChat(profile)}
              className="flex items-center px-4 hover:bg-wa-bg-main cursor-pointer transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-wa-border overflow-hidden shrink-0 mr-4">
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 border-b border-wa-border py-4 flex flex-col justify-center">
                <span className="text-wa-text-primary text-[17px] mb-1">{profile.username}</span>
                <span className="text-wa-text-secondary text-[14px] truncate">{profile.status_message}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-wa-text-secondary py-8 text-sm">
            No contacts found matching &apos;{search}&apos;.
          </div>
        )}
      </div>
    </div>
  );
}
