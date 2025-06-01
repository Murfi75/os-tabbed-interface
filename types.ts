import React from 'react';
import type { Content } from '@google/genai'; // For chat history

export interface TabDefinition {
  id: string;
  label: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  component: React.FC<any>; // Use any for component props for now, or create a union type
}

export interface ChatMessage {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  modelId: string;
  systemInstruction?: string;
  createdAt: number;
  lastActivityAt: number;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export enum CalculatorOperation {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
}

export type GeminiHistoryContent = Content;

// Props for AdminView if it needs to interact with App's theme state directly
export interface AdminViewProps {
  currentTheme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}