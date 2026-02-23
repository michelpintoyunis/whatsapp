'use client';

import { useEffect, useRef, useMemo, useState } from 'react';
import { useChatStore, Message } from '@/store/useChatStore';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';

export default function MessageList({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const updateMessage = useChatStore((state) => state.updateMessage);
  const storedMessages = useChatStore((state) => state.messages[chatId]);
  
  const messages = useMemo(() => storedMessages || [], [storedMessages]);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleDeleteForMe = async (msg: Message) => {
    setActiveMenu(null);
    if (!user) return;

    // Optimistic update
    const currentDeletedBy = msg.deleted_by || [];
    updateMessage(chatId, msg.id, { deleted_by: [...currentDeletedBy, user.id] });

    // Enviar a Supabase para añadir mi id al array
    // Since supabase array append requires raw sql or updating the whole array, we'll read and update or use an rpc.
    // For simplicity with JS SDK, we just push the whole updated array.
    const { error } = await supabase
      .from('messages')
      .update({ deleted_by: [...currentDeletedBy, user.id] })
      .match({ id: msg.id });

    if (error) {
      toast.error('Could not delete for you');
      // Roleback theoretically...
      updateMessage(chatId, msg.id, { deleted_by: currentDeletedBy });
    }
  };

  const handleDeleteForEveryone = async (msg: Message) => {
    setActiveMenu(null);
    // Optimistic
    updateMessage(chatId, msg.id, { deleted_for_everyone: true });

    const { error } = await supabase
      .from('messages')
      .update({ deleted_for_everyone: true })
      .match({ id: msg.id });

    if (error) {
      toast.error('Could not delete for everyone');
      updateMessage(chatId, msg.id, { deleted_for_everyone: false });
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col gap-1 py-2 relative z-10 w-full max-w-[1000px] mx-auto px-[5%] md:px-[8%]">
      {messages.length === 0 ? (
        <div className="flex justify-center my-4">
          <div className="bg-[#ffeecd] text-[#54656f] text-[12.5px] px-4 py-2 rounded-lg text-center shadow-sm">
            🔒 Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
          </div>
        </div>
      ) : (
        messages.map((msg: Message, index: number) => {
          // If deleted for me, do not render
          if (user && msg.deleted_by?.includes(user.id)) return null;

          const isLocal = msg.sender_id === user?.id;
          
          // Add some margin top if previous message was from a different sender
          const prevMsg = index > 0 ? messages[index - 1] : null;
          const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;

          const msgAgeMs = new Date().getTime() - new Date(msg.created_at).getTime();
          const canDeleteForEveryone = isLocal && (msgAgeMs < 10 * 60 * 1000) && !msg.deleted_for_everyone;
          
          return (
            <div 
              key={msg.id} 
              className={`flex ${isLocal ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : ''} group`}
            >
              <div 
                className={`
                  relative max-w-[85%] md:max-w-[75%] px-2 pt-[6px] pb-[8px] rounded-lg shadow-sm text-[14px] leading-[19px]
                  ${isLocal ? 'bg-wa-bubble-out rounded-tr-none' : 'bg-wa-bubble-in rounded-tl-none'}
                `}
              >
                {/* Tail SVG can be added here for the first message in group */}
                
                {/* Menú Contextual Chevron */}
                {!msg.deleted_for_everyone && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenu(activeMenu === msg.id ? null : msg.id);
                    }}
                    className="absolute top-1 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-wa-text-secondary bg-linear-to-l from-[#d9fdd3] to-transparent rounded-bl-xl z-20"
                    style={{ background: isLocal ? 'linear-gradient(to right, transparent, #d9fdd3 40%)' : 'linear-gradient(to right, transparent, #ffffff 40%)' }}
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Modal actions */}
                {activeMenu === msg.id && (
                  <div className="absolute top-6 right-2 bg-wa-bg-panel shadow-lg rounded-md py-2 z-30 min-w-[160px] border border-wa-border" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleDeleteForMe(msg)}
                      className="w-full text-left px-4 py-2 hover:bg-wa-bg-main text-wa-text-primary text-[14px]"
                    >
                      Delete for me
                    </button>
                    {canDeleteForEveryone && (
                      <button 
                        onClick={() => handleDeleteForEveryone(msg)}
                        className="w-full text-left px-4 py-2 hover:bg-wa-bg-main text-wa-text-primary text-[14px]"
                      >
                        Delete for everyone
                      </button>
                    )}
                  </div>
                )}
                
                {msg.deleted_for_everyone ? (
                  <span className="text-wa-text-secondary italic flex items-center gap-1">
                    <Ban size={14} className="mt-[2px]" /> This message was deleted
                  </span>
                ) : (
                  <span className="text-wa-text-primary wrap-break-word pr-4">
                    {msg.decrypted_content || 'Decrypting...'}
                  </span>
                )}
                
                <div className={`float-right flex items-center gap-1 ml-3 mt-1 h-[15px]`}>
                  <span className="text-[11px] text-wa-text-secondary leading-[15px]">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isLocal && (
                    <span className="ml-[2px]">
                      {/* Checkmarks */}
                      <svg viewBox="0 0 16 15" width="16" height="15" className={msg.is_read ? 'fill-[#53bdeb]' : 'fill-wa-text-secondary'}>
                        {msg.is_delivered ? (
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.51zm-4.12-.372l-.478-.372a.365.365 0 0 0-.51.063L4.546 9.88a.32.32 0 0 1-.484.032L1.892 7.72a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                        ) : (
                          <path d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.72a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                        )}
                      </svg>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={bottomRef} className="h-1 w-full shrink-0" />
    </div>
  );
}
