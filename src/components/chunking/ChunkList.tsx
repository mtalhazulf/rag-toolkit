interface Chunk {
  id: number;
  text: string;
  tokens: number;
  characters: number;
}

interface ChunkListProps {
  chunks: Chunk[];
}

export function ChunkList({ chunks }: ChunkListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          Text Chunks
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {chunks.map((chunk, i) => (
          <div key={i} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded">
              <div className="text-sm font-medium">Chunk #{i + 1}</div>
              <div className="text-xs text-black flex items-center space-x-2">
                <span>{chunk.tokens} tokens</span>
                <span>|</span>
                <span>{chunk.characters} chars</span>
              </div>
            </div>
            <div className="overflow-auto max-h-40 border-l-4 border-blue-100 pl-3">
              <p className="text-black whitespace-pre-wrap font-mono text-sm">{chunk.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 