'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatStore, Profile } from '@/store/useChatStore';
import { Smile, Paperclip, Mic, Send } from 'lucide-react';
// import { encryptMessage, deriveSharedKey, importPublicKey } from '@/lib/crypto';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

export default function MessageInput({ chatId, targetUser }: { chatId: string, targetUser?: Profile }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const addMessage = useChatStore((state) => state.addMessage);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleBroadcastTyping = (typing: boolean) => {
    if (!user) return;
    const channel = supabase.getChannels().find(c => c.topic === 'realtime:online-users');
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { chat_id: chatId, user_id: user.id, is_typing: typing }
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      handleBroadcastTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      handleBroadcastTyping(false);
    }, 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !user || !targetUser || isSending) return;

    setIsSending(true);
    const messageText = text;
    setText('');
    
    // Clear typing indicator immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping) {
      setIsTyping(false);
      handleBroadcastTyping(false);
    }

    try {
      // For now, since Phase 7 (Full E2E Enc) is complex, we just store pseudo-encrypted messages.
      // E2EE requires storing and matching local IndexedDB Private Keys which isn't wired to the new auth yet.
      
      const payload = {
        chat_id: chatId,
        sender_id: user.id,
        encrypted_content: messageText, // Temporary plain storage for demo until crypto keys are enabled
        is_delivered: true,
        is_read: false,
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error('Failed to send message.');
        console.error(error);
        return;
      }
      
      // Inject to local state while waiting for realtime sync if necessary
      if (data) {
        data.decrypted_content = messageText;
        addMessage(data, user.id);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex items-end gap-2 bg-wa-bg-panel w-full">
      <div className="flex items-center gap-4 text-wa-text-secondary pb-3 pl-2 shrink-0">
        <button 
          type="button"
          onClick={() => toast('Emojis coming soon!', { icon: '🚧' })}
          className="hover:text-wa-text-primary transition-colors disabled:opacity-50"><Smile size={26} strokeWidth={1.5} /></button>
        <button 
          type="button"
          onClick={() => toast('Attachments coming soon!', { icon: '🚧' })}
          className="hover:text-wa-text-primary transition-colors disabled:opacity-50"><Paperclip size={24} strokeWidth={1.5} /></button>
      </div>

      <form 
        onSubmit={handleSend} 
        className="flex-1 bg-wa-bg-main rounded-lg min-h-[42px] max-h-[140px] flex items-center px-4 my-[7px]"
      >
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Type a message"
          className="w-full bg-transparent text-wa-text-primary outline-none py-2 text-[15px] placeholder:text-wa-text-secondary"
          disabled={isSending}
        />
      </form>

      <div className="flex items-center justify-center text-wa-text-secondary pb-3 pr-2 shrink-0 w-10">
        {text.length > 0 ? (
          <button 
            type="submit" 
            onClick={handleSend}
            disabled={isSending}
            className="text-wa-text-secondary hover:text-wa-text-primary transition-colors disabled:opacity-50"
          >
            <Send size={24} strokeWidth={1.5} />
          </button>
        ) : (
          <button 
            type="button"
            onClick={() => toast('Voice messages coming soon!', { icon: '🚧' })}
            className="hover:text-wa-text-primary transition-colors">
            <Mic size={24} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );
}
