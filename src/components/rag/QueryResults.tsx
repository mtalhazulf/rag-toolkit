interface QueryResult {
  chunkId: number;
  text: string;
  score: number;
}

interface QueryResultsProps {
  queryResults: QueryResult[];
  gptAnswer: string;
  isGeneratingAnswer: boolean;
  selectedModel: 'gpt-4o-mini' | 'gpt-4o';
}

export function QueryResults({
  queryResults,
  gptAnswer,
  isGeneratingAnswer,
  selectedModel
}: QueryResultsProps) {
  return (
    <>
      {queryResults.length > 0 && (
        <div className="border rounded-lg overflow-hidden mb-6">
          <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">Retrieved Chunks</h3>
          <div className="divide-y">
            {queryResults.map((result, index) => (
              <div key={index} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Chunk #{result.chunkId + 1}</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Score: {(result.score * 100).toFixed(2)}%
                  </span>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap font-mono text-sm">{result.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {(isGeneratingAnswer || gptAnswer) && (
        <div className="border rounded-lg overflow-hidden">
          <h3 className="text-lg font-medium p-4 bg-green-50 border-b flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {selectedModel === 'gpt-4o' ? 'GPT-4o Answer' : 'GPT-4o Mini Answer'}
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              Using {selectedModel}
            </span>
          </h3>
          <div className="p-4">
            {isGeneratingAnswer ? (
              <div className="flex items-center text-gray-500">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating answer with {selectedModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-4o Mini'}...
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                {gptAnswer.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-2">{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 