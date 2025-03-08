import { useState } from 'react';

interface ApiKeyManagerProps {
  apiKey: string;
  setApiKey: (key: string) => void;
}

export function ApiKeyManager({ apiKey, setApiKey }: ApiKeyManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  
  const saveKey = () => {
    setApiKey(tempKey);
    localStorage.setItem('openai_api_key', tempKey);
    setIsEditing(false);
  };
  
  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        OpenAI API Key
      </h3>
      {isEditing ? (
        <div className="flex items-center">
          <input
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="flex-grow mr-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1 text-sm"
            placeholder="sk-..."
          />
          <button 
            onClick={saveKey}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
            Save
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 ml-1 bg-gray-300 text-gray-700 rounded text-xs">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {apiKey ? "API key is set" : "No API key set (required for semantic chunking)"}
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
            {apiKey ? "Change" : "Set Key"}
          </button>
        </div>
      )}
    </div>
  );
} 