import React from 'react';

interface TabButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out focus:outline-none
        whitespace-nowrap
        ${
          isActive
            ? 'border-sky-500 text-sky-500 dark:text-sky-400 bg-slate-100 dark:bg-slate-700/50'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/30'
        }
      `}
      aria-current={isActive ? "page" : undefined}
    >
      {icon}
      {label}
    </button>
  );
};

export default TabButton;