'use client';
import { useState, useEffect } from 'react';
import { ChunkingMethod, ChunkingOptions, chunkTextAsync } from '@/lib/chunking';

const SAMPLE_TEXT = `Text chunking is a technique used in natural language processing to break down large texts into smaller, more manageable pieces. This is particularly useful for tasks like summarization, translation, and semantic analysis.

There are several approaches to text chunking:
1. Fixed-length chunking divides text into equal-sized pieces.
2. Sentence-based chunking uses sentence boundaries as natural dividers.
3. Paragraph-based chunking respects paragraph structure.
4. Sliding window creates overlapping chunks for context preservation.
5. Semantic chunking groups text by thematic relevance.

Each method has its own advantages and use cases depending on the specific requirements of the application.`;

// API Key management component
function ApiKeyManager({ apiKey, setApiKey }: { apiKey: string, setApiKey: (key: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  
  const saveKey = () => {
    setApiKey(tempKey);
    localStorage.setItem('openai_api_key', tempKey);
    setIsEditing(false);
  };
  
  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="text-sm font-medium mb-2 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        OpenAI API Key
      </h3>
      
      {isEditing ? (
        <div className="flex items-center">
          <input
            type="password"
            value={tempKey}
            onChange={(e) => setTempKey(e.target.value)}
            className="flex-grow mr-2 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-1 text-sm"
            placeholder="sk-..."
          />
          <button 
            onClick={saveKey}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs">
            Save
          </button>
          <button 
            onClick={() => setIsEditing(false)}
            className="px-2 py-1 ml-1 bg-gray-300 text-gray-700 rounded text-xs">
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {apiKey ? "API key is set" : "No API key set (required for semantic chunking)"}
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
            {apiKey ? "Change" : "Set Key"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ChunkerUI() {
  const [text, setText] = useState('');
  const [method, setMethod] = useState<ChunkingMethod>('fixed-length');
  const [chunks, setChunks] = useState<Array<{ id: number; text: string; tokens: number; characters: number }>>([]);
  const [analysis, setAnalysis] = useState<{ totalChunks: number; averageChunkSize: { tokens: number; characters: number }; notes: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [options, setOptions] = useState<ChunkingOptions>({
    chunkSize: 500,
    overlap: 100,
    separator: '',
    maxChunks: 0
  });
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonPreview, setJsonPreview] = useState('');
  const [isRagEnabled, setIsRagEnabled] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);
  const [finalizedChunks, setFinalizedChunks] = useState<Array<{ id: number; text: string; tokens: number; characters: number; embedding?: number[] }>>([]);
  const [queryInput, setQueryInput] = useState('');
  const [queryResults, setQueryResults] = useState<Array<{ chunkId: number; text: string; score: number }>>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [activeTab, setActiveTab] = useState<'chunking' | 'rag'>('chunking');
  const [gptAnswer, setGptAnswer] = useState<string>('');
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gpt-4o-mini' | 'gpt-4o'>('gpt-4o-mini');

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    switch (method) {
      case 'fixed-length':
        setOptions(prev => ({ ...prev, chunkSize: 500, overlap: 50 }));
        break;
      case 'fixed-length-chars':
        setOptions(prev => ({ ...prev, chunkSize: 500, overlap: 50, chunkingMode: 'characters' }));
        break;
      case 'sliding-window':
        setOptions(prev => ({ ...prev, chunkSize: 400, overlap: 100 }));
        break;
      case 'hybrid':
        setOptions(prev => ({ ...prev, chunkSize: 450, overlap: 75, maxChunks: 0 }));
        break;
      case 'semantic':
        setOptions(prev => ({ ...prev, maxChunks: 5, overlap: 10 }));
        break;
      case 'sentence-based':
      case 'paragraph-based':
        setOptions(prev => ({ ...prev, maxChunks: 0 }));
        break;
      default:
        break;
    }
  }, [method]);

  const methods = [
    { value: 'fixed-length', label: 'Fixed-Length (Token-Based)' },
    { value: 'fixed-length-chars', label: 'Fixed-Length (Character-Based)' },
    { value: 'sentence-based', label: 'Sentence-Based' },
    { value: 'paragraph-based', label: 'Paragraph-Based' },
    { value: 'sliding-window', label: 'Sliding Window' },
    { value: 'semantic', label: 'Semantic (OpenAI)' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'agentic', label: 'Agentic' },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }
    
    // Check if API key is required but not provided
    if (method === 'semantic' && !apiKey) {
      setError('OpenAI API key is required for semantic chunking');
      return;
    }

    setIsProcessing(true);

    try {
      // Process chunking directly in the frontend
      // Wrap in setTimeout to allow UI to update with loading state
      setTimeout(async () => {
        try {
          // Pass API key in options for semantic chunking
          const optionsWithApiKey = method === 'semantic' 
            ? { ...options, apiKey } 
            : options;
            
          const result = await chunkTextAsync(text, method, optionsWithApiKey);
          console.log(result)
          setChunks(result.chunks);
          setAnalysis(result.analysis);
          setIsProcessing(false);
        } catch (error) {
          console.error('Error processing text:', error);
          setError(error instanceof Error ? error.message : 'Unknown error occurred');
          setIsProcessing(false);
        }
      }, 50);
    } catch (error) {
      console.error('Error processing text:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsProcessing(false);
    }
  }

  // Handle sample text insertion
  function insertSampleText() {
    setText(SAMPLE_TEXT);
  }

  // Clear all inputs and results
  function clearAll() {
    setText('');
    setChunks([]);
    setAnalysis(null);
    setError(null);
  }

  function downloadChunksAsJson() {
    if (!chunks || chunks.length === 0) {
      setError('No chunks to download');
      return;
    }

    // Format chunks into the desired structure
    const formattedChunks = chunks.map(chunk => ({
      chunkNumber: chunk.id + 1, // Make it 1-indexed for better readability
      metadata: {
        tokens: chunk.tokens,
        characters: chunk.characters
      },
      content: chunk.text
    }));

    // Create a complete JSON structure with metadata
    const jsonStructure = {
      metadata: {
        timestamp: new Date().toISOString(),
        method: method,
        options: {
          chunkSize: options.chunkSize,
          overlap: options.overlap,
          maxChunks: options.maxChunks,
          chunkingMode: options.chunkingMode
        },
        analysis: analysis ? {
          totalChunks: analysis.totalChunks,
          averageChunkSize: analysis.averageChunkSize,
          notes: analysis.notes
        } : null,
        textLength: text.length,
        totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        totalCharacters: chunks.reduce((sum, chunk) => sum + chunk.characters, 0)
      },
      chunks: formattedChunks
    };

    // Create a JSON blob
    const jsonData = JSON.stringify(jsonStructure, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const methodName = method.replace('-', '_');
    link.download = `text_chunks_${methodName}_${timestamp}.json`;
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function toggleJsonPreview() {
    if (!chunks || chunks.length === 0) {
      setError('No chunks to preview');
      return;
    }

    if (showJsonPreview) {
      // Hide preview
      setShowJsonPreview(false);
      setJsonPreview('');
      return;
    }

    // Format chunks into the desired structure
    const formattedChunks = chunks.map(chunk => ({
      chunkNumber: chunk.id + 1,
      metadata: {
        tokens: chunk.tokens,
        characters: chunk.characters
      },
      content: chunk.text
    }));

    // Create a complete JSON structure with metadata
    const jsonStructure = {
      metadata: {
        timestamp: new Date().toISOString(),
        method: method,
        options: {
          chunkSize: options.chunkSize,
          overlap: options.overlap,
          maxChunks: options.maxChunks,
          chunkingMode: options.chunkingMode
        },
        analysis: analysis ? {
          totalChunks: analysis.totalChunks,
          averageChunkSize: analysis.averageChunkSize,
          notes: analysis.notes
        } : null,
        textLength: text.length,
        totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        totalCharacters: chunks.reduce((sum, chunk) => sum + chunk.characters, 0)
      },
      chunks: formattedChunks.slice(0, 2) // Only show first 2 chunks in preview
    };

    // Add a note about truncated chunks as a string, not as an object
    if (formattedChunks.length > 2) {
      // @ts-expect-error - This is just for preview purposes
      jsonStructure.note = `... ${formattedChunks.length - 2} more chunks (truncated for preview) ...`;
    }

    // Format JSON with indentation
    const jsonData = JSON.stringify(jsonStructure, null, 2);
    setJsonPreview(jsonData);
    setShowJsonPreview(true);
  }

  // Function to finalize chunks and enable RAG
  function finalizeChunks() {
    if (!chunks || chunks.length === 0) {
      setError('No chunks to finalize');
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is required for RAG functionality');
      return;
    }

    // Copy chunks to finalized chunks
    setFinalizedChunks([...chunks]);
    
    // Save to localStorage
    localStorage.setItem('finalized_chunks', JSON.stringify(chunks));
    
    setIsRagEnabled(true);
    setActiveTab('rag');
  }

  // Function to reset RAG state
  function resetRag() {
    setIsRagEnabled(false);
    setEmbeddingsGenerated(false);
    setFinalizedChunks([]);
    setQueryInput('');
    setQueryResults([]);
    setActiveTab('chunking');
    
    // Clear localStorage except for API key
    localStorage.removeItem('finalized_chunks');
    // We intentionally don't remove the API key or selected model
  }

  // Function to generate embeddings for chunks
  async function generateEmbeddings() {
    if (!finalizedChunks || finalizedChunks.length === 0) {
      setError('No finalized chunks to generate embeddings for');
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is required for generating embeddings');
      return;
    }

    setIsGeneratingEmbeddings(true);
    setError(null);

    try {
      const chunksWithEmbeddings = [...finalizedChunks];
      
      // Process chunks in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
        const batch = chunksWithEmbeddings.slice(i, i + batchSize);
        
        // Process each chunk in the batch in parallel
        const batchPromises = batch.map(async (chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;
          
          try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                input: chunk.text,
                model: 'text-embedding-ada-002'
              })
            });

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json() as { data: Array<{ embedding: number[] }> };
            return {
              index: chunkIndex,
              embedding: data.data[0].embedding
            };
          } catch (error) {
            console.error(`Error generating embedding for chunk ${chunkIndex}:`, error);
            return {
              index: chunkIndex,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        });

        // Wait for all chunks in the batch to be processed
        const batchResults = await Promise.all(batchPromises);
        
        // Update chunks with embeddings
        batchResults.forEach(result => {
          if ('embedding' in result) {
            chunksWithEmbeddings[result.index].embedding = result.embedding;
          }
        });
        
        // Small delay between batches to avoid rate limits
        if (i + batchSize < chunksWithEmbeddings.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      setFinalizedChunks(chunksWithEmbeddings);
      setEmbeddingsGenerated(true);
    } catch (error) {
      setError(`Error generating embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }

  // Function to perform similarity search
  function findSimilarChunks(queryEmbedding: number[], chunks: Array<{ id: number; text: string; tokens: number; characters: number; embedding?: number[] }>, topK = 3) {
    // Calculate cosine similarity between query and each chunk
    const similarities = chunks
      .filter(chunk => chunk.embedding)
      .map(chunk => {
        const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding!);
        return {
          chunkId: chunk.id,
          text: chunk.text,
          score: similarity
        };
      });

    // Sort by similarity score (descending)
    similarities.sort((a, b) => b.score - a.score);

    // Return top K results
    return similarities.slice(0, topK);
  }

  // Function to calculate cosine similarity
  function calculateCosineSimilarity(vecA: number[], vecB: number[]) {
    // Calculate dot product
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    
    // Calculate magnitudes
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    // Calculate cosine similarity
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Function to perform RAG query
  async function performQuery() {
    if (!queryInput.trim()) {
      setError('Please enter a query');
      return;
    }

    if (!embeddingsGenerated || finalizedChunks.length === 0) {
      setError('Please generate embeddings first');
      return;
    }

    if (!apiKey) {
      setError('OpenAI API key is required for querying');
      return;
    }

    setIsQuerying(true);
    setGptAnswer('');
    setError(null);

    try {
      // Generate embedding for the query
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          input: queryInput,
          model: 'text-embedding-ada-002'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json() as { data: Array<{ embedding: number[] }> };
      const queryEmbedding = data.data[0].embedding;

      // Find similar chunks
      const similarChunks = findSimilarChunks(queryEmbedding, finalizedChunks);
      setQueryResults(similarChunks);

      // If no results found
      if (similarChunks.length === 0) {
        setError('No relevant chunks found for your query');
        return;
      }

      // Generate answer using GPT-4o Mini
      setIsGeneratingAnswer(true);
      
      // Prepare context from retrieved chunks
      const context = similarChunks
        .map(chunk => chunk.text)
        .join('\n\n');
      
      // Call GPT-4o Mini or GPT-4o to generate an answer
      const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that answers questions based on the provided context. Only use information from the context to answer the question. If the context doesn\'t contain the answer, say "I don\'t have enough information to answer this question."'
            },
            {
              role: 'user',
              content: `Context:\n${context}\n\nQuestion: ${queryInput}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!gptResponse.ok) {
        throw new Error(`OpenAI API error: ${gptResponse.status}`);
      }

      const gptData = await gptResponse.json() as { choices: Array<{ message: { content: string } }> };
      setGptAnswer(gptData.choices[0].message.content);
    } catch (error) {
      setError(`Error performing query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsQuerying(false);
      setIsGeneratingAnswer(false);
    }
  }

  // Add useEffect for localStorage persistence
  useEffect(() => {
    // Load saved states from localStorage on component mount
    const loadFromLocalStorage = () => {
      try {
        // Load API key
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
          setApiKey(savedKey);
        }
        
        // Load selected model
        const savedModel = localStorage.getItem('selected_model');
        if (savedModel && (savedModel === 'gpt-4o-mini' || savedModel === 'gpt-4o')) {
          setSelectedModel(savedModel);
        }
        
        // Load finalized chunks if available
        const savedChunks = localStorage.getItem('finalized_chunks');
        if (savedChunks) {
          const parsedChunks = JSON.parse(savedChunks) as Array<{ id: number; text: string; tokens: number; characters: number; embedding?: number[] }>;
          setFinalizedChunks(parsedChunks);
          
          // If chunks exist, enable RAG
          if (parsedChunks.length > 0) {
            setIsRagEnabled(true);
            
            // Check if embeddings were generated
            const hasEmbeddings = parsedChunks.some(chunk => chunk.embedding);
            setEmbeddingsGenerated(hasEmbeddings);
          }
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error);
      }
    };
    
    loadFromLocalStorage();
  }, []);

  // Save finalized chunks to localStorage when they change
  useEffect(() => {
    if (finalizedChunks.length > 0) {
      localStorage.setItem('finalized_chunks', JSON.stringify(finalizedChunks));
    }
  }, [finalizedChunks]);

  // Save selected model to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('selected_model', selectedModel);
  }, [selectedModel]);

  return (
    <div className="w-full mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-black">Text Chunking Analyzer</h1>

      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs for switching between chunking and RAG */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'chunking' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('chunking')}
        >
          Text Chunking
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'rag' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => isRagEnabled ? setActiveTab('rag') : setError('Please finalize chunks first')}
        >
          RAG + {selectedModel === 'gpt-4o' ? 'GPT-4o' : 'GPT-4o Mini'}
        </button>
      </div>

      {activeTab === 'chunking' && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-6 self-start">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Parameters
                </h3>

                {/* Show relevant parameters based on method */}
                {(method === 'fixed-length' || method === 'fixed-length-chars' || method === 'sliding-window' || method === 'hybrid') && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-black mb-1">
                      Chunk Size {method === 'fixed-length' ? '(tokens)' : '(chars)'}:
                      <input
                        type="number"
                        value={options.chunkSize}
                        onChange={(e) => setOptions({ ...options, chunkSize: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
                        min="10"
                        max={method === 'fixed-length' ? 1000 : 5000}
                      />
                    </label>
                    {method === 'fixed-length-chars' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Character-based chunking with smart boundary detection to preserve natural text breaks
                      </p>
                    )}
                  </div>
                )}

                {/* Show overlap parameter for all methods except paragraph-based when it doesn't make sense */}
                {method !== 'paragraph-based' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-black mb-1">
                      {method === 'sentence-based' ? 'Overlap (sentences):' :
                        method === 'semantic' ? 'Overlap (%)' : 
                        method === 'fixed-length' ? 'Overlap (tokens):' : 'Overlap (chars):'}
                      <input
                        type="number"
                        value={options.overlap}
                        onChange={(e) => setOptions({ ...options, overlap: parseInt(e.target.value) || 0 })}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
                        min="0"
                        max={method === 'semantic' ? 50 :
                          method === 'sentence-based' ? 10 :
                            options?.chunkSize ?? 0 > 10 ? options?.chunkSize ?? 0 - 10 : 0}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      {method === 'sentence-based' ? 'Number of sentences to overlap between chunks' :
                        method === 'semantic' ? 'Percentage of content to overlap between semantic chunks' :
                        method === 'fixed-length' ? 'Tokens to overlap between chunks' :
                        method === 'fixed-length-chars' ? 'Characters to overlap between chunks with smart boundary detection' :
                        method === 'sliding-window' ? 'Characters to overlap between sliding windows' :
                        'Characters to overlap between chunks'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Show API key manager when semantic chunking is selected */}
              {method === 'semantic' && (
                <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
              )}

              {(method === 'semantic' || method === 'hybrid' || method === 'agentic') && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-black mb-1">
                    Max Chunks:
                    <input
                      type="number"
                      value={options.maxChunks}
                      onChange={(e) => setOptions({ ...options, maxChunks: parseInt(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm text-black"
                      min="0"
                      max="100"
                    />
                  </label>
                  <p className="text-xs text-black mt-1">0 = no limit</p>
                </div>
              )}

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : 'Analyze Text'}
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={insertSampleText}
                  className="w-1/2 py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Sample Text
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="w-1/2 py-2 px-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Finalize Chunks Button */}
              {chunks.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={finalizeChunks}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finalize Chunks & Enable RAG
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-black mb-2">
                <div className="flex items-center justify-between">
                  <span>Input Text:</span>
                  <span className="text-xs text-black">{text.length} characters</span>
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-48 p-3 text-base text-black font-mono"
                  placeholder="Enter or paste your text here..."
                  required
                />
              </label>
            </div>

            {analysis && (
              <div className="space-y-6">
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
                      title="Download chunks as JSON"
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

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                      Text Chunks
                    </h2>
                    <button
                      type="button"
                      onClick={toggleJsonPreview}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-sm font-medium rounded-md text-blue-500 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      title="Download chunks as JSON"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Preview JSON
                    </button>
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
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rag' && (
        <div className="space-y-6">
          {/* RAG System UI */}
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

            {/* API Key Manager for RAG */}
            <div className="mb-6">
              <ApiKeyManager apiKey={apiKey} setApiKey={setApiKey} />
            </div>

            {/* Model Selector */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Select OpenAI Model</h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose which OpenAI model to use for generating answers. GPT-4o is more powerful but costs more.
              </p>
              
              <div className="flex flex-col space-y-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-5 w-5 text-blue-600"
                    checked={selectedModel === 'gpt-4o-mini'}
                    onChange={() => setSelectedModel('gpt-4o-mini')}
                  />
                  <span className="ml-2 text-gray-700">
                    GPT-4o Mini
                    <span className="ml-2 text-xs text-gray-500">(Faster, lower cost)</span>
                  </span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-5 w-5 text-blue-600"
                    checked={selectedModel === 'gpt-4o'}
                    onChange={() => setSelectedModel('gpt-4o')}
                  />
                  <span className="ml-2 text-gray-700">
                    GPT-4o
                    <span className="ml-2 text-xs text-gray-500">(More powerful, higher cost)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Embeddings Generation Section */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Step 1: Generate Embeddings</h3>
              <p className="text-sm text-gray-600 mb-4">
                Generate vector embeddings for your {finalizedChunks.length} chunks using OpenAI&apos;s embedding model.
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
                    ✓ {finalizedChunks.filter(c => c.embedding).length} chunks embedded successfully
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Query Interface */}
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

          {/* Query Results */}
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

          {/* GPT Answer */}
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
        </div>
      )}

      {showJsonPreview && (
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
      )}
    </div>
  );
}
