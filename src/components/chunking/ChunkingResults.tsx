import { AnalysisResults } from './AnalysisResults';
import { ChunkList } from './ChunkList';
import { TextInput } from './TextInput';

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  characters: number;
}

interface Analysis {
  totalChunks: number;
  averageChunkSize: {
    tokens: number;
    characters: number;
  };
  notes: string;
}

interface ChunkingResultsProps {
  text: string;
  setText: (text: string) => void;
  analysis: Analysis | null;
  chunks: Chunk[];
  toggleJsonPreview: () => void;
}

export function ChunkingResults({
  text,
  setText,
  analysis,
  chunks,
  toggleJsonPreview
}: ChunkingResultsProps) {
  return (
    <div className="w-full md:w-3/4">
      <TextInput text={text} setText={setText} />
      
      {analysis && (
        <div className="space-y-6">
          <AnalysisResults analysis={analysis} toggleJsonPreview={toggleJsonPreview} />
          <ChunkList chunks={chunks} />
        </div>
      )}
    </div>
  );
} 