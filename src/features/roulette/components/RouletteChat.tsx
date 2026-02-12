import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../../firebase.ts';
import { ChatMessage } from '../../../shared/types';
import { getAvatarColor, getTextContrastColor } from '../../../shared/utils';

interface RouletteChatProps {
  groupId: string;
  messages: ChatMessage[];
  isActive: boolean; // ready 또는 playing 상태일 때만 true
}

const RouletteChat = ({ groupId, messages, isActive }: RouletteChatProps) => {
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const userName = localStorage.getItem('ssafy_userName') || '익명';

  // 새 메시지가 오면 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !isActive || isSending) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userName,
      message: inputValue.trim(),
      timestamp: Date.now(),
    };

    setIsSending(true);
    setInputValue('');

    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        'rouletteGame.chatMessages': arrayUnion(newMessage),
      });
    } catch (error) {
      console.error('메시지 전송 실패:', error);
    } finally {
      setIsSending(false);
      // 전송 후 입력창에 포커스 유지
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 overflow-hidden h-full">
      {/* 채팅 헤더 */}
      <div className="px-3 py-2 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
        <span className="text-base">💬</span>
        <span className="text-sm font-bold text-gray-700">실시간 채팅</span>
        {!isActive && (
          <span className="text-xs text-gray-400 ml-auto">게임 중에만 가능</span>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-xs">
            {isActive ? '첫 메시지를 보내보세요!' : '게임이 시작되면 채팅이 활성화돼요'}
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userName === userName;
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
              >
                {/* 아바타 */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    backgroundColor: getAvatarColor(msg.userName),
                    color: getTextContrastColor(),
                  }}
                  title={msg.userName}
                >
                  {msg.userName.slice(0, 1)}
                </div>

                {/* 메시지 버블 */}
                <div
                  className={`max-w-[70%] px-3 py-1.5 rounded-xl text-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-bold text-gray-500 mb-0.5">
                      {msg.userName}
                    </div>
                  )}
                  <div className="break-words">{msg.message}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-2 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isActive ? '메시지 입력...' : '게임 중에만 입력 가능'}
            disabled={!isActive || isSending}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
            maxLength={100}
          />
          <button
            onClick={handleSend}
            disabled={!isActive || !inputValue.trim() || isSending}
            className="px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouletteChat;
