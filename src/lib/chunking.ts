/**
 * Text Chunking Utility Library
 * 
 * This library provides various text chunking strategies:
 * - Fixed-Length (Token-Based): Split text into chunks of a fixed number of tokens
 * - Sentence-Based: Split text by sentences
 * - Paragraph-Based: Split text by paragraphs
 * - Sliding Window: Create overlapping chunks
 * - Semantic (Thematic): Group text by semantic relevance
 * - Hybrid/Hierarchical: Combine multiple chunking strategies
 * - Agentic: Dynamic chunking based on content analysis
 */

// Type definitions
export type ChunkingMethod =
  | 'fixed-length'
  | 'fixed-length-chars'
  | 'sentence-based'
  | 'paragraph-based'
  | 'sliding-window'
  | 'semantic'
  | 'hybrid'
  | 'agentic';

export interface ChunkingOptions {
  chunkSize?: number;
  overlap?: number;
  separator?: string;
  maxChunks?: number;
  apiKey?: string; // OpenAI API key for semantic chunking
  chunkingMode?: 'tokens' | 'characters'; // Mode for fixed-length chunking
}

export interface Chunk {
  id: number;
  text: string;
  tokens: number;
  characters: number;
}

export interface ChunkingResult {
  chunks: Chunk[];
  analysis: {
    totalChunks: number;
    averageChunkSize: {
      tokens: number;
      characters: number;
    };
    notes: string;
  };
}

// Simple tokenization (approximation - in production, use a proper tokenizer)
const tokenize = (text: string): string[] => {
  return text.split(/\s+/).filter(Boolean);
};

// Calculate token count for text
const countTokens = (text: string): number => {
  return tokenize(text).length;
};

/**
 * Fixed-Length Chunking
 * 
 * Divides text into chunks of approximately equal size (tokens or characters)
 */
export const fixedLengthChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 100, overlap = 0, chunkingMode } = options;
  
  // Determine if we're using character-based or token-based chunking
  // Use explicit chunkingMode if provided, otherwise use heuristic
  const isCharacterBased = chunkingMode === 'characters' || 
    (chunkingMode !== 'tokens' && chunkSize > 200); // Heuristic: larger chunk sizes are likely character-based
  
  if (isCharacterBased) {
    // For advanced character-based chunking with boundary detection,
    // redirect to the dedicated function
    if (chunkingMode === 'characters') {
      return fixedLengthCharsChunking(text, options);
    }
    
    // Simple character-based chunking (legacy behavior)
    const chunks: Chunk[] = [];
    const step = overlap > 0 ? chunkSize - overlap : chunkSize;
    
    for (let i = 0; i < text.length; i += step) {
      const chunkText = text.substring(i, i + chunkSize);
      
      // Skip if we've reached the end and have only a tiny fragment
      if (chunkText.length < chunkSize / 4 && chunks.length > 0) break;
      
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: countTokens(chunkText),
        characters: chunkText.length
      });
    }
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
    
    return {
      chunks,
      analysis: {
        totalChunks: chunks.length,
        averageChunkSize: {
          tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
          characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
        },
        notes: `Text was divided into ${chunks.length} chunks of approximately ${chunkSize} characters each${overlap > 0 ? ` with ${overlap} characters of overlap between consecutive chunks` : ''}.`
      }
    };
  } else {
    // Token-based chunking
    const tokens = tokenize(text);
    const chunks: Chunk[] = [];
    
    // Calculate effective step size (how many tokens to advance each chunk)
    const step = overlap > 0 ? chunkSize - overlap : chunkSize;
    
    for (let i = 0; i < tokens.length; i += step) {
      const chunkTokens = tokens.slice(i, i + chunkSize);
      // Skip if we've reached the end and have only a tiny fragment
      if (chunkTokens.length < chunkSize / 4 && chunks.length > 0) break;
      
      const chunkText = chunkTokens.join(' ');
      
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: chunkTokens.length,
        characters: chunkText.length
      });
    }
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
    
    return {
      chunks,
      analysis: {
        totalChunks: chunks.length,
        averageChunkSize: {
          tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
          characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
        },
        notes: `Text was divided into ${chunks.length} chunks of approximately ${chunkSize} tokens each${overlap > 0 ? ` with ${overlap} tokens of overlap between consecutive chunks` : ''}.`
      }
    };
  }
};

/**
 * Sentence-Based Chunking
 * 
 * Divides text by sentence boundaries and groups sentences into chunks
 * with support for overlap and better sentence detection
 */
export const sentenceBasedChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 5, overlap = 0, maxChunks = 0 } = options;

  // Improved sentence detection regex that handles:
  // - Common abbreviations (Mr., Dr., etc.)
  // - Quotes and parentheses
  // - Ellipses
  // - Multiple punctuation marks
  // - Decimal numbers
  const sentenceRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|Col|Gen|Lt|Cmdr|Sgt|Capt|Maj|Sen|Rep|Hon|etc|vs|i\.e|e\.g)\.)(?<!\w\.\w.)(?<=\.|\?|!|。|？|！)(?:\s+|$)(?=[A-Z"'([{<]|\s*$)/g;

  // Handle common abbreviations to prevent false sentence breaks
  const preprocessText = (input: string): string => {
    // Replace common abbreviations with placeholders to prevent false breaks
    return input
      .replace(/(\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s+)([A-Z])/g, '$1_PLACEHOLDER_$2')
      .replace(/(\d+\.\d+)/g, '$1_DECIMAL_'); // Protect decimal numbers
  };

  const postprocessText = (input: string): string => {
    // Restore placeholders
    return input
      .replace(/_PLACEHOLDER_/g, '')
      .replace(/_DECIMAL_/g, '');
  };

  // Preprocess text to protect abbreviations
  const processedText = preprocessText(text);

  // Split text while preserving paragraph boundaries
  const paragraphs = processedText.split(/\n\s*\n/).filter(Boolean);
  let allSentences: string[] = [];

  // Process each paragraph separately to respect paragraph boundaries
  paragraphs.forEach(paragraph => {
    // Handle edge case where paragraph has no sentence-ending punctuation
    if (!paragraph.match(/[.!?。？！]/)) {
      allSentences.push(postprocessText(paragraph));
    } else {
      // Split paragraph into sentences
      const paragraphSentences = paragraph
        .split(sentenceRegex)
        .map(s => postprocessText(s.trim()))
        .filter(Boolean);

      // If splitting resulted in no sentences (regex failed), treat paragraph as one sentence
      if (paragraphSentences.length === 0) {
        allSentences.push(postprocessText(paragraph));
      } else {
        allSentences = [...allSentences, ...paragraphSentences];
      }
    }
  });

  // Handle empty result case
  if (allSentences.length === 0) {
    allSentences = [text];
  }

  const chunks: Chunk[] = [];

  // Calculate effective step size if overlap is specified
  const step = overlap > 0 ? chunkSize - overlap : chunkSize;

  // Limit the number of chunks if maxChunks is specified
  const maxSentences = maxChunks > 0 ? maxChunks * chunkSize : allSentences.length;
  const sentencesToProcess = allSentences.slice(0, maxSentences);

  // Create chunks with optional overlap
  for (let i = 0; i < sentencesToProcess.length; i += step) {
    const chunkSentences = sentencesToProcess.slice(i, i + chunkSize);

    // Skip tiny fragments at the end
    if (chunkSentences.length < Math.max(1, chunkSize / 4) && chunks.length > 0) break;

    const chunkText = chunkSentences.join(' ');

    chunks.push({
      id: chunks.length,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    });
  }

  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);

  return {
    chunks,
    analysis: {
      totalChunks: chunks.length,
      averageChunkSize: {
        tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
      },
      notes: `Text was split into ${allSentences.length} sentences${overlap > 0 ? ` with ${overlap} sentences of overlap between chunks` : ''}, then grouped into chunks of about ${chunkSize} sentences each${maxChunks > 0 ? `, limited to ${maxChunks} chunks maximum` : ''}.`
    }
  };
};

/**
 * Paragraph-Based Chunking
 * 
 * Divides text by paragraph boundaries with support for overlap and better paragraph detection
 */
export const paragraphBasedChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { maxChunks = 0, overlap = 0, chunkSize = 0 } = options;

  // Improved paragraph detection with multiple newline patterns
  // This handles various paragraph styles including markdown, plain text, etc.
  const paragraphSeparators = [
    /\n\s*\n/,           // Standard double newline
    /\r\n\s*\r\n/,       // Windows-style
    /\n\s*[-_*]{3,}\s*\n/, // Markdown horizontal rules
    /\n\s*#{1,6}\s+/      // Markdown headers
  ];

  // Combine all separators into a single regex
  const combinedSeparator = new RegExp(paragraphSeparators.map(r => r.source).join('|'), 'g');

  // Split by paragraph markers and clean up
  let paragraphs = text.split(combinedSeparator)
    .map(p => p.trim())
    .filter(Boolean);

  // Handle case where no paragraphs were detected
  if (paragraphs.length === 0) {
    paragraphs = [text];
  }

  const chunks: Chunk[] = [];
  
  // Determine paragraphs per chunk based on chunkSize or default to 3
  const paragraphsPerChunk = chunkSize > 0 ? chunkSize : 3;

  // If maxChunks is specified, adjust paragraphsPerChunk
  const adjustedParagraphsPerChunk = maxChunks > 0 && paragraphs.length > maxChunks * paragraphsPerChunk
    ? Math.ceil(paragraphs.length / maxChunks)
    : paragraphsPerChunk;

  // Calculate step size based on overlap
  const step = overlap > 0 ? Math.max(1, adjustedParagraphsPerChunk - overlap) : adjustedParagraphsPerChunk;

  // Create chunks with consistent overlap handling
  for (let i = 0; i < paragraphs.length; i += step) {
    const chunkParagraphs = paragraphs.slice(i, i + adjustedParagraphsPerChunk);
    
    // Skip tiny fragments at the end
    if (chunkParagraphs.length < Math.max(1, adjustedParagraphsPerChunk / 3) && chunks.length > 0) break;
    
    const chunkText = chunkParagraphs.join('\n\n');
    
    chunks.push({
      id: chunks.length,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    });
    
    // If we've reached the maxChunks limit, stop
    if (maxChunks > 0 && chunks.length >= maxChunks) break;
  }

  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);

  let notesText = `Text was split into ${paragraphs.length} paragraphs`;
  if (overlap > 0) {
    notesText += `, with ${overlap} paragraphs of overlap between chunks`;
  }
  if (maxChunks > 0 && chunks.length === maxChunks) {
    notesText += `, limited to ${maxChunks} chunks maximum`;
  }
  notesText += `, resulting in ${chunks.length} chunks with approximately ${adjustedParagraphsPerChunk} paragraphs per chunk.`;

  return {
    chunks,
    analysis: {
      totalChunks: chunks.length,
      averageChunkSize: {
        tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
      },
      notes: notesText
    }
  };
};

/**
 * Sliding Window Chunking
 * 
 * Creates overlapping chunks of text with configurable window size and step
 */
export const slidingWindowChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 100, overlap = 50 } = options;
  
  // Determine if we're using character-based or token-based chunking
  const isCharacterBased = chunkSize > 200; // Heuristic: larger chunk sizes are likely character-based
  
  if (isCharacterBased) {
    // Character-based sliding window
    const chunks: Chunk[] = [];
    
    // Calculate step size (how many characters to advance each window)
    const step = Math.max(1, chunkSize - overlap); // Ensure step is at least 1
    
    // Optimize for very large texts by limiting the number of chunks
    const maxChunks = 100; // Reasonable limit to prevent excessive processing
    const estimatedChunks = Math.ceil(text.length / step);
    const adjustedStep = estimatedChunks > maxChunks ? Math.ceil(text.length / maxChunks) : step;
    
    for (let i = 0; i < text.length; i += adjustedStep) {
      // Ensure we don't exceed text length
      const end = Math.min(i + chunkSize, text.length);
      const chunkText = text.substring(i, end);
      
      // Skip if we've reached the end and have only a tiny fragment
      if (chunkText.length < chunkSize / 4 && chunks.length > 0) break;
      
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: countTokens(chunkText),
        characters: chunkText.length
      });
      
      // Break if we've reached the maximum number of chunks
      if (chunks.length >= maxChunks) break;
    }
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
    
    return {
      chunks,
      analysis: {
        totalChunks: chunks.length,
        averageChunkSize: {
          tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
          characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
        },
        notes: `Sliding window created ${chunks.length} chunks with window size ${chunkSize} characters and ${overlap} characters of overlap (step size: ${adjustedStep}).`
      }
    };
  } else {
    // Token-based sliding window
    const tokens = tokenize(text);
    const chunks: Chunk[] = [];
    
    // Calculate step size (how many tokens to advance each window)
    const step = Math.max(1, chunkSize - overlap); // Ensure step is at least 1
    
    // Optimize for very large texts
    const maxChunks = 100; // Reasonable limit
    const estimatedChunks = Math.ceil(tokens.length / step);
    const adjustedStep = estimatedChunks > maxChunks ? Math.ceil(tokens.length / maxChunks) : step;
    
    for (let i = 0; i < tokens.length; i += adjustedStep) {
      // Ensure we don't exceed tokens length
      const end = Math.min(i + chunkSize, tokens.length);
      const windowTokens = tokens.slice(i, end);
      
      // Skip if we've reached the end and have only a tiny fragment
      if (windowTokens.length < chunkSize / 4 && chunks.length > 0) break;
      
      const chunkText = windowTokens.join(' ');
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: windowTokens.length,
        characters: chunkText.length
      });
      
      // Break if we've reached the maximum number of chunks
      if (chunks.length >= maxChunks) break;
    }
    
    const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
    const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
    
    return {
      chunks,
      analysis: {
        totalChunks: chunks.length,
        averageChunkSize: {
          tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
          characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
        },
        notes: `Sliding window created ${chunks.length} chunks with window size ${chunkSize} tokens and ${overlap} tokens of overlap (step size: ${adjustedStep}).`
      }
    };
  }
};

/**
 * OpenAI API for embeddings
 * 
 * Calls OpenAI API to get embeddings for text segments
 */
async function getOpenAIEmbeddings(text: string, apiKey: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-ada-002'
      })
    });

    const data = await response.json() as { data: Array<{ embedding: number[] }> };
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error getting embeddings:', error);
    // Return a zero vector as fallback
    return Array(1536).fill(0);
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Semantic (Thematic) Chunking
 * 
 * Uses OpenAI embeddings to identify semantic boundaries in text
 * Falls back to heuristic method if no API key is provided
 */
/**
 * Semantic (Thematic) Chunking with improved clustering
 */
export const semanticChunking = async (
  text: string,
  options: ChunkingOptions = {}
): Promise<ChunkingResult> => {
  const { maxChunks = 0, overlap = 0, apiKey } = options;
  
  // If API key is provided, use OpenAI embeddings for semantic chunking
  if (apiKey) {
    try {
      // Split text into paragraphs for embedding analysis
      const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
      
      // If text is too short, fall back to paragraph chunking
      if (paragraphs.length <= 1) {
        return paragraphBasedChunking(text, options);
      }
      
      console.log('Using OpenAI embeddings for semantic chunking');
      
      // Get embeddings for each paragraph
      const embeddingsPromises = paragraphs.map(paragraph => 
        getOpenAIEmbeddings(paragraph, apiKey)
      );
      
      const embeddings = await Promise.all(embeddingsPromises);
      
      // Calculate similarity matrix between paragraphs
      const similarityMatrix: number[][] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < paragraphs.length; j++) {
          similarityMatrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
        }
      }
      
      // --- IMPROVED SEMANTIC BOUNDARY DETECTION ---
      
      // Instead of using a fixed threshold, use dynamic thresholding
      // Calculate average similarity between adjacent paragraphs
      let totalAdjacentSimilarity = 0;
      let adjacentPairs = 0;
      
      for (let i = 0; i < paragraphs.length - 1; i++) {
        totalAdjacentSimilarity += similarityMatrix[i][i+1];
        adjacentPairs++;
      }
      
      const avgAdjacentSimilarity = totalAdjacentSimilarity / adjacentPairs;
      
      // Set threshold as a percentage of the average similarity
      // Lower values create more boundaries (more granular chunks)
      const thresholdPercentage = 0.8;
      const dynamicThreshold = avgAdjacentSimilarity * thresholdPercentage;
      
      // Find local minima in similarity to detect natural topic breaks
      // A local minimum is where similarity is lower than both its neighbors
      const semanticBoundaries: number[] = [0]; // Start of document is always a boundary
      
      for (let i = 1; i < paragraphs.length - 1; i++) {
        const prevSimilarity = similarityMatrix[i-1][i];
        const nextSimilarity = similarityMatrix[i][i+1];
        const currentSimilarity = (prevSimilarity + nextSimilarity) / 2;
        
        // Check if this is a local minimum AND below our dynamic threshold
        if (currentSimilarity < dynamicThreshold && 
            currentSimilarity < prevSimilarity && 
            currentSimilarity < nextSimilarity) {
          semanticBoundaries.push(i);
        }
      }
      
      // Always include the end of the document as a boundary
      if (!semanticBoundaries.includes(paragraphs.length)) {
        semanticBoundaries.push(paragraphs.length);
      }
      
      // --- IMPLEMENT ADVANCED CLUSTERING FOR BETTER THEMATIC SECTIONS ---
      
      // Agglomerative clustering approach
      let clusters: number[][] = paragraphs.map((_, i) => [i]); // Start with each paragraph as its own cluster
      
      // If we have too many initial boundaries, merge similar clusters until we reach desired number
      const targetClusters = maxChunks > 0 ? Math.min(maxChunks, paragraphs.length / 3) : paragraphs.length / 3;
      
      while (clusters.length > targetClusters) {
        let maxSimilarity = -1;
        let mergeClusters: [number, number] = [-1, -1];
        
        // Find the two most similar adjacent clusters
        for (let i = 0; i < clusters.length - 1; i++) {
          const cluster1 = clusters[i];
          const cluster2 = clusters[i + 1];
          
          // Calculate average similarity between all paragraphs in the two clusters
          let totalSimilarity = 0;
          let pairCount = 0;
          
          for (const idx1 of cluster1) {
            for (const idx2 of cluster2) {
              totalSimilarity += similarityMatrix[idx1][idx2];
              pairCount++;
            }
          }
          
          const avgSimilarity = totalSimilarity / pairCount;
          
          if (avgSimilarity > maxSimilarity) {
            maxSimilarity = avgSimilarity;
            mergeClusters = [i, i + 1];
          }
        }
        
        // Merge the most similar clusters
        if (mergeClusters[0] >= 0) {
          const [c1, c2] = mergeClusters;
          clusters[c1] = [...clusters[c1], ...clusters[c2]];
          clusters.splice(c2, 1);
        } else {
          break; // No more merges possible
        }
      }
      
      clusters = clusters.map(cluster => cluster.sort((a, b) => a - b));
      const rawChunks: {
        text: string,
        paragraphIndices: number[],
        embedding: number[]
      }[] = [];
      
      for (const cluster of clusters) {
        const clusterParagraphs = cluster.map(idx => paragraphs[idx]);
        const clusterText = clusterParagraphs.join('\n\n');
        
        // Calculate a representative embedding for the entire cluster
        // Weighted average based on paragraph length
        const totalLength = clusterParagraphs.reduce((sum, p) => sum + p.length, 0);
        const clusterEmbedding = new Array(embeddings[0].length).fill(0);
        
        for (let i = 0; i < cluster.length; i++) {
          const paragraphIdx = cluster[i];
          const paragraphLength = paragraphs[paragraphIdx].length;
          const weight = paragraphLength / totalLength;
          
          for (let j = 0; j < clusterEmbedding.length; j++) {
            clusterEmbedding[j] += embeddings[paragraphIdx][j] * weight;
          }
        }
        
        rawChunks.push({
          text: clusterText,
          paragraphIndices: cluster,
          embedding: clusterEmbedding
        });
      }
      
      // Sort chunks by their position in the document
      rawChunks.sort((a, b) => Math.min(...a.paragraphIndices) - Math.min(...b.paragraphIndices));
      
      // Create final chunks with semantic overlap if specified
      const finalChunks: Chunk[] = [];
      
      if (overlap > 0 && rawChunks.length > 1) {
        // Sophisticated overlap that intelligently shares content between chunks
        for (let i = 0; i < rawChunks.length; i++) {
          let chunkText = rawChunks[i].text;
          const chunkEmbedding = rawChunks[i].embedding;
          
          // Add overlap from other chunks based on semantic similarity
          for (let j = 0; j < rawChunks.length; j++) {
            if (i === j) continue; // Skip self
            
            const otherChunk = rawChunks[j];
            const similarity = cosineSimilarity(chunkEmbedding, otherChunk.embedding);
            
            // Only add content from semantically similar chunks
            const overlapThreshold = 0.6; // Minimum similarity for overlap
            if (similarity > overlapThreshold) {
              // Calculate how much to include based on similarity and overlap parameter
              const overlapFactor = similarity * (overlap / 100);
              
              // Find the most informative paragraphs to include as overlap
              // These are paragraphs with highest similarity to the current chunk
              const otherParagraphsWithSimilarity = otherChunk.paragraphIndices.map(idx => ({
                idx,
                similarity: cosineSimilarity(chunkEmbedding, embeddings[idx]),
                paragraph: paragraphs[idx]
              }));
              
              // Sort by similarity to current chunk
              otherParagraphsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
              
              // Take top paragraphs based on overlapFactor
              const paragraphsToInclude = Math.max(
                1, 
                Math.round(overlapFactor * otherParagraphsWithSimilarity.length)
              );
              
              const selectedParagraphs = otherParagraphsWithSimilarity
                .slice(0, paragraphsToInclude)
                .map(p => p.paragraph)
                .join('\n\n');
              
              // Add as prefix if it's a previous chunk, suffix if it's a later chunk
              if (j < i) {
                chunkText = selectedParagraphs + '\n\n' + chunkText;
              } else {
                chunkText = chunkText + '\n\n' + selectedParagraphs;
              }
            }
          }
          
          finalChunks.push({
            id: finalChunks.length,
            text: chunkText,
            tokens: countTokens(chunkText),
            characters: chunkText.length
          });
        }
      } else {
        // No overlap, just use the raw chunks
        rawChunks.forEach(chunk => {
          finalChunks.push({
            id: finalChunks.length,
            text: chunk.text,
            tokens: countTokens(chunk.text),
            characters: chunk.text.length
          });
        });
      }
      
      const totalTokens = finalChunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
      const totalCharacters = finalChunks.reduce((sum, chunk) => sum + chunk.characters, 0);
      
      let notesText = `Advanced semantic chunking with OpenAI embeddings identified ${finalChunks.length} thematic sections using agglomerative clustering`;
      if (overlap > 0) {
        notesText += ` with intelligent semantic-based overlap between related chunks`;
      }
      
      return {
        chunks: finalChunks,
        analysis: {
          totalChunks: finalChunks.length,
          averageChunkSize: {
            tokens: Math.round(totalTokens / finalChunks.length),
            characters: Math.round(totalCharacters / finalChunks.length)
          },
          notes: notesText
        }
      };
    } catch (error) {
      console.error('Error in OpenAI semantic chunking:', error);
      // Fall back to heuristic method if OpenAI API fails
      console.log('Falling back to heuristic semantic chunking');
    }
  }
  
  // Fallback to heuristic method if no API key or if API call failed
  return heuristicSemanticChunking(text, options);
};

/**
 * Heuristic-based semantic chunking (fallback method)
 * Uses text patterns to approximate semantic boundaries
 */
function heuristicSemanticChunking(
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult {
  const { maxChunks = 0 } = options;
  
  // Split text into paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  
  // If text is too short, fall back to paragraph chunking
  if (paragraphs.length <= 1) {
    return paragraphBasedChunking(text, options);
  }
  
  // Split text into lines for analysis
  const lines = text.split('\n');
  
  // Identify potential semantic boundaries using heuristics
  const semanticBoundaries: number[] = [0]; // Start with the first line
  
  // Look for headers, section breaks, etc.
  lines.forEach((line, index) => {
    // Check for markdown headers
    if (/^#{1,6}\s+/.test(line)) {
      semanticBoundaries.push(index);
    }
    // Check for horizontal rules
    else if (/^[-_*]{3,}\s*$/.test(line)) {
      semanticBoundaries.push(index);
    }
    // Check for numbered lists that might indicate new sections
    else if (/^\s*1\.\s+/.test(line)) {
      semanticBoundaries.push(index);
    }
    // Check for empty lines that might indicate paragraph breaks
    else if (line.trim() === '' && index > 0 && index < lines.length - 1) {
      // Only count empty lines as boundaries if they're between non-empty lines
      if (lines[index - 1].trim() !== '' && lines[index + 1].trim() !== '') {
        semanticBoundaries.push(index);
      }
    }
  });
  
  // Add the end of the text as a boundary
  semanticBoundaries.push(lines.length);
  
  // Create chunks based on semantic boundaries
  const rawChunks: Chunk[] = [];
  
  for (let i = 0; i < semanticBoundaries.length - 1; i++) {
    const startLine = semanticBoundaries[i];
    const endLine = semanticBoundaries[i + 1];
    
    // Skip boundaries that are too close together
    if (endLine - startLine < 2) continue;
    
    const chunkText = lines.slice(startLine, endLine).join('\n');
    rawChunks.push({
      id: rawChunks.length,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    });
  }
  
  // If no meaningful chunks were found, fall back to paragraph chunking
  if (rawChunks.length === 0) {
    return paragraphBasedChunking(text, options);
  }
  
  // Merge small chunks if needed
  const chunks: Chunk[] = [];
  let currentChunk: Chunk | null = null;
  
  // Process each raw chunk
  rawChunks.forEach((chunk) => {
    if (!currentChunk) {
      currentChunk = { ...chunk };
    } else if (chunk.tokens < 20) { // Merge very small chunks
      currentChunk.text += '\n' + chunk.text;
      currentChunk.tokens += chunk.tokens;
      currentChunk.characters += chunk.characters + 1; // +1 for the newline
    } else {
      chunks.push(currentChunk);
      currentChunk = { ...chunk };
    }
  });
  
  // Don't forget the last chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // Limit the number of chunks if maxChunks is specified
  const finalChunks = maxChunks > 0 && chunks.length > maxChunks
    ? chunks.slice(0, maxChunks)
    : chunks;
  
  // Update IDs to be sequential
  finalChunks.forEach((chunk, index) => {
    chunk.id = index;
  });
  
  const totalTokens = finalChunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  const totalCharacters = finalChunks.reduce((sum, chunk) => sum + chunk.characters, 0);
  
  return {
    chunks: finalChunks,
    analysis: {
      totalChunks: finalChunks.length,
      averageChunkSize: {
        tokens: finalChunks.length > 0 ? Math.round(totalTokens / finalChunks.length) : 0,
        characters: finalChunks.length > 0 ? Math.round(totalCharacters / finalChunks.length) : 0
      },
      notes: `Semantic-like chunking identified ${semanticBoundaries.length - 1} potential section boundaries and created ${finalChunks.length} chunks based on document structure and content.`
    }
  };
}

/**
 * Hybrid/Hierarchical Chunking
 * 
 * Combines multiple chunking strategies for more flexible results
 */
export const hybridChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  // Extract options with sensible defaults
  const maxTokensPerChunk = options.chunkSize || 100;
  const overlap = options.overlap || 0;
  const chunks: Chunk[] = [];
  
  // First, divide by paragraphs
  const { chunks: paragraphChunks } = paragraphBasedChunking(text);
  
  // Process each paragraph chunk based on its size
  paragraphChunks.forEach(paragraph => {
    if (paragraph.tokens <= maxTokensPerChunk) {
      // Paragraph is small enough, use as is
      chunks.push({
        id: chunks.length,
        text: paragraph.text,
        tokens: paragraph.tokens,
        characters: paragraph.characters
      });
    } else if (paragraph.tokens <= maxTokensPerChunk * 2) {
      // Medium-sized paragraph - use sentence-based chunking
      const sentenceOptions: ChunkingOptions = {
        chunkSize: Math.ceil(maxTokensPerChunk / 10), // Approximate sentence count
        overlap: Math.ceil(overlap / 10) // Scale overlap for sentences
      };
      
      const { chunks: sentenceChunks } = sentenceBasedChunking(paragraph.text, sentenceOptions);
      
      // Add sentence chunks with correct IDs
      sentenceChunks.forEach(sentenceChunk => {
        chunks.push({
          id: chunks.length,
          text: sentenceChunk.text,
          tokens: sentenceChunk.tokens,
          characters: sentenceChunk.characters
        });
      });
    } else {
      // Very large paragraph - use sliding window with overlap
      const windowOptions: ChunkingOptions = {
        chunkSize: maxTokensPerChunk,
        overlap: overlap
      };
      
      const { chunks: windowChunks } = slidingWindowChunking(paragraph.text, windowOptions);
      
      // Add window chunks with correct IDs
      windowChunks.forEach(windowChunk => {
        chunks.push({
          id: chunks.length,
          text: windowChunk.text,
          tokens: windowChunk.tokens,
          characters: windowChunk.characters
        });
      });
    }
  });
  
  // Merge very small adjacent chunks if they would fit within maxTokensPerChunk
  if (chunks.length > 1) {
    const mergedChunks: Chunk[] = [];
    let currentChunk: Chunk | null = null;
    
    for (let i = 0; i < chunks.length; i++) {
      if (!currentChunk) {
        currentChunk = { ...chunks[i] };
      } else if (currentChunk.tokens + chunks[i].tokens <= maxTokensPerChunk) {
        // Merge with current chunk
        currentChunk.text += '\n\n' + chunks[i].text;
        currentChunk.tokens += chunks[i].tokens;
        currentChunk.characters += chunks[i].characters + 2; // +2 for the '\n\n'
      } else {
        // Current chunk is full, push it and start a new one
        mergedChunks.push(currentChunk);
        currentChunk = { ...chunks[i] };
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }
    
    // Update IDs to be sequential
    mergedChunks.forEach((chunk, index) => {
      chunk.id = index;
    });
    
    // Replace original chunks with merged ones
    chunks.length = 0;
    chunks.push(...mergedChunks);
  }
  
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
  
  return {
    chunks,
    analysis: {
      totalChunks: chunks.length,
      averageChunkSize: {
        tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
      },
      notes: `Hybrid chunking created ${chunks.length} chunks using a combination of paragraph-based, sentence-based, and sliding window approaches. Target chunk size was ${maxTokensPerChunk} tokens${overlap > 0 ? ` with ${overlap} tokens of overlap where needed` : ''}.`
    }
  };
};

/**
 * Agentic Chunking
 * 
 * Dynamic chunking that analyzes text characteristics and selects the optimal strategy
 */
export const agenticChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  // Analyze the text to determine characteristics
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const paragraphCount = paragraphs.length;
  
  // Count sentences with improved regex
  const sentenceRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|Col|Gen|Lt|Cmdr|Sgt|Capt|Maj|Sen|Rep|Hon|etc|vs|i\.e|e\.g)\.)(?<!\w\.\w.)(?<=\.|\?|!|。|？|！)(?:\s+|$)(?=[A-Z"'([{<]|\s*$)/g;
  const sentenceCount = (text.match(sentenceRegex) || []).length + 1; // +1 because the last sentence might not match
  
  const tokenCount = countTokens(text);
  const avgSentenceLength = sentenceCount > 0 ? tokenCount / sentenceCount : 0;
  const avgParagraphSize = paragraphCount > 0 ? tokenCount / paragraphCount : tokenCount;
  
  // Analyze paragraph length distribution
  const paragraphLengths = paragraphs.map(p => p.length);
  const maxParagraphLength = Math.max(...paragraphLengths, 0);
  const paragraphLengthVariance = calculateVariance(paragraphLengths);
  
  // Analyze content type
  const hasCode = /```[\s\S]*?```|`[\s\S]*?`|\b(function|class|def|var|const|let|import|from|public|private)\b/.test(text);
  const hasLists = /^\s*[-*+]\s+|\b\d+\.\s+/m.test(text);
  const hasHeaders = /^#+\s+/m.test(text);
  
  // Choose strategy based on comprehensive text analysis
  let result: ChunkingResult;
  let strategyDescription: string;
  
  // Set custom options based on text characteristics
  const customOptions = { ...options };
  
  if (hasCode) {
    // Code content - preserve structure with paragraph-based chunking
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(5, paragraphCount));
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking optimized for code content";
  } else if (paragraphCount <= 1 && sentenceCount > 10) {
    // Single paragraph with many sentences - use sentence-based chunking
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(8, Math.ceil(sentenceCount / 3)));
    result = sentenceBasedChunking(text, customOptions);
    strategyDescription = "sentence-based chunking for single paragraphs with many sentences";
  } else if (paragraphLengthVariance > 10000 && maxParagraphLength > 1000) {
    // Highly variable paragraph lengths with some very long paragraphs
    customOptions.overlap = options.overlap || Math.min(50, Math.ceil(options.chunkSize ? options.chunkSize / 5 : 20));
    result = hybridChunking(text, customOptions);
    strategyDescription = "hybrid chunking for text with variable paragraph lengths";
  } else if (avgParagraphSize < 50 && paragraphCount > 5) {
    // Many small paragraphs - use paragraph-based chunking
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(10, Math.ceil(paragraphCount / 3)));
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking for multiple small paragraphs";
  } else if (avgSentenceLength > 20) {
    // Long sentences - use sliding window with overlap
    customOptions.overlap = options.overlap || Math.min(50, Math.ceil(options.chunkSize ? options.chunkSize / 4 : 25));
    result = slidingWindowChunking(text, customOptions);
    strategyDescription = "sliding window with overlap for long sentences";
  } else if (tokenCount > 1000) {
    // Long document - use hybrid approach
    result = hybridChunking(text, customOptions);
    strategyDescription = "hybrid chunking for lengthy documents";
  } else if (hasLists || hasHeaders) {
    // Structured content with lists or headers
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking for structured content with lists or headers";
  } else {
    // Default to semantic-like chunking for medium-sized documents
    result = heuristicSemanticChunking(text, customOptions);
    strategyDescription = "semantic-like chunking for medium-sized documents";
  }
  
  // Add detailed agentic analysis note
  result.analysis.notes = `Agentic chunking automatically selected ${strategyDescription} based on document analysis: ${paragraphCount} paragraphs, ${sentenceCount} sentences, avg sentence length: ${Math.round(avgSentenceLength)} tokens, avg paragraph size: ${Math.round(avgParagraphSize)} tokens, paragraph length variance: ${Math.round(paragraphLengthVariance)}${hasCode ? ", contains code" : ""}${hasLists ? ", contains lists" : ""}${hasHeaders ? ", contains headers" : ""}.`;
  
  return result;
};

// Helper function to calculate variance
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  const squaredDiffs = numbers.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / numbers.length;
}

// Modified chunking function dispatcher to handle async semanticChunking
export async function chunkTextAsync(
  text: string,
  method: ChunkingMethod,
  options: ChunkingOptions = {}
): Promise<ChunkingResult> {
  switch (method) {
    case 'fixed-length':
      return fixedLengthChunking(text, options);
    case 'fixed-length-chars':
      return fixedLengthCharsChunking(text, options);
    case 'sentence-based':
      return sentenceBasedChunking(text, options);
    case 'paragraph-based':
      return paragraphBasedChunking(text, options);
    case 'sliding-window':
      return slidingWindowChunking(text, options);
    case 'semantic':
      return semanticChunking(text, options);
    case 'hybrid':
      return hybridChunking(text, options);
    case 'agentic':
      return agenticChunking(text, options);
    default:
      throw new Error(`Unsupported chunking method: ${method}`);
  }
}

/**
 * Fixed-Length Character-Based Chunking
 * 
 * Divides text into chunks of exactly the specified number of characters,
 * with options for respecting word boundaries, sentence boundaries, and more.
 */
export const fixedLengthCharsChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { 
    chunkSize = 500, 
    overlap = 50,
    maxChunks = 0,
    separator = '' 
  } = options;
  
  // Ensure positive values
  const effectiveChunkSize = Math.max(10, chunkSize);
  const effectiveOverlap = Math.min(effectiveChunkSize - 1, Math.max(0, overlap));
  
  // Calculate step size (how many characters to advance each chunk)
  const step = effectiveChunkSize - effectiveOverlap;
  
  const chunks: Chunk[] = [];
  
  // Helper function to find a good break point near the target position
  const findBreakPoint = (text: string, targetPos: number): number => {
    // Preferred break points in order of priority
    const sentenceBreak = /[.!?]\s+/g;
    const paragraphBreak = /\n\s*\n/g;
    const lineBreak = /\n/g;
    const wordBreak = /\s+/g;
    
    // Search range (look back up to 20% of chunk size for a good break point)
    const searchRange = Math.min(targetPos, Math.ceil(effectiveChunkSize * 0.2));
    const minPos = targetPos - searchRange;
    const searchText = text.substring(minPos, targetPos);
    
    // Try to find sentence breaks first
    let matches = [...searchText.matchAll(sentenceBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    
    // Try paragraph breaks next
    matches = [...searchText.matchAll(paragraphBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    
    // Try line breaks next
    matches = [...searchText.matchAll(lineBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    
    // Fall back to word breaks
    matches = [...searchText.matchAll(wordBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    
    // If no good break point found, just use the target position
    return targetPos;
  };
  
  // Process text in chunks
  for (let i = 0; i < text.length; i += step) {
    // Calculate end position for this chunk
    let endPos = Math.min(i + effectiveChunkSize, text.length);
    
    // If we're not at the end of the text, try to find a better break point
    if (endPos < text.length) {
      endPos = findBreakPoint(text, endPos);
    }
    
    // Extract the chunk text
    const chunkText = text.substring(i, endPos);
    
    // Skip if we've reached the end and have only a tiny fragment
    if (chunkText.length < effectiveChunkSize / 4 && chunks.length > 0) break;
    
    // Add separator if specified
    const finalChunkText = separator ? chunkText + separator : chunkText;
    
    chunks.push({
      id: chunks.length,
      text: finalChunkText,
      tokens: countTokens(finalChunkText),
      characters: finalChunkText.length
    });
    
    // If we've reached the maximum number of chunks, stop
    if (maxChunks > 0 && chunks.length >= maxChunks) break;
  }
  
  const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokens, 0);
  const totalCharacters = chunks.reduce((sum, chunk) => sum + chunk.characters, 0);
  
  return {
    chunks,
    analysis: {
      totalChunks: chunks.length,
      averageChunkSize: {
        tokens: chunks.length > 0 ? Math.round(totalTokens / chunks.length) : 0,
        characters: chunks.length > 0 ? Math.round(totalCharacters / chunks.length) : 0
      },
      notes: `Text was divided into ${chunks.length} chunks of approximately ${effectiveChunkSize} characters each${effectiveOverlap > 0 ? ` with ${effectiveOverlap} characters of overlap between consecutive chunks` : ''}. Smart boundary detection was used to preserve natural text breaks.`
    }
  };
};