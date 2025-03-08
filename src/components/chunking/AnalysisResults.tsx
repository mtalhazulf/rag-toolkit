interface AnalysisResultsProps {
  analysis: {
    totalChunks: number;
    averageChunkSize: {
      tokens: number;
      characters: number;
    };
    notes: string;
  };
  toggleJsonPreview: () => void;
}

export function AnalysisResults({ analysis, toggleJsonPreview }: AnalysisResultsProps) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
          </svg>
          Analysis Results
        </h2>
        <button
          type="button"
          onClick={toggleJsonPreview}
          className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-sm font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          title="Preview JSON"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Preview JSON
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-black">Total Chunks</p>
          <p className="text-2xl font-bold text-blue-700">{analysis.totalChunks}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-black">Avg. Characters</p>
          <p className="text-2xl font-bold text-blue-700">{analysis.averageChunkSize.characters}</p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-black">Avg. Tokens</p>
          <p className="text-2xl font-bold text-blue-700">{analysis.averageChunkSize.tokens}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-3 rounded border border-gray-200">
        <p className="text-sm text-black">{analysis.notes}</p>
      </div>
    </div>
  );
} 