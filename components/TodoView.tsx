import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import type { TodoItem } from '../types';
import { LOCAL_STORAGE_TODO_KEY } from '../constants';

const TodoView: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState<string>('');

  useEffect(() => {
    try {
      const storedTodos = localStorage.getItem(LOCAL_STORAGE_TODO_KEY);
      if (storedTodos) {
        setTodos(JSON.parse(storedTodos));
      }
    } catch (error) {
      console.error("Failed to load todos from local storage:", error);
      // Optionally, clear corrupted data or inform user
      localStorage.removeItem(LOCAL_STORAGE_TODO_KEY);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TODO_KEY, JSON.stringify(todos));
    } catch (error) {
      console.error("Failed to save todos to local storage:", error);
      // Optionally, inform user about storage issue
    }
  }, [todos]);

  const handleAddTodo = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newTodoText.trim()) return;
    setTodos(prevTodos => [
      ...prevTodos,
      { id: Date.now().toString(), text: newTodoText.trim(), completed: false },
    ]);
    setNewTodoText('');
  }, [newTodoText]);

  const handleToggleComplete = useCallback((id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  const handleDeleteTodo = useCallback((id: string) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  }, []);

  const handleClearCompleted = useCallback(() => {
    setTodos(prevTodos => prevTodos.filter(todo => !todo.completed));
  }, []);

  const completedCount = todos.filter(todo => todo.completed).length;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto p-1 text-sm">
      <h2 className="text-2xl font-semibold text-sky-300 mb-6 text-center">Список Дел</h2>
      
      <form onSubmit={handleAddTodo} className="flex mb-6 gap-2">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Новая задача..."
          className="flex-grow p-3 bg-slate-700 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Текст новой задачи"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400"
          aria-label="Добавить новую задачу"
        >
          Добавить
        </button>
      </form>

      {todos.length === 0 && (
        <p className="text-slate-400 text-center mt-4">Список дел пока пуст. Добавьте первую задачу!</p>
      )}

      {todos.length > 0 && (
        <ul className="space-y-3 overflow-y-auto flex-grow mb-4 pr-2 max-h-[calc(100vh-22rem)] sm:max-h-[calc(100vh-24rem)]">
          {todos.map(todo => (
            <li
              key={todo.id}
              className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${
                todo.completed ? 'bg-slate-700/70' : 'bg-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo.id)}
                className="w-5 h-5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-400 focus:ring-offset-slate-700 mr-3 shrink-0"
                aria-labelledby={`todo-text-${todo.id}`}
              />
              <span
                id={`todo-text-${todo.id}`}
                className={`flex-grow text-slate-100 ${
                  todo.completed ? 'line-through text-slate-400' : ''
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                className="ml-3 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Удалить задачу: ${todo.text}`}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}

      {todos.length > 0 && (
        <div className="mt-auto pt-4 border-t border-slate-700 flex justify-between items-center">
          <p className="text-xs text-slate-400">
            Выполнено: {completedCount} из {todos.length}
          </p>
          <button
            onClick={handleClearCompleted}
            disabled={completedCount === 0}
            className="px-4 py-2 bg-amber-600 text-white text-xs rounded hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-amber-400"
            aria-label="Очистить выполненные задачи"
          >
            Очистить выполненные
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoView;