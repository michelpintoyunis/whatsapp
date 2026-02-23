'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatStore } from '@/store/useChatStore';
import Sidebar from '@/components/sidebar/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import LoginScreen from '@/components/auth/LoginScreen';
import { useChats } from '@/hooks/useChats';

export default function MainContainer() {
  const { user, loading } = useAuth();
  useChats();
  const activeChatId = useChatStore((state) => state.activeChatId);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // For Mobile: If no chat is active, show Sidebar. If chat is active, show ChatWindow.
  // For Desktop: Show both side-by-side.
  const showSidebar = !isMobile || (isMobile && !activeChatId);
  const showChatWindow = !isMobile || (isMobile && !!activeChatId);

  // Still checking session in background
  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-wa-bg-panel min-h-screen text-wa-primary"><div className="w-10 h-10 border-4 border-wa-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Not logged in
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <div 
        className={`shrink-0 border-r border-wa-border bg-wa-bg-panel transition-all duration-300
          ${showSidebar ? 'w-full md:w-[350px] lg:w-[400px] flex' : 'hidden md:flex md:w-[350px] lg:w-[400px]'}`}
      >
        <Sidebar className="w-full h-full" />
      </div>

      <div 
        className={`flex-1 min-w-0 bg-wa-bg-main
          ${showChatWindow ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}
      >
        {activeChatId ? (
          <ChatWindow />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-wa-text-secondary border-b-[6px] border-b-wa-primary">
            <h1 className="text-[32px] font-light text-wa-text-primary mb-4 mt-10">WhatsApp Web Clone</h1>
            <p className="max-w-[500px] text-[14px] leading-6">
              Send and receive messages without keeping your phone online.<br/>
              Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
            </p>
            <div className="mt-10 flex flex-col items-center">
              <span className="text-[12px] flex items-center gap-2">
                <svg viewBox="0 0 10 12" height="12" width="10" preserveAspectRatio="xMidYMid meet" className="fill-wa-text-secondary"><path d="M5.008 1.456C6.702 1.456 8.08 2.825 8.08 4.51v1.652h.388c.884 0 1.6.716 1.6 1.601v2.793c0 .884-.716 1.6-1.6 1.6H1.531c-.884 0-1.6-.716-1.6-1.6V7.761c0-.884.716-1.6 1.6-1.6h.398V4.51c0-1.685 1.378-3.054 3.079-3.054zm0 1.583c-.83 0-1.498.675-1.498 1.503v1.62h2.997v-1.62c0-.828-.67-1.503-1.499-1.503z"></path></svg>
                End-to-End Encrypted
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
