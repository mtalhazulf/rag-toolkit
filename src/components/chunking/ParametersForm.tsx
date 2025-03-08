import { ChunkingMethod, ChunkingOptions } from "@/lib/chunking";

interface ParametersFormProps {
  method: ChunkingMethod;
  options: ChunkingOptions;
  setOptions: (options: ChunkingOptions) => void;
}

export function ParametersForm({
  method,
  options,
  setOptions,
}: ParametersFormProps) {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-md font-medium mb-3 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1 text-blue-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
          />
        </svg>
        Parameters
      </h3>

      {/* Chunk Size for fixed-length methods */}
      {(method === "fixed-length" ||
        method === "fixed-length-chars" ||
        method === "sliding-window" ||
        method === "hybrid") && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-black mb-1">
            Chunk Size {method === "fixed-length" ? "(tokens)" : "(chars)"}:
            <input
              type="number"
              value={options.chunkSize}
              onChange={(e) =>
                setOptions({
                  ...options,
                  chunkSize: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
              min="10"
              max={method === "fixed-length" ? 1000 : 5000}
            />
          </label>
          {method === "fixed-length-chars" && (
            <p className="text-xs text-gray-500 mt-1">
              Character-based chunking with smart boundary detection to preserve
              natural text breaks
            </p>
          )}
        </div>
      )}

      {/* Overlap settings */}
      {method !== "paragraph-based" && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-black mb-1">
            {method === "sentence-based"
              ? "Overlap (sentences):"
              : method === "semantic"
              ? "Overlap (%)"
              : method === "fixed-length"
              ? "Overlap (tokens):"
              : "Overlap (chars):"}
            <input
              type="number"
              value={options.overlap}
              onChange={(e) =>
                setOptions({
                  ...options,
                  overlap: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
              min="0"
              max={
                method === "semantic"
                  ? 50
                  : method === "sentence-based"
                  ? 10
                  : options?.chunkSize ?? 0 > 10
                  ? options?.chunkSize ?? 0 - 10
                  : 0
              }
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            {method === "sentence-based"
              ? "Number of sentences to overlap between chunks"
              : method === "semantic"
              ? "Percentage of content to overlap between semantic chunks"
              : method === "fixed-length"
              ? "Tokens to overlap between chunks"
              : method === "fixed-length-chars"
              ? "Characters to overlap between chunks with smart boundary detection"
              : method === "sliding-window"
              ? "Characters to overlap between sliding windows"
              : "Characters to overlap between chunks"}
          </p>
        </div>
      )}

      {/* Recursive chunking mode */}
      {method === "recursive" && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-black mb-1">
              Chunking Mode:
              <select
                value={options.chunkingMode || "characters"}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    chunkingMode: e.target.value as "characters" | "tokens",
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
              >
                <option value="characters">Character-Based</option>
                <option value="tokens">Token-Based</option>
              </select>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Choose whether to measure chunk size in characters or tokens
            </p>
          </div>

          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              Recursive Text Splitter
            </h4>
            <p className="text-xs text-gray-700">
              This advanced chunking method recursively splits text using a
              hierarchy of separators, starting with larger units (paragraphs)
              and progressively moving to smaller units (sentences, words) as
              needed. It creates more natural chunks while respecting content
              boundaries.
            </p>
            <p className="text-xs text-gray-700 mt-1">
              You can customize the chunk size, overlap, and even provide your
              own separators in order of precedence.
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-black mb-1">
              Custom Chunk Size:
              <input
                type="number"
                value={options.chunkSize || 500}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    chunkSize: parseInt(e.target.value) || 500,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
                min="10"
                max={options.chunkingMode === "characters" ? 5000 : 1000}
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Maximum size of each chunk in{" "}
              {options.chunkingMode || "characters"}
            </p>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-black mb-1">
              Custom Separators (optional):
              <div className="flex">
                <textarea
                  value={options.customSeparators?.join("\n") || ""}
                  onChange={(e) => {
                    const separators = e.target.value
                      .split("\n")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setOptions({
                      ...options,
                      customSeparators:
                        separators.length > 0 ? separators : undefined,
                    });
                  }}
                  placeholder="Enter one separator per line (e.g., '\n\n', '\n', '. ')"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black font-mono"
                  rows={3}
                />
                <button
                  type="button"
                  onClick={() =>
                    setOptions({
                      ...options,
                      customSeparators: ["\n\n", "\n", ". ", ", ", " ", ""],
                    })
                  }
                  className="mt-1 ml-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300"
                  title="Insert default separators as example"
                >
                  Defaults
                </button>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Custom separators to use for recursive splitting (in order of
              precedence). Leave empty to use defaults.
            </p>
          </div>
        </>
      )}

      {/* Max Chunks for semantic methods */}
      {(method === "semantic" ||
        method === "hybrid" ||
        method === "agentic") && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-black mb-1">
            Max Chunks:
            <input
              type="number"
              value={options.maxChunks}
              onChange={(e) =>
                setOptions({
                  ...options,
                  maxChunks: parseInt(e.target.value) || 0,
                })
              }
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
              min="0"
              max="100"
            />
          </label>
          <p className="text-xs text-black mt-1">0 = no limit</p>
        </div>
      )}
    </div>
  );
}
