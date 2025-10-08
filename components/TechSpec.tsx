import React from 'react';

interface TechSpecProps {
  title: string;
  specs: { key: string; value: string }[];
}

const TechSpec: React.FC<TechSpecProps> = ({ title, specs }) => (
  <div className="bg-gray-900/70 rounded-lg p-4 border border-gray-700 space-y-2">
    <h3 className="font-semibold text-sky-300 tracking-wide">{title}</h3>
    <div className="font-mono text-xs space-y-1">
      {specs.map((spec, index) => (
        <div key={index} className="grid grid-cols-3 gap-2 items-center">
          <span className="text-sky-400 col-span-1 truncate">{spec.key}:</span>
          <span className="text-gray-300 col-span-2">{spec.value}</span>
        </div>
      ))}
    </div>
  </div>
);

export default TechSpec;
