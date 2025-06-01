import type { TabDefinition } from './types';
import ChatView from './components/ChatView';
import CalculatorView from './components/CalculatorView';
import ActionsView from './components/ActionsView';
import ImageGenerationView from './components/ImageGenerationView';
import TodoView from './components/TodoView';
import AdminView from './components/AdminView'; // Import AdminView
import { ChatIcon, CalculatorIcon, CogIcon, PhotoIcon, ListChecksIcon, AdminShieldIcon } from './components/icons/TabIcons'; // Added AdminShieldIcon

export const APP_TABS: TabDefinition[] = [
  { id: 'chat', label: 'Чат', component: ChatView, icon: ChatIcon },
  { id: 'calculator', label: 'Калькулятор', component: CalculatorView, icon: CalculatorIcon },
  { id: 'imageGen', label: 'Генерация Изображений', component: ImageGenerationView, icon: PhotoIcon },
  { id: 'todo', label: 'Список Дел', component: TodoView, icon: ListChecksIcon },
  { id: 'actions', label: 'Действия', component: ActionsView, icon: CogIcon },
  { id: 'admin', label: 'Админ-панель', component: AdminView, icon: AdminShieldIcon }, // Added Admin Panel
];

export const DEFAULT_TAB_ID = APP_TABS[0]?.id || 'chat';

export const AVAILABLE_CHAT_MODELS = [
  { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash' },
  // Add other compatible models here in the future
];

export const DEFAULT_CHAT_MODEL_ID = AVAILABLE_CHAT_MODELS[0].id; // Default model for new chats
export const GEMINI_IMAGE_GEN_MODEL = 'imagen-3.0-generate-002';
export const GEMINI_API_SYSTEM_INSTRUCTION = "You are a helpful and friendly assistant integrated into an OS-like tabbed interface. Keep your responses concise and informative.";

export const LOCAL_STORAGE_TODO_KEY = 'app_todo_items';
export const LOCAL_STORAGE_CHAT_SESSIONS_KEY = 'app_chat_sessions';
export const LOCAL_STORAGE_CHAT_MESSAGES_KEY = 'app_chat_messages';
export const LOCAL_STORAGE_NOTES_KEY = 'user_notes_local_storage'; // Added for NotesView if it exists and for clearing data

// Admin Panel related constants
export const ADMIN_API_KEY_LOCAL_STORAGE_KEY = 'app_admin_api_key';
export const APP_THEME_LOCAL_STORAGE_KEY = 'app_theme';