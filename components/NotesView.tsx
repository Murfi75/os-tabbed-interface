import React, { useState, useEffect, useCallback } from 'react';

// Define the key locally as it's no longer exported from constants.ts
const LOCAL_STORAGE_NOTES_KEY = 'user_notes_local_storage';

const NotesView: React.FC = () => {
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    const savedNotes = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleNotesChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = event.target.value;
    setNotes(newNotes);
    localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, newNotes);
  }, []);

  const handleClearNotes = useCallback(() => {
    setNotes('');
    localStorage.removeItem(LOCAL_STORAGE_NOTES_KEY);
  }, []);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto text-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-sky-300">Мои Заметки</h2>
        <button
          onClick={handleClearNotes}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors duration-150 text-xs"
          aria-label="Очистить заметки"
        >
          Очистить
        </button>
      </div>
      <textarea
        value={notes}
        onChange={handleNotesChange}
        placeholder="Начните писать ваши заметки здесь..."
        className="flex-grow p-4 bg-slate-700/50 text-slate-100 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none w-full"
        aria-label="Поле для заметок"
      />
      <p className="text-xs text-slate-500 mt-2 text-center">
        Заметки автоматически сохраняются в вашем браузере.
      </p>
    </div>
  );
};

export default NotesView;