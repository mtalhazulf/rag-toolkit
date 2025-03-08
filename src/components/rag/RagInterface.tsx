import { ApiKeyManager } from '../ui/ApiKeyManager';
import { EmbeddingsGenerator } from './EmbeddingsGenerator';
import { ModelSelector } from './ModelSelector';
import { QueryInterface } from './QueryInterface';
import { QueryResults } from './QueryResults';

interface QueryResult {
  chunkId: number;
  text: string;
  score: number;
}

interface RagInterfaceProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  resetRag: () => void;
  isGeneratingEmbeddings: boolean;
  embeddingsGenerated: boolean;
  generateEmbeddings: () => void;
  finalizedChunksCount: number;
  embeddedChunksCount: number;
  selectedModel: 'gpt-4o-mini' | 'gpt-4o';
  setSelectedModel: (model: 'gpt-4o-mini' | 'gpt-4o') => void;
  queryInput: string;
  setQueryInput: (input: string) => void;
  isQuerying: boolean;
  performQuery: () => void;
  queryResults: QueryResult[];
  gptAnswer: string;
  isGeneratingAnswer: boolean;
}

export function RagInterface({
  apiKey,
  setApiKey,
  resetRag,
  isGeneratingEmbeddings,
  embeddingsGenerated,
  generateEmbeddings,
  finalizedChunksCount,
  embeddedChunksCount,
  selectedModel,
  setSelectedModel,
  queryInput,
  setQueryInput,
  isQuerying,
  performQuery,
  queryResults,
  gptAnswer,
  isGeneratingAnswer
}: RagInterfaceProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">RAG Query System with {selectedModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-4o Mini'}</h2>
            <p className="text-sm text-gray-600 mt-1">
              Retrieve relevant chunks from your text and generate answers using OpenAI&apos;s {selectedModel} model.
            </p>
          </div>
          <button
            onClick={resetRag}
            className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
          >
            Reset & Start Over
          </button>
        </div>
        
        <div className="mb-6">
          <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
        </div>
        
        <ModelSelector selectedModel={selectedModel} setSelectedModel={setSelectedModel} />
        
        <EmbeddingsGenerator 
          isGeneratingEmbeddings={isGeneratingEmbeddings}
          embeddingsGenerated={embeddingsGenerated}
          generateEmbeddings={generateEmbeddings}
          finalizedChunksCount={finalizedChunksCount}
          embeddedChunksCount={embeddedChunksCount}
        />
      </div>
      
      <QueryInterface 
        queryInput={queryInput}
        setQueryInput={setQueryInput}
        embeddingsGenerated={embeddingsGenerated}
        isQuerying={isQuerying}
        performQuery={performQuery}
        selectedModel={selectedModel}
      />
      
      <QueryResults 
        queryResults={queryResults}
        gptAnswer={gptAnswer}
        isGeneratingAnswer={isGeneratingAnswer}
        selectedModel={selectedModel}
      />
    </div>
  );
} 