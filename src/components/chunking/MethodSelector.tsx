import { ChunkingMethod } from '@/lib/chunking';

interface MethodSelectorProps {
  method: ChunkingMethod;
  setMethod: (method: ChunkingMethod) => void;
}

export function MethodSelector({ method, setMethod }: MethodSelectorProps) {
  const methods = [
    { value: 'fixed-length', label: 'Fixed-Length (Token-Based)' },
    { value: 'fixed-length-chars', label: 'Fixed-Length (Character-Based)' },
    { value: 'recursive', label: 'Recursive Text Splitter' },
    { value: 'sentence-based', label: 'Sentence-Based' },
    { value: 'paragraph-based', label: 'Paragraph-Based' },
    { value: 'sliding-window', label: 'Sliding Window' },
    { value: 'semantic', label: 'Semantic (OpenAI)' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'agentic', label: 'Agentic' },
  ];

  return (
    <div>
      <label className="block text-sm font-medium text-black mb-2">
        Chunking Method:
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as ChunkingMethod)}
          className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-base text-black"
        >
          {methods.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
} 