"use client";
import { useState, useEffect, FormEvent } from "react";
import {
  ChunkingMethod,
  ChunkingOptions,
  chunkTextAsync,
} from "@/lib/chunking";
import { SAMPLE_TEXT } from "./sample_text";
import { ChunkingForm } from "@/components/chunking/ChunkingForm";
import { ChunkingResults } from "@/components/chunking/ChunkingResults";
import { JsonPreviewModal } from "@/components/ui/JsonPreviewModal";
import { RagInterface } from "@/components/rag/RagInterface";

interface Chunk {
  id: number;
  text: string;
  tokens: number;
  characters: number;
  embedding?: number[];
}

export default function ChunkerUI() {
  // State for text chunking
  const [text, setText] = useState("");
  const [method, setMethod] = useState<ChunkingMethod>("fixed-length");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [analysis, setAnalysis] = useState<{
    totalChunks: number;
    averageChunkSize: { tokens: number; characters: number };
    notes: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");
  const [options, setOptions] = useState<ChunkingOptions>({
    chunkSize: 500,
    overlap: 100,
    separator: "",
    maxChunks: 0,
  });
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  // State for JSON preview
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [jsonPreview, setJsonPreview] = useState("");

  // State for RAG
  const [isRagEnabled, setIsRagEnabled] = useState(false);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingsGenerated, setEmbeddingsGenerated] = useState(false);
  const [finalizedChunks, setFinalizedChunks] = useState<Chunk[]>([]);
  const [queryInput, setQueryInput] = useState("");
  const [queryResults, setQueryResults] = useState<
    Array<{ chunkId: number; text: string; score: number }>
  >([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [activeTab, setActiveTab] = useState<"chunking" | "rag">("chunking");
  const [gptAnswer, setGptAnswer] = useState<string>("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpt-4o-mini" | "gpt-4o">(
    "gpt-4o-mini"
  );

  // Load data from localStorage
  useEffect(() => {
    const loadFromLocalStorage = () => {
      try {
        const savedKey = localStorage.getItem("openai_api_key");
        if (savedKey) {
          setApiKey(savedKey);
        }

        const savedModel = localStorage.getItem("selected_model");
        if (
          savedModel &&
          (savedModel === "gpt-4o-mini" || savedModel === "gpt-4o")
        ) {
          setSelectedModel(savedModel as "gpt-4o-mini" | "gpt-4o");
        }

        // Load last chunking method
        const savedMethod = localStorage.getItem("last_chunking_method");
        if (savedMethod) {
          setMethod(savedMethod as ChunkingMethod);
        }

        // Load last chunking parameters
        const savedOptions = localStorage.getItem("last_chunking_options");
        if (savedOptions) {
          try {
            const parsedOptions = JSON.parse(savedOptions) as ChunkingOptions;
            setOptions(parsedOptions);
            setOptionsLoaded(true);
          } catch (e) {
            console.error("Error parsing saved chunking options:", e);
          }
        }

        const savedChunks = localStorage.getItem("finalized_chunks");
        if (savedChunks) {
          const parsedChunks = JSON.parse(savedChunks) as Chunk[];
          setFinalizedChunks(parsedChunks);

          if (parsedChunks.length > 0) {
            setIsRagEnabled(true);
            const hasEmbeddings = parsedChunks.some((chunk) => chunk.embedding);
            setEmbeddingsGenerated(hasEmbeddings);
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
    };

    loadFromLocalStorage();
  }, []);

  // Save finalized chunks to localStorage
  useEffect(() => {
    if (finalizedChunks.length > 0) {
      localStorage.setItem("finalized_chunks", JSON.stringify(finalizedChunks));
    }
  }, [finalizedChunks]);

  useEffect(() => {
    localStorage.setItem("selected_model", selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem("last_chunking_method", method);
  }, [method]);

  useEffect(() => {
    localStorage.setItem("last_chunking_options", JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    if (optionsLoaded) {
      return;
    }

    switch (method) {
      case "fixed-length":
        setOptions((prev) => ({ ...prev, chunkSize: 500, overlap: 50 }));
        break;
      case "fixed-length-chars":
        setOptions((prev) => ({
          ...prev,
          chunkSize: 500,
          overlap: 50,
          chunkingMode: "characters",
        }));
        break;
      case "recursive":
        setOptions((prev) => ({
          ...prev,
          chunkSize: 500,
          overlap: 50,
          chunkingMode: "characters",
        }));
        break;
      case "sliding-window":
        setOptions((prev) => ({ ...prev, chunkSize: 400, overlap: 100 }));
        break;
      case "hybrid":
        setOptions((prev) => ({
          ...prev,
          chunkSize: 450,
          overlap: 75,
          maxChunks: 0,
        }));
        break;
      case "semantic":
        setOptions((prev) => ({ ...prev, maxChunks: 5, overlap: 10 }));
        break;
      case "sentence-based":
      case "paragraph-based":
        setOptions((prev) => ({ ...prev, maxChunks: 0 }));
        break;
      default:
        break;
    }
  }, [method, optionsLoaded]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    if (method === "semantic" && !apiKey) {
      setError("OpenAI API key is required for semantic chunking");
      return;
    }

    setIsProcessing(true);

    try {
      setTimeout(async () => {
        try {
          const optionsWithApiKey =
            method === "semantic" ? { ...options, apiKey } : options;

          const result = await chunkTextAsync(text, method, optionsWithApiKey);
          setChunks(result.chunks);
          setAnalysis(result.analysis);
          setIsProcessing(false);
        } catch (error) {
          console.error("Error processing text:", error);
          setError(
            error instanceof Error ? error.message : "Unknown error occurred"
          );
          setIsProcessing(false);
        }
      }, 50);
    } catch (error) {
      console.error("Error processing text:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setIsProcessing(false);
    }
  }

  function insertSampleText() {
    setText(SAMPLE_TEXT);
  }

  function clearAll() {
    setText("");
    setChunks([]);
    setAnalysis(null);
    setError(null);
  }

  function downloadChunksAsJson() {
    if (!chunks || chunks.length === 0) {
      setError("No chunks to download");
      return;
    }

    const formattedChunks = chunks.map((chunk) => ({
      chunkNumber: chunk.id + 1,
      metadata: {
        tokens: chunk.tokens,
        characters: chunk.characters,
      },
      content: chunk.text,
    }));

    const jsonStructure = {
      metadata: {
        timestamp: new Date().toISOString(),
        method: method,
        options: {
          chunkSize: options.chunkSize,
          overlap: options.overlap,
          maxChunks: options.maxChunks,
          chunkingMode: options.chunkingMode,
        },
        analysis: analysis
          ? {
              totalChunks: analysis.totalChunks,
              averageChunkSize: analysis.averageChunkSize,
              notes: analysis.notes,
            }
          : null,
        textLength: text.length,
        totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        totalCharacters: chunks.reduce(
          (sum, chunk) => sum + chunk.characters,
          0
        ),
      },
      chunks: formattedChunks,
    };

    const jsonData = JSON.stringify(jsonStructure, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const methodName = method.replace("-", "_");
    link.download = `text_chunks_${methodName}_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function toggleJsonPreview() {
    if (!chunks || chunks.length === 0) {
      setError("No chunks to preview");
      return;
    }

    if (showJsonPreview) {
      setShowJsonPreview(false);
      setJsonPreview("");
      return;
    }

    const formattedChunks = chunks.map((chunk) => ({
      chunkNumber: chunk.id + 1,
      metadata: {
        tokens: chunk.tokens,
        characters: chunk.characters,
      },
      content: chunk.text,
    }));

    const jsonStructure = {
      metadata: {
        timestamp: new Date().toISOString(),
        method: method,
        options: {
          chunkSize: options.chunkSize,
          overlap: options.overlap,
          maxChunks: options.maxChunks,
          chunkingMode: options.chunkingMode,
        },
        analysis: analysis
          ? {
              totalChunks: analysis.totalChunks,
              averageChunkSize: analysis.averageChunkSize,
              notes: analysis.notes,
            }
          : null,
        textLength: text.length,
        totalTokens: chunks.reduce((sum, chunk) => sum + chunk.tokens, 0),
        totalCharacters: chunks.reduce(
          (sum, chunk) => sum + chunk.characters,
          0
        ),
      },
      chunks: formattedChunks.slice(0, 2), // Only show first 2 chunks in preview
    };

    const jsonData = JSON.stringify(jsonStructure, null, 2);
    setJsonPreview(jsonData);
    setShowJsonPreview(true);
  }

  // Finalize chunks for RAG
  function finalizeChunks() {
    if (!chunks || chunks.length === 0) {
      setError("No chunks to finalize");
      return;
    }

    if (!apiKey) {
      setError("OpenAI API key is required for RAG functionality");
      return;
    }

    setFinalizedChunks([...chunks]);
    localStorage.setItem("finalized_chunks", JSON.stringify(chunks));
    setIsRagEnabled(true);
    setActiveTab("rag");
  }

  // Reset RAG
  function resetRag() {
    setIsRagEnabled(false);
    setEmbeddingsGenerated(false);
    setFinalizedChunks([]);
    setQueryInput("");
    setQueryResults([]);
    setActiveTab("chunking");
    localStorage.removeItem("finalized_chunks");
  }

  // Generate embeddings for chunks
  async function generateEmbeddings() {
    if (!finalizedChunks || finalizedChunks.length === 0) {
      setError("No finalized chunks to generate embeddings for");
      return;
    }

    if (!apiKey) {
      setError("OpenAI API key is required for generating embeddings");
      return;
    }

    setIsGeneratingEmbeddings(true);
    setError(null);

    try {
      const chunksWithEmbeddings = [...finalizedChunks];
      const batchSize = 15;

      for (let i = 0; i < chunksWithEmbeddings.length; i += batchSize) {
        const batch = chunksWithEmbeddings.slice(i, i + batchSize);
        const batchPromises = batch.map(async (chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;

          try {
            const response = await fetch(
              "https://api.openai.com/v1/embeddings",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  input: chunk.text,
                  model: "text-embedding-ada-002",
                }),
              }
            );

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = (await response.json()) as {
              data: Array<{ embedding: number[] }>;
            };

            return {
              index: chunkIndex,
              embedding: data.data[0].embedding,
            };
          } catch (error) {
            console.error(
              `Error generating embedding for chunk ${chunkIndex}:`,
              error
            );
            return {
              index: chunkIndex,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach((result) => {
          if ("embedding" in result) {
            chunksWithEmbeddings[result.index].embedding = result.embedding;
          }
        });

        if (i + batchSize < chunksWithEmbeddings.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      setFinalizedChunks(chunksWithEmbeddings);
      setEmbeddingsGenerated(true);
    } catch (error) {
      setError(
        `Error generating embeddings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  }

  // Calculate cosine similarity between vectors
  function calculateCosineSimilarity(vecA: number[], vecB: number[]) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Find similar chunks based on embedding
  function findSimilarChunks(
    queryEmbedding: number[],
    chunks: Chunk[],
    topK = 5
  ) {
    const similarities = chunks
      .filter((chunk) => chunk.embedding)
      .map((chunk) => {
        const similarity = calculateCosineSimilarity(
          queryEmbedding,
          chunk.embedding!
        );
        return {
          chunkId: chunk.id,
          text: chunk.text,
          score: similarity,
        };
      });

    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK);
  }

  // Perform query against embeddings
  async function performQuery() {
    if (!queryInput.trim()) {
      setError("Please enter a query");
      return;
    }

    if (!embeddingsGenerated || finalizedChunks.length === 0) {
      setError("Please generate embeddings first");
      return;
    }

    if (!apiKey) {
      setError("OpenAI API key is required for querying");
      return;
    }

    setIsQuerying(true);
    setGptAnswer("");
    setError(null);

    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: queryInput,
          model: "text-embedding-ada-002",
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        data: Array<{ embedding: number[] }>;
      };
      const queryEmbedding = data.data[0].embedding;
      const similarChunks = findSimilarChunks(queryEmbedding, finalizedChunks);

      setQueryResults(similarChunks);

      if (similarChunks.length === 0) {
        setError("No relevant chunks found for your query");
        return;
      }

      setIsGeneratingAnswer(true);

      const context = similarChunks.map((chunk) => chunk.text).join("\n\n");

      const gptResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that answers questions based on the provided context. Only use information from the context to answer the question. If the context doesn't contain the answer, say \"I don't have enough information to answer this question.\"",
              },
              {
                role: "user",
                content: `Context:\n${context}\n\nQuestion: ${queryInput}`,
              },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        }
      );

      if (!gptResponse.ok) {
        throw new Error(`OpenAI API error: ${gptResponse.status}`);
      }

      const gptData = (await gptResponse.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      setGptAnswer(gptData.choices[0].message.content);
    } catch (error) {
      setError(
        `Error performing query: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsQuerying(false);
      setIsGeneratingAnswer(false);
    }
  }

  return (
    <div className="w-full mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-black">
        Text Chunking Analyzer
      </h1>

      {error && (
        <div
          className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded"
          role="alert"
        >
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "chunking"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("chunking")}
        >
          Text Chunking
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === "rag"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() =>
            isRagEnabled
              ? setActiveTab("rag")
              : setError("Please finalize chunks first")
          }
        >
          RAG + {selectedModel === "gpt-4o" ? "GPT-4o" : "GPT-4o Mini"}
        </button>
      </div>

      {activeTab === "chunking" && (
        <div className="flex flex-col md:flex-row gap-6">
          <ChunkingForm
            method={method}
            setMethod={setMethod}
            options={options}
            setOptions={setOptions}
            apiKey={apiKey}
            setApiKey={setApiKey}
            isProcessing={isProcessing}
            handleSubmit={handleSubmit}
            insertSampleText={insertSampleText}
            clearAll={clearAll}
            finalizeChunks={finalizeChunks}
            hasChunks={chunks.length > 0}
          />

          <ChunkingResults
            text={text}
            setText={setText}
            analysis={analysis}
            chunks={chunks}
            toggleJsonPreview={toggleJsonPreview}
          />
        </div>
      )}

      {activeTab === "rag" && (
        <RagInterface
          apiKey={apiKey}
          setApiKey={setApiKey}
          resetRag={resetRag}
          isGeneratingEmbeddings={isGeneratingEmbeddings}
          embeddingsGenerated={embeddingsGenerated}
          generateEmbeddings={generateEmbeddings}
          finalizedChunksCount={finalizedChunks.length}
          embeddedChunksCount={
            finalizedChunks.filter((c) => c.embedding).length
          }
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          queryInput={queryInput}
          setQueryInput={setQueryInput}
          isQuerying={isQuerying}
          performQuery={performQuery}
          queryResults={queryResults}
          gptAnswer={gptAnswer}
          isGeneratingAnswer={isGeneratingAnswer}
        />
      )}

      <JsonPreviewModal
        showJsonPreview={showJsonPreview}
        setShowJsonPreview={setShowJsonPreview}
        jsonPreview={jsonPreview}
        downloadChunksAsJson={downloadChunksAsJson}
      />
    </div>
  );
}
