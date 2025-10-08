
import React from 'react';

interface CodeBlockProps {
  language: string;
  fileName: string;
  children: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, fileName, children }) => {
  return (
    <div className="bg-gray-900/70 rounded-lg overflow-hidden border border-gray-700">
      <div className="bg-gray-800/50 px-4 py-2 flex justify-between items-center border-b border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{fileName}</span>
        <span className="text-xs text-sky-400 bg-sky-900/50 px-2 py-0.5 rounded">{language}</span>
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
