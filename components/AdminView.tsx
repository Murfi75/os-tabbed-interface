import React, { useState, useEffect, useCallback } from 'react';
import {
  ADMIN_API_KEY_LOCAL_STORAGE_KEY,
  APP_THEME_LOCAL_STORAGE_KEY,
  LOCAL_STORAGE_CHAT_SESSIONS_KEY,
  LOCAL_STORAGE_CHAT_MESSAGES_KEY,
  LOCAL_STORAGE_TODO_KEY,
  LOCAL_STORAGE_NOTES_KEY,
  GEMINI_API_SYSTEM_INSTRUCTION,
  DEFAULT_CHAT_MODEL_ID,
  GEMINI_IMAGE_GEN_MODEL,
  AVAILABLE_CHAT_MODELS
} from '../constants';
import { geminiService } from '../services/geminiService';

interface AdminViewProps {
  currentTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AdminView: React.FC<AdminViewProps> = ({ currentTheme, setTheme }) => {
  const [adminApiKeyInput, setAdminApiKeyInput] = useState<string>('');
  const [apiKeySource, setApiKeySource] = useState<'Admin' | 'Environment' | 'None' | 'Unknown'>('Unknown');
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const updateApiKeySource = useCallback(() => {
    setApiKeySource(geminiService.getApiKeySource());
  }, []);

  useEffect(() => {
    const storedAdminKey = localStorage.getItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY);
    if (storedAdminKey) {
      setAdminApiKeyInput(storedAdminKey);
    }
    updateApiKeySource();
  }, [updateApiKeySource]);

  const handleSaveApiKey = useCallback(() => {
    if (adminApiKeyInput.trim()) {
      localStorage.setItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY, adminApiKeyInput.trim());
      showFeedback('API Key saved. It will be used for future requests.', 'success');
    } else {
      localStorage.removeItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY); // Treat empty input as clearing
      showFeedback('Admin API Key cleared (input was empty). Using environment key if available.', 'success');
    }
    geminiService.triggerKeyReInitialization(); // Force re-check
    updateApiKeySource();
  }, [adminApiKeyInput, updateApiKeySource]);

  const handleClearAdminApiKey = useCallback(() => {
    localStorage.removeItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY);
    setAdminApiKeyInput('');
    geminiService.triggerKeyReInitialization(); // Force re-check
    updateApiKeySource();
    showFeedback('Admin API Key cleared. Using environment key if available.', 'success');
  }, [updateApiKeySource]);

  const handleThemeToggle = useCallback(() => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme); // This updates App.tsx state, which updates localStorage and HTML class
    showFeedback(`Theme switched to ${newTheme} mode.`, 'success');
  }, [currentTheme, setTheme]);

  const handleClearAllData = useCallback(() => {
    if (window.confirm('Are you sure you want to delete ALL application data? This includes chats, todos, notes, and custom settings. This action cannot be undone.')) {
      localStorage.removeItem(LOCAL_STORAGE_CHAT_SESSIONS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_CHAT_MESSAGES_KEY);
      localStorage.removeItem(LOCAL_STORAGE_TODO_KEY);
      localStorage.removeItem(LOCAL_STORAGE_NOTES_KEY);
      localStorage.removeItem(ADMIN_API_KEY_LOCAL_STORAGE_KEY);
      // Do not remove theme, user might want to keep it. Or make it optional.
      // localStorage.removeItem(APP_THEME_LOCAL_STORAGE_KEY); 
      
      setAdminApiKeyInput(''); // Reset input field
      geminiService.triggerKeyReInitialization();
      updateApiKeySource();
      showFeedback('All application data cleared successfully!', 'success');
      // Optionally, prompt for page reload: window.location.reload();
    }
  }, [updateApiKeySource]);

  const Section: React.FC<{title: string; children: React.ReactNode; className?: string}> = ({ title, children, className }) => (
    <div className={`mb-8 p-4 sm:p-6 bg-slate-200 dark:bg-slate-700/50 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-400 mb-4 border-b border-slate-300 dark:border-slate-600 pb-2">{title}</h3>
      {children}
    </div>
  );

  const InfoItem: React.FC<{label: string; value: string | React.ReactNode; className?: string}> = ({label, value, className}) => (
    <div className={`mb-2 text-xs sm:text-sm ${className}`}>
      <span className="font-medium text-slate-600 dark:text-slate-300">{label}: </span>
      <span className="text-slate-700 dark:text-slate-200 break-words">{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-1 sm:p-2 text-slate-700 dark:text-slate-200 text-sm">
      <h2 className="text-2xl sm:text-3xl font-semibold text-sky-500 dark:text-sky-300 mb-6 sm:mb-8 text-center">Админ-панель</h2>

      {feedbackMessage && (
        <div 
          role="alert"
          className={`p-3 mb-4 rounded-md text-xs sm:text-sm text-center ${
            feedbackMessage.type === 'success' ? 'bg-green-100 dark:bg-green-700 text-green-700 dark:text-green-100' : 'bg-red-100 dark:bg-red-700 text-red-700 dark:text-red-100'
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      <Section title="Управление API Ключом Gemini">
        <InfoItem label="Текущий источник ключа" value={apiKeySource} className="mb-3"/>
        <div className="mb-3">
          <label htmlFor="adminApiKey" className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            API Ключ Gemini (устанавливается администратором):
          </label>
          <input
            type="password" // Use password type for keys
            id="adminApiKey"
            value={adminApiKeyInput}
            onChange={(e) => setAdminApiKeyInput(e.target.value)}
            placeholder="Введите ваш Gemini API ключ..."
            className="w-full p-2.5 border border-slate-300 dark:border-slate-500 rounded-md bg-white dark:bg-slate-700 focus:ring-sky-500 focus:border-sky-500 text-sm"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Этот ключ будет сохранен в localStorage вашего браузера и будет иметь приоритет над ключом из переменных окружения.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleSaveApiKey}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors text-xs sm:text-sm w-full sm:w-auto"
          >
            Сохранить ключ
          </button>
          <button
            onClick={handleClearAdminApiKey}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-md transition-colors text-xs sm:text-sm w-full sm:w-auto"
          >
            Очистить админ. ключ
          </button>
        </div>
      </Section>

      <Section title="Внешний вид">
        <div className="flex items-center justify-between">
          <InfoItem label="Текущая тема" value={currentTheme === 'dark' ? 'Темная (Dark)' : 'Светлая (Light)'} className="mb-0"/>
          <button
            onClick={handleThemeToggle}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors text-xs sm:text-sm"
          >
            Переключить на {currentTheme === 'dark' ? 'светлую' : 'темную'}
          </button>
        </div>
      </Section>

      <Section title="Управление данными">
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
          Это действие удалит все данные приложения (чаты, задачи, заметки, админ. API ключ) из локального хранилища вашего браузера.
        </p>
        <button
          onClick={handleClearAllData}
          className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors text-xs sm:text-sm"
        >
          Очистить все данные приложения
        </button>
      </Section>
      
      <Section title="Системная информация (Только чтение)">
        <InfoItem 
            label="Системная инструкция для чата (Chat System Instruction)" 
            value={<pre className="whitespace-pre-wrap text-xs p-2 bg-slate-100 dark:bg-slate-600 rounded mt-1">{GEMINI_API_SYSTEM_INSTRUCTION}</pre>}
        />
        <InfoItem 
            label="Модель для чата по умолчанию (New Chats)" 
            value={`${AVAILABLE_CHAT_MODELS.find(m => m.id === DEFAULT_CHAT_MODEL_ID)?.name || DEFAULT_CHAT_MODEL_ID} (${DEFAULT_CHAT_MODEL_ID})`}
        />
        <InfoItem 
            label="Модель для генерации изображений" 
            value={GEMINI_IMAGE_GEN_MODEL}
        />
      </Section>
    </div>
  );
};

export default AdminView;