interface QueryInterfaceProps {
  queryInput: string;
  setQueryInput: (input: string) => void;
  embeddingsGenerated: boolean;
  isQuerying: boolean;
  performQuery: () => void;
  selectedModel: 'gpt-4o-mini' | 'gpt-4o';
}

export function QueryInterface({
  queryInput,
  setQueryInput,
  embeddingsGenerated,
  isQuerying,
  performQuery,
  selectedModel
}: QueryInterfaceProps) {
  return (
    <div className={`mb-6 p-4 rounded-lg ${embeddingsGenerated ? 'bg-green-50' : 'bg-gray-100'}`}>
      <h3 className="text-lg font-medium mb-2">Step 2: Query Your Text</h3>
      <p className="text-sm text-gray-600 mb-4">
        Ask questions about your text. The system will find the most relevant chunks and generate an answer using {selectedModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-4o Mini'}.
      </p>
      <div className="mb-4">
        <textarea
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Enter your query here..."
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          disabled={!embeddingsGenerated}
        ></textarea>
      </div>
      <button
        onClick={performQuery}
        disabled={!embeddingsGenerated || isQuerying || !queryInput.trim()}
        className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
          !embeddingsGenerated || !queryInput.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : isQuerying
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isQuerying ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search & Generate Answer
          </>
        )}
      </button>
    </div>
  );
} 