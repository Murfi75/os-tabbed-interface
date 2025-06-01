import React, { useState, useCallback } from 'react';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, className = '', ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel || label}
    className={`
      w-full sm:w-auto px-4 py-3 bg-sky-600 text-white rounded-lg 
      hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 
      transition-colors duration-150 text-sm font-medium shadow-md
      ${className}
    `}
  >
    {label}
  </button>
);

const ActionsView: React.FC = () => {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showTemporaryFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleShowAlert = useCallback(() => {
    alert('Привет! Это тестовое уведомление от вкладки "Действия".');
    showTemporaryFeedback('Уведомление показано.');
  }, []);

  const handleCopyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showTemporaryFeedback('URL страницы скопирован в буфер обмена!');
    } catch (err) {
      console.error('Failed to copy URL: ', err);
      showTemporaryFeedback('Не удалось скопировать URL.');
    }
  }, []);

  const handleReloadPage = useCallback(() => {
    showTemporaryFeedback('Страница перезагружается...');
    // Adding a slight delay so the user might see the feedback before reload
    setTimeout(() => window.location.reload(), 500);
  }, []);

  const handleLogToConsole = useCallback(() => {
    console.log('Кнопка "Лог в Консоль" была нажата.', new Date().toISOString());
    showTemporaryFeedback('Сообщение отправлено в консоль разработчика.');
  }, []);

  return (
    <div className="flex flex-col items-center h-full p-2 sm:p-4 text-sm">
      <h2 className="text-2xl font-semibold text-sky-300 mb-6 sm:mb-8">Действия</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full max-w-md">
        <ActionButton 
          label="Показать Уведомление" 
          onClick={handleShowAlert}
          ariaLabel="Показать всплывающее уведомление"
        />
        <ActionButton 
          label="Скопировать URL" 
          onClick={handleCopyToClipboard}
          ariaLabel="Скопировать текущий URL страницы в буфер обмена"
        />
        <ActionButton 
          label="Перезагрузить Страницу" 
          onClick={handleReloadPage}
          ariaLabel="Перезагрузить текущую страницу"
        />
        <ActionButton 
          label="Лог в Консоль" 
          onClick={handleLogToConsole}
          ariaLabel="Отправить сообщение в консоль разработчика"
        />
      </div>

      {feedbackMessage && (
        <div 
          role="status"
          aria-live="polite"
          className="mt-6 p-3 bg-slate-700 text-sky-300 rounded-md text-xs text-center shadow"
        >
          {feedbackMessage}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-auto pt-4 text-center">
        Нажмите кнопки выше, чтобы выполнить различные действия в браузере.
      </p>
    </div>
  );
};

export default ActionsView;
