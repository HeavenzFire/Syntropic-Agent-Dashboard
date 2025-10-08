
import React from 'react';
import { CheckIcon } from './icons/CheckIcon';

interface ChecklistItemProps {
  text: string;
  completed: boolean;
  onToggle: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ text, completed, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className="flex items-center gap-3 cursor-pointer group"
    >
      <div className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all duration-200 ${
        completed
          ? 'bg-sky-500 border-sky-500'
          : 'bg-gray-700/50 border-gray-500 group-hover:border-sky-400'
      }`}>
        {completed && <CheckIcon />}
      </div>
      <span className={`flex-1 text-sm transition-colors duration-200 ${
        completed
          ? 'text-gray-500 line-through'
          : 'text-gray-300 group-hover:text-sky-200'
      }`}>
        {text}
      </span>
    </div>
  );
};

export default ChecklistItem;
