import { FormEvent } from 'react';
import { ChunkingMethod, ChunkingOptions } from '@/lib/chunking';
import { MethodSelector } from './MethodSelector';
import { ParametersForm } from './ParametersForm';
import { ApiKeyManager } from '../ui/ApiKeyManager';

interface ChunkingFormProps {
  method: ChunkingMethod;
  setMethod: (method: ChunkingMethod) => void;
  options: ChunkingOptions;
  setOptions: (options: ChunkingOptions) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  isProcessing: boolean;
  handleSubmit: (e: FormEvent) => void;
  insertSampleText: () => void;
  clearAll: () => void;
  finalizeChunks: () => void;
  hasChunks: boolean;
}

export function ChunkingForm({
  method,
  setMethod,
  options,
  setOptions,
  apiKey,
  setApiKey,
  isProcessing,
  handleSubmit,
  insertSampleText,
  clearAll,
  finalizeChunks,
  hasChunks
}: ChunkingFormProps) {
  return (
    <div className="w-full md:w-1/4 bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-6 self-start">
      <form onSubmit={handleSubmit} className="space-y-4">
        <MethodSelector method={method} setMethod={setMethod} />
        
        <ParametersForm method={method} options={options} setOptions={setOptions} />
        
        {method === 'semantic' && (
          <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
        )}
        
        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Analyze Text'}
          </button>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={insertSampleText}
            className="w-1/2 py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sample Text
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="w-1/2 py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Clear All
          </button>
        </div>
        
        {hasChunks && (
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={finalizeChunks}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Finalize Chunks & Enable RAG
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 