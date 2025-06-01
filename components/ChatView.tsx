
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ChatMessage, ChatSession, GeminiHistoryContent } from '../types';
import { geminiService } from '../services/geminiService';
import type { Chat } from '@google/genai';
import { 
  GEMINI_API_SYSTEM_INSTRUCTION, 
  AVAILABLE_CHAT_MODELS, 
  DEFAULT_CHAT_MODEL_ID,
  LOCAL_STORAGE_CHAT_SESSIONS_KEY,
  LOCAL_STORAGE_CHAT_MESSAGES_KEY
} from '../constants';
import { PlusCircleIcon, TrashIcon, XMarkIcon, Bars3Icon } from './icons/ChatActionIcons';
import { ChatIcon as TabChatIcon } from './icons/TabIcons';

const mapMessagesToHistory = (messages: ChatMessage[]): GeminiHistoryContent[] => {
  return messages.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));
};

interface ChatAreaInternalProps {
  activeChatId: string | null;
  currentChatMessages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
  error: string | null; 
  inputValue: string;
  isSendingMessage: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => Promise<void>;
  onInputKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  NoActiveChatIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const ChatAreaInternal: React.FC<ChatAreaInternalProps> = React.memo(({
  activeChatId,
  currentChatMessages,
  messagesEndRef,
  error,
  inputValue,
  isSendingMessage,
  onInputChange,
  onSendMessage,
  onInputKeyPress,
  NoActiveChatIcon
}) => {
  return (
    <div className="flex flex-col h-full flex-grow">
       {activeChatId ? (
        <>
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-200 dark:bg-slate-700/30 rounded-b-lg mb-4">
            {currentChatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`
                    max-w-[80%] p-3 rounded-xl shadow
                    ${msg.sender === 'user' ? 'bg-sky-600 text-white' : (msg.isError ? 'bg-red-500 dark:bg-red-700 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-100')}
                  `}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  {msg.isLoading && msg.sender === 'ai' && (
                    <div className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-300 opacity-75">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      typing...
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {error && activeChatId && <p className="text-red-500 dark:text-red-400 text-xs mb-2 px-1" role="alert">{error}</p>}
          <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-lg mt-auto">
            <input
              type="text"
              value={inputValue}
              onChange={onInputChange}
              onKeyPress={onInputKeyPress}
              placeholder="Type your message..."
              className="flex-grow p-3 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none"
              disabled={isSendingMessage || !activeChatId}
              aria-label="Chat input"
            />
            <button
              onClick={onSendMessage}
              disabled={isSendingMessage || !inputValue.trim() || !activeChatId}
              className="p-3 bg-sky-600 text-white rounded-md hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150"
              aria-label="Send message"
            >
              {isSendingMessage ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 transform rotate-90">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                </svg>
              )}
            </button>
          </div>
        </>
       ) : (
        <div className="flex-grow flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
           <NoActiveChatIcon className="w-16 h-16 mb-4 text-slate-400 dark:text-slate-500" />
          <p className="text-lg">No active chat.</p>
          <p>Create a new chat or select one from the sidebar.</p>
          {error && <p className="text-red-500 dark:text-red-400 text-sm mt-4 p-2 bg-red-200 dark:bg-red-900/30 rounded-md" role="alert">{error}</p>}
        </div>
       )}
    </div>
  );
});


const ChatView: React.FC = () => {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  const [inputValue, setInputValue] = useState<string>('');
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModelForNewChat, setSelectedModelForNewChat] = useState<string>(DEFAULT_CHAT_MODEL_ID);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_CHAT_SESSIONS_KEY);
      if (storedSessions) {
        setChatSessions(JSON.parse(storedSessions));
      }
      const storedMessages = localStorage.getItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
        }));
        setAllMessages(parsedMessages);
      }
    } catch (e) {
      console.error("Failed to load chat data from localStorage:", e);
      setError("Could not load previous chat data.");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_SESSIONS_KEY, JSON.stringify(chatSessions));
    } catch (e) {
      console.error("Failed to save chat sessions to localStorage:", e);
    }
  }, [chatSessions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY, JSON.stringify(allMessages));
    } catch (e) {
      console.error("Failed to save chat messages to localStorage:", e);
    }
  }, [allMessages]);

  const currentChatMessages = useMemo(() => {
    if (!activeChatId) return [];
    return allMessages.filter(msg => msg.chatId === activeChatId).sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [allMessages, activeChatId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [currentChatMessages]);

  useEffect(() => {
    if (!activeChatId) {
      chatSessionRef.current = null;
      if (chatSessions.length > 0) {
        const sortedSessions = [...chatSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        setActiveChatId(sortedSessions[0].id);
      }
      return;
    }

    const currentSession = chatSessions.find(s => s.id === activeChatId);
    if (!currentSession) {
      if (chatSessions.length > 0) {
        const sortedSessions = [...chatSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        setActiveChatId(sortedSessions[0].id);
      } else {
        setActiveChatId(null);
      }
      chatSessionRef.current = null;
      return;
    }

    setIsSendingMessage(true); // To avoid user input during re-initialization
    setError(null);
    try {
      const history = mapMessagesToHistory(currentChatMessages.filter(m => !m.isError && !m.isLoading));
      chatSessionRef.current = geminiService.initChatWithHistory(
        currentSession.modelId,
        history,
        currentSession.systemInstruction || GEMINI_API_SYSTEM_INSTRUCTION
      );
    } catch (e: any) {
      console.error("Failed to initialize chat session:", e);
      const errorMessage = e.message || "Could not initialize chat. API key might be missing, invalid, or the model is unavailable.";
      setError(errorMessage);
      // Don't add error message to chat here as it might overwrite user messages if re-init fails.
      // The 'error' state will be displayed.
    } finally {
      setIsSendingMessage(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, chatSessions]); // Note: currentChatMessages removed from deps to avoid re-init on new message


  const handleCreateNewChat = useCallback(() => {
    setIsSendingMessage(true); 
    const newChatId = Date.now().toString();
    const now = Date.now();
    const newSession: ChatSession = {
      id: newChatId,
      name: `Chat @ ${new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      modelId: selectedModelForNewChat,
      systemInstruction: GEMINI_API_SYSTEM_INSTRUCTION,
      createdAt: now,
      lastActivityAt: now,
    };

    setChatSessions(prev => [newSession, ...prev].sort((a,b) => b.lastActivityAt - a.lastActivityAt));
    setError(null);

    const aiGreeting: ChatMessage = {
      id: (Date.now() + 1).toString(),
      chatId: newChatId,
      text: `Ciao! Come posso aiutarti oggi? 😊`,
      sender: 'ai',
      timestamp: new Date(),
    };
    setAllMessages(prev => [...prev, aiGreeting]);
    
    setActiveChatId(newChatId); 
    setInputValue('');
    setIsSendingMessage(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, [selectedModelForNewChat]);

  const handleDeleteChat = useCallback((chatIdToDelete: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== chatIdToDelete));
    setAllMessages(prev => prev.filter(m => m.chatId !== chatIdToDelete));
    if (activeChatId === chatIdToDelete) {
      const remainingSessions = chatSessions.filter(s => s.id !== chatIdToDelete);
      if (remainingSessions.length > 0) {
        setActiveChatId(remainingSessions.sort((a,b) => b.lastActivityAt - a.lastActivityAt)[0].id);
      } else {
        setActiveChatId(null);
      }
    }
  }, [activeChatId, chatSessions]);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isSendingMessage || !chatSessionRef.current || !activeChatId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      chatId: activeChatId,
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };
    
    setAllMessages(prev => [...prev, userMessage]);
    setChatSessions(prevSessions => 
        prevSessions.map(s => 
            s.id === activeChatId ? {...s, lastActivityAt: Date.now()} : s
        ).sort((a,b) => b.lastActivityAt - a.lastActivityAt)
    );

    const textToSend = inputValue.trim();
    setInputValue('');
    setIsSendingMessage(true);
    setError(null);

    const aiMessageId = (Date.now() + 1).toString();
    setAllMessages(prev => [...prev, { 
      id: aiMessageId, 
      chatId: activeChatId,
      text: '', 
      sender: 'ai', 
      timestamp: new Date(),
      isLoading: true 
    }]);

    try {
      await geminiService.streamMessage(
        chatSessionRef.current,
        textToSend,
        (chunkText) => {
          setAllMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
            ? { ...msg, text: (msg.text || '') + chunkText, isLoading: true } 
            : msg
          ));
        },
        (err) => {
          console.error("Streaming error:", err);
          const errorMessage = err.message || "An error occurred while fetching response.";
          setError(errorMessage);
          setAllMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
            ? { ...msg, text: `Error: ${errorMessage}`, isLoading: false, isError: true }
            : msg
          ));
          setIsSendingMessage(false);
        },
        () => { 
          setAllMessages(prev => prev.map(msg => 
            msg.id === aiMessageId 
            ? { ...msg, isLoading: false } 
            : msg
          ));
          setIsSendingMessage(false);
        }
      );
    } catch (e: any) {
      console.error("Error sending message:", e);
      const errorMessage = e.message || "Failed to send message. API Key may be invalid or quota exceeded.";
      setError(errorMessage);
      setAllMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
        ? { ...msg, text: `Error: ${errorMessage}`, isLoading: false, isError: true }
        : msg
      ));
      setIsSendingMessage(false);
    }
  }, [inputValue, isSendingMessage, activeChatId, chatSessionRef]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSendingMessage && inputValue.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)] text-sm text-slate-800 dark:text-slate-100">
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        className="md:hidden fixed top-20 left-2 z-30 p-2 bg-slate-700 dark:bg-slate-600 rounded-md text-white"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>

      <div className={`
        fixed inset-y-0 left-0 z-20 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 md:flex md:flex-col 
        w-64 lg:w-72 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 p-3 transition-transform duration-300 ease-in-out
        h-full flex flex-col shadow-lg md:shadow-none
      `}>
        <button
          onClick={handleCreateNewChat}
          disabled={isSendingMessage && !activeChatId} // Consider if this should be just `isSendingMessage`
          className="w-full flex items-center justify-center px-3 py-2 mb-3 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-500 disabled:bg-slate-400 dark:disabled:bg-slate-500 transition-colors duration-150"
          aria-label="Start a new chat session"
        >
          <PlusCircleIcon className="w-5 h-5 mr-2" />
          New Chat
        </button>

        <div className="mb-3">
          <label htmlFor="model-select" className="text-xs text-slate-500 dark:text-slate-400 mr-2 block mb-1">Model for new chats:</label>
          <select
            id="model-select"
            value={selectedModelForNewChat}
            onChange={(e) => setSelectedModelForNewChat(e.target.value)}
            disabled={isSendingMessage && !activeChatId} // Consider this disabled condition
            className="w-full p-2 text-xs bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none custom-select-arrow border border-slate-300 dark:border-slate-500"
            aria-label="Select chat model for new chats"
          >
            {AVAILABLE_CHAT_MODELS.map(model => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </select>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Chat History:</p>
        <div className="flex-grow overflow-y-auto space-y-1 pr-1 -mr-1">
          {chatSessions.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-2">No chats yet.</p>}
          {chatSessions.map(session => (
            <div
              key={session.id}
              onClick={() => handleSelectChat(session.id)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectChat(session.id)}
              className={`
                p-2.5 rounded-md cursor-pointer group relative
                transition-colors duration-150
                ${activeChatId === session.id ? 'bg-sky-500 dark:bg-sky-700/70 text-white shadow-md' : 'hover:bg-slate-200/70 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'}
              `}
              aria-current={activeChatId === session.id ? "page" : undefined}
            >
              <p className="text-xs font-medium truncate pr-6">{session.name}</p>
              <p className="text-[0.65rem] text-slate-500 dark:text-slate-400 group-hover:text-slate-300 dark:group-hover:text-slate-300">
                {AVAILABLE_CHAT_MODELS.find(m=>m.id === session.modelId)?.name || session.modelId}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteChat(session.id); }}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-600/50"
                aria-label={`Delete chat: ${session.name}`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex-grow flex flex-col overflow-hidden p-0 md:p-3 transition-all duration-300 ease-in-out ${isSidebarOpen && window.innerWidth < 768 ? 'ml-64' : 'ml-0'} md:ml-0`}>
         <ChatAreaInternal
            activeChatId={activeChatId}
            currentChatMessages={currentChatMessages}
            messagesEndRef={messagesEndRef}
            error={error}
            inputValue={inputValue}
            isSendingMessage={isSendingMessage}
            onInputChange={handleInputChange}
            onSendMessage={handleSendMessage}
            onInputKeyPress={handleInputKeyPress}
            NoActiveChatIcon={TabChatIcon}
         />
      </div>
    </div>
  );
};

export default ChatView;
