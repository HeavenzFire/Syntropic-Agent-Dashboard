
import React from 'react';

interface StepCardProps {
  stepNumber: number;
  title: string;
  description: string;
  children: React.ReactNode;
}

const StepCard: React.FC<StepCardProps> = ({ stepNumber, title, description, children }) => {
  return (
    <div className="card-bg border border-sky-400/20 rounded-xl shadow-2xl shadow-sky-900/20 p-6 transition-all duration-300 hover:border-sky-400/50 hover:shadow-sky-700/20">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-sky-900/50 border border-sky-400/30 rounded-full text-sky-300 font-bold text-lg text-glow">
          {stepNumber}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-sky-200">{title}</h2>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
      </div>
      <div className="mt-4 pl-0">
        {children}
      </div>
    </div>
  );
};

export default StepCard;
