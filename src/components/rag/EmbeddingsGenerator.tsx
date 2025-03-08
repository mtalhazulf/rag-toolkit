interface EmbeddingsGeneratorProps {
  isGeneratingEmbeddings: boolean;
  embeddingsGenerated: boolean;
  generateEmbeddings: () => void;
  finalizedChunksCount: number;
  embeddedChunksCount: number;
}

export function EmbeddingsGenerator({
  isGeneratingEmbeddings,
  embeddingsGenerated,
  generateEmbeddings,
  finalizedChunksCount,
  embeddedChunksCount
}: EmbeddingsGeneratorProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-medium mb-2">Step 1: Generate Embeddings</h3>
      <p className="text-sm text-gray-600 mb-4">
        Generate vector embeddings for your {finalizedChunksCount} chunks using OpenAI&apos;s embedding model.
        This is required before you can perform semantic searches.
      </p>
      <div className="flex items-center">
        <button
          onClick={generateEmbeddings}
          disabled={isGeneratingEmbeddings || embeddingsGenerated}
          className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
            embeddingsGenerated 
              ? 'bg-green-500 hover:bg-green-600' 
              : isGeneratingEmbeddings 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isGeneratingEmbeddings ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Embeddings...
            </>
          ) : embeddingsGenerated ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Embeddings Generated
            </>
          ) : (
            'Generate Embeddings'
          )}
        </button>
        {embeddingsGenerated && (
          <span className="ml-3 text-sm text-green-600">
            ✓ {embeddedChunksCount} chunks embedded successfully
          </span>
        )}
      </div>
    </div>
  );
} 