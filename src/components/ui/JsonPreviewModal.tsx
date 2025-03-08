interface JsonPreviewModalProps {
  showJsonPreview: boolean;
  setShowJsonPreview: (show: boolean) => void;
  jsonPreview: string;
  downloadChunksAsJson: () => void;
}

export function JsonPreviewModal({ 
  showJsonPreview, 
  setShowJsonPreview, 
  jsonPreview, 
  downloadChunksAsJson 
}: JsonPreviewModalProps) {
  if (!showJsonPreview) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">JSON Preview</h2>
          <button
            onClick={() => setShowJsonPreview(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="border rounded-lg p-4 bg-gray-50 mb-4 overflow-auto max-h-[50vh]">
          <pre className="text-sm text-black whitespace-pre-wrap">{jsonPreview}</pre>
        </div>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowJsonPreview(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={downloadChunksAsJson}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
        </div>
      </div>
    </div>
  );
} 