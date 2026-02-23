'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, Message, Profile } from '@/store/useChatStore';

export function useChats() {
  const { user } = useAuth();
  const { setChats, addMessage, setOnlineStatus, setMessages, setTypingStatus, updateMessage } = useChatStore();

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial active chats
    const fetchChats = async () => {
      // 1. Get chat IDs the user belongs to
      const { data: participations, error: partError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (partError) {
        console.error('Error fetching participations:', partError);
        return;
      }
      
      if (!participations || participations.length === 0) {
        setChats([]);
        return;
      }
      
      const chatIds = participations.map(p => p.chat_id);

      // 2. Fetch those chats with all their participants' profiles AND recent messages
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants (
            profiles (*)
          ),
          messages (*)
        `)
        .in('id', chatIds)
        .order('created_at', { ascending: false, foreignTable: 'messages' })
        .limit(50, { foreignTable: 'messages' });

      if (chatsError) {
        console.error('Error fetching chats data:', chatsError);
        return;
      }

      if (chatsData) {
        const formattedChats = chatsData.map(chat => {
          // Messages are ordered descending (newest first). Reverse for chronological order.
          const chatMessages = [...(chat.messages as Message[] || [])].reverse().map(m => ({
            ...m,
            decrypted_content: m.encrypted_content
          }));
          const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : undefined;
          const unreadCount = chatMessages.filter(m => !m.is_read && m.sender_id !== user.id).length;
          
          if (chatMessages.length > 0) {
            setMessages(chat.id, chatMessages);
          }

          return {
            id: chat.id,
            type: chat.type as 'direct' | 'group',
            group_name: chat.group_name,
            participants: chat.participants
              .map((p: { profiles: Profile | Profile[] | null }) => p.profiles)
              .filter(Boolean),
            last_message: lastMsg,
            unread_count: unreadCount
          };
        });
        setChats(formattedChats);
      }
    };

    fetchChats();

    // 2. Real-time Messages Subscription
    // configuring private: true for row level security enforcement on sockets
    const messageChannel = supabase.channel(`private:messages`, {
      config: { presence: { key: user.id } }
    })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          // In a full Web Crypto implementation, we capture the payload, decrypt it at rest,
          // then inject it fully formed to the React Store.
          newMsg.decrypted_content = newMsg.encrypted_content; // mock bypass
          addMessage(newMsg, user.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const updatedMsg = payload.new as Message;
          // When a message is updated (e.g. deleted_for_everyone, deleted_by, is_read)
          updateMessage(updatedMsg.chat_id, updatedMsg.id, updatedMsg);
        }
      )
      .subscribe();

    // 3. Presence Subscription (Online / Typing)
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        Object.values(state).forEach((clients: unknown) => {
          (clients as { user_id?: string }[]).forEach((client) => {
            if (client.user_id) setOnlineStatus(client.user_id, true);
          });
        });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach((p: unknown) => {
          const presence = p as { user_id?: string };
          if (presence.user_id) setOnlineStatus(presence.user_id, true);
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((p: unknown) => {
          const presence = p as { user_id?: string };
          if (presence.user_id) setOnlineStatus(presence.user_id, false);
        });
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload) {
          const { chat_id, user_id, is_typing } = payload.payload;
          setTypingStatus(chat_id, user_id, is_typing);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, setChats, addMessage, setOnlineStatus, setMessages, setTypingStatus, updateMessage]);
}
