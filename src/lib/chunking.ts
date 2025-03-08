export type ChunkingMethod =
  | 'fixed-length'
  | 'fixed-length-chars'
  | 'recursive'
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
  customSeparators?: string[]; // Custom separators for recursive text splitter
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
const tokenize = (text: string): string[] => {
  return text.split(/\s+/).filter(Boolean);
};
const countTokens = (text: string): number => {
  return tokenize(text).length;
};
export const fixedLengthChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 100, overlap = 0, chunkingMode } = options;
  const isCharacterBased = chunkingMode === 'characters' || 
    (chunkingMode !== 'tokens' && chunkSize > 200); // Heuristic: larger chunk sizes are likely character-based
  if (isCharacterBased) {
    if (chunkingMode === 'characters') {
      return fixedLengthCharsChunking(text, options);
    }
    const chunks: Chunk[] = [];
    const step = overlap > 0 ? chunkSize - overlap : chunkSize;
    for (let i = 0; i < text.length; i += step) {
      const chunkText = text.substring(i, i + chunkSize);
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
    const tokens = tokenize(text);
    const chunks: Chunk[] = [];
    const step = overlap > 0 ? chunkSize - overlap : chunkSize;
    for (let i = 0; i < tokens.length; i += step) {
      const chunkTokens = tokens.slice(i, i + chunkSize);
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
export const sentenceBasedChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 5, overlap = 0, maxChunks = 0 } = options;
  const sentenceRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|Col|Gen|Lt|Cmdr|Sgt|Capt|Maj|Sen|Rep|Hon|etc|vs|i\.e|e\.g)\.)(?<!\w\.\w.)(?<=\.|\?|!|。|？|！)(?:\s+|$)(?=[A-Z"'([{<]|\s*$)/g;
  const preprocessText = (input: string): string => {
    return input
      .replace(/(\b(?:Mr|Mrs|Ms|Dr|Prof)\.\s+)([A-Z])/g, '$1_PLACEHOLDER_$2')
      .replace(/(\d+\.\d+)/g, '$1_DECIMAL_'); // Protect decimal numbers
  };
  const postprocessText = (input: string): string => {
    return input
      .replace(/_PLACEHOLDER_/g, '')
      .replace(/_DECIMAL_/g, '');
  };
  const processedText = preprocessText(text);
  const paragraphs = processedText.split(/\n\s*\n/).filter(Boolean);
  let allSentences: string[] = [];
  paragraphs.forEach(paragraph => {
    if (!paragraph.match(/[.!?。？！]/)) {
      allSentences.push(postprocessText(paragraph));
    } else {
      const paragraphSentences = paragraph
        .split(sentenceRegex)
        .map(s => postprocessText(s.trim()))
        .filter(Boolean);
      if (paragraphSentences.length === 0) {
        allSentences.push(postprocessText(paragraph));
      } else {
        allSentences = [...allSentences, ...paragraphSentences];
      }
    }
  });
  if (allSentences.length === 0) {
    allSentences = [text];
  }
  const chunks: Chunk[] = [];
  const step = overlap > 0 ? chunkSize - overlap : chunkSize;
  const maxSentences = maxChunks > 0 ? maxChunks * chunkSize : allSentences.length;
  const sentencesToProcess = allSentences.slice(0, maxSentences);
  for (let i = 0; i < sentencesToProcess.length; i += step) {
    const chunkSentences = sentencesToProcess.slice(i, i + chunkSize);
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
export const paragraphBasedChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { maxChunks = 0, overlap = 0, chunkSize = 0 } = options;
  const paragraphSeparators = [
    /\n\s*\n/,           // Standard double newline
    /\r\n\s*\r\n/,       // Windows-style
    /\n\s*[-_*]{3,}\s*\n/, // Markdown horizontal rules
    /\n\s*#{1,6}\s+/      // Markdown headers
  ];
  const combinedSeparator = new RegExp(paragraphSeparators.map(r => r.source).join('|'), 'g');
  let paragraphs = text.split(combinedSeparator)
    .map(p => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) {
    paragraphs = [text];
  }
  const chunks: Chunk[] = [];
  const paragraphsPerChunk = chunkSize > 0 ? chunkSize : 3;
  const adjustedParagraphsPerChunk = maxChunks > 0 && paragraphs.length > maxChunks * paragraphsPerChunk
    ? Math.ceil(paragraphs.length / maxChunks)
    : paragraphsPerChunk;
  const step = overlap > 0 ? Math.max(1, adjustedParagraphsPerChunk - overlap) : adjustedParagraphsPerChunk;
  for (let i = 0; i < paragraphs.length; i += step) {
    const chunkParagraphs = paragraphs.slice(i, i + adjustedParagraphsPerChunk);
    if (chunkParagraphs.length < Math.max(1, adjustedParagraphsPerChunk / 3) && chunks.length > 0) break;
    const chunkText = chunkParagraphs.join('\n\n');
    chunks.push({
      id: chunks.length,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    });
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
export const slidingWindowChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { chunkSize = 100, overlap = 50 } = options;
  const isCharacterBased = chunkSize > 200; // Heuristic: larger chunk sizes are likely character-based
  if (isCharacterBased) {
    const chunks: Chunk[] = [];
    const step = Math.max(1, chunkSize - overlap); // Ensure step is at least 1
    const maxChunks = 100; // Reasonable limit to prevent excessive processing
    const estimatedChunks = Math.ceil(text.length / step);
    const adjustedStep = estimatedChunks > maxChunks ? Math.ceil(text.length / maxChunks) : step;
    for (let i = 0; i < text.length; i += adjustedStep) {
      const end = Math.min(i + chunkSize, text.length);
      const chunkText = text.substring(i, end);
      if (chunkText.length < chunkSize / 4 && chunks.length > 0) break;
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: countTokens(chunkText),
        characters: chunkText.length
      });
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
    const tokens = tokenize(text);
    const chunks: Chunk[] = [];
    const step = Math.max(1, chunkSize - overlap); // Ensure step is at least 1
    const maxChunks = 100; // Reasonable limit
    const estimatedChunks = Math.ceil(tokens.length / step);
    const adjustedStep = estimatedChunks > maxChunks ? Math.ceil(tokens.length / maxChunks) : step;
    for (let i = 0; i < tokens.length; i += adjustedStep) {
      const end = Math.min(i + chunkSize, tokens.length);
      const windowTokens = tokens.slice(i, end);
      if (windowTokens.length < chunkSize / 4 && chunks.length > 0) break;
      const chunkText = windowTokens.join(' ');
      chunks.push({
        id: chunks.length,
        text: chunkText,
        tokens: windowTokens.length,
        characters: chunkText.length
      });
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
    return Array(1536).fill(0);
  }
}
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
export const semanticChunking = async (
  text: string,
  options: ChunkingOptions = {}
): Promise<ChunkingResult> => {
  const { maxChunks = 0, overlap = 0, apiKey } = options;
  if (apiKey) {
    try {
      const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
      if (paragraphs.length <= 1) {
        return paragraphBasedChunking(text, options);
      }
      console.log('Using OpenAI embeddings for semantic chunking');
      const embeddingsPromises = paragraphs.map(paragraph => 
        getOpenAIEmbeddings(paragraph, apiKey)
      );
      const embeddings = await Promise.all(embeddingsPromises);
      const similarityMatrix: number[][] = [];
      for (let i = 0; i < paragraphs.length; i++) {
        similarityMatrix[i] = [];
        for (let j = 0; j < paragraphs.length; j++) {
          similarityMatrix[i][j] = cosineSimilarity(embeddings[i], embeddings[j]);
        }
      }
      let totalAdjacentSimilarity = 0;
      let adjacentPairs = 0;
      for (let i = 0; i < paragraphs.length - 1; i++) {
        totalAdjacentSimilarity += similarityMatrix[i][i+1];
        adjacentPairs++;
      }
      const avgAdjacentSimilarity = totalAdjacentSimilarity / adjacentPairs;
      const thresholdPercentage = 0.8;
      const dynamicThreshold = avgAdjacentSimilarity * thresholdPercentage;
      const semanticBoundaries: number[] = [0]; // Start of document is always a boundary
      for (let i = 1; i < paragraphs.length - 1; i++) {
        const prevSimilarity = similarityMatrix[i-1][i];
        const nextSimilarity = similarityMatrix[i][i+1];
        const currentSimilarity = (prevSimilarity + nextSimilarity) / 2;
        if (currentSimilarity < dynamicThreshold && 
            currentSimilarity < prevSimilarity && 
            currentSimilarity < nextSimilarity) {
          semanticBoundaries.push(i);
        }
      }
      if (!semanticBoundaries.includes(paragraphs.length)) {
        semanticBoundaries.push(paragraphs.length);
      }
      let clusters: number[][] = paragraphs.map((_, i) => [i]); // Start with each paragraph as its own cluster
      const targetClusters = maxChunks > 0 ? Math.min(maxChunks, paragraphs.length / 3) : paragraphs.length / 3;
      while (clusters.length > targetClusters) {
        let maxSimilarity = -1;
        let mergeClusters: [number, number] = [-1, -1];
        for (let i = 0; i < clusters.length - 1; i++) {
          const cluster1 = clusters[i];
          const cluster2 = clusters[i + 1];
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
      rawChunks.sort((a, b) => Math.min(...a.paragraphIndices) - Math.min(...b.paragraphIndices));
      const finalChunks: Chunk[] = [];
      if (overlap > 0 && rawChunks.length > 1) {
        for (let i = 0; i < rawChunks.length; i++) {
          let chunkText = rawChunks[i].text;
          const chunkEmbedding = rawChunks[i].embedding;
          for (let j = 0; j < rawChunks.length; j++) {
            if (i === j) continue; // Skip self
            const otherChunk = rawChunks[j];
            const similarity = cosineSimilarity(chunkEmbedding, otherChunk.embedding);
            const overlapThreshold = 0.6; // Minimum similarity for overlap
            if (similarity > overlapThreshold) {
              const overlapFactor = similarity * (overlap / 100);
              const otherParagraphsWithSimilarity = otherChunk.paragraphIndices.map(idx => ({
                idx,
                similarity: cosineSimilarity(chunkEmbedding, embeddings[idx]),
                paragraph: paragraphs[idx]
              }));
              otherParagraphsWithSimilarity.sort((a, b) => b.similarity - a.similarity);
              const paragraphsToInclude = Math.max(
                1, 
                Math.round(overlapFactor * otherParagraphsWithSimilarity.length)
              );
              const selectedParagraphs = otherParagraphsWithSimilarity
                .slice(0, paragraphsToInclude)
                .map(p => p.paragraph)
                .join('\n\n');
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
      console.log('Falling back to heuristic semantic chunking');
    }
  }
  return heuristicSemanticChunking(text, options);
};
function heuristicSemanticChunking(
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult {
  const { maxChunks = 0 } = options;
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return paragraphBasedChunking(text, options);
  }
  const lines = text.split('\n');
  const semanticBoundaries: number[] = [0]; // Start with the first line
  lines.forEach((line, index) => {
    if (/^#{1,6}\s+/.test(line)) {
      semanticBoundaries.push(index);
    }
    else if (/^[-_*]{3,}\s*$/.test(line)) {
      semanticBoundaries.push(index);
    }
    else if (/^\s*1\.\s+/.test(line)) {
      semanticBoundaries.push(index);
    }
    else if (line.trim() === '' && index > 0 && index < lines.length - 1) {
      if (lines[index - 1].trim() !== '' && lines[index + 1].trim() !== '') {
        semanticBoundaries.push(index);
      }
    }
  });
  semanticBoundaries.push(lines.length);
  const rawChunks: Chunk[] = [];
  for (let i = 0; i < semanticBoundaries.length - 1; i++) {
    const startLine = semanticBoundaries[i];
    const endLine = semanticBoundaries[i + 1];
    if (endLine - startLine < 2) continue;
    const chunkText = lines.slice(startLine, endLine).join('\n');
    rawChunks.push({
      id: rawChunks.length,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    });
  }
  if (rawChunks.length === 0) {
    return paragraphBasedChunking(text, options);
  }
  const chunks: Chunk[] = [];
  let currentChunk: Chunk | null = null;
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
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  const finalChunks = maxChunks > 0 && chunks.length > maxChunks
    ? chunks.slice(0, maxChunks)
    : chunks;
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
export const hybridChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const maxTokensPerChunk = options.chunkSize || 100;
  const overlap = options.overlap || 0;
  const chunks: Chunk[] = [];
  const { chunks: paragraphChunks } = paragraphBasedChunking(text);
  paragraphChunks.forEach(paragraph => {
    if (paragraph.tokens <= maxTokensPerChunk) {
      chunks.push({
        id: chunks.length,
        text: paragraph.text,
        tokens: paragraph.tokens,
        characters: paragraph.characters
      });
    } else if (paragraph.tokens <= maxTokensPerChunk * 2) {
      const sentenceOptions: ChunkingOptions = {
        chunkSize: Math.ceil(maxTokensPerChunk / 10), // Approximate sentence count
        overlap: Math.ceil(overlap / 10) // Scale overlap for sentences
      };
      const { chunks: sentenceChunks } = sentenceBasedChunking(paragraph.text, sentenceOptions);
      sentenceChunks.forEach(sentenceChunk => {
        chunks.push({
          id: chunks.length,
          text: sentenceChunk.text,
          tokens: sentenceChunk.tokens,
          characters: sentenceChunk.characters
        });
      });
    } else {
      const windowOptions: ChunkingOptions = {
        chunkSize: maxTokensPerChunk,
        overlap: overlap
      };
      const { chunks: windowChunks } = slidingWindowChunking(paragraph.text, windowOptions);
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
  if (chunks.length > 1) {
    const mergedChunks: Chunk[] = [];
    let currentChunk: Chunk | null = null;
    for (let i = 0; i < chunks.length; i++) {
      if (!currentChunk) {
        currentChunk = { ...chunks[i] };
      } else if (currentChunk.tokens + chunks[i].tokens <= maxTokensPerChunk) {
        currentChunk.text += '\n\n' + chunks[i].text;
        currentChunk.tokens += chunks[i].tokens;
        currentChunk.characters += chunks[i].characters + 2; // +2 for the '\n\n'
      } else {
        mergedChunks.push(currentChunk);
        currentChunk = { ...chunks[i] };
      }
    }
    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }
    mergedChunks.forEach((chunk, index) => {
      chunk.id = index;
    });
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
export const agenticChunking = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
  const paragraphCount = paragraphs.length;
  const sentenceRegex = /(?<!\b(?:Mr|Mrs|Ms|Dr|Prof|Rev|Col|Gen|Lt|Cmdr|Sgt|Capt|Maj|Sen|Rep|Hon|etc|vs|i\.e|e\.g)\.)(?<!\w\.\w.)(?<=\.|\?|!|。|？|！)(?:\s+|$)(?=[A-Z"'([{<]|\s*$)/g;
  const sentenceCount = (text.match(sentenceRegex) || []).length + 1; // +1 because the last sentence might not match
  const tokenCount = countTokens(text);
  const avgSentenceLength = sentenceCount > 0 ? tokenCount / sentenceCount : 0;
  const avgParagraphSize = paragraphCount > 0 ? tokenCount / paragraphCount : tokenCount;
  const paragraphLengths = paragraphs.map(p => p.length);
  const maxParagraphLength = Math.max(...paragraphLengths, 0);
  const paragraphLengthVariance = calculateVariance(paragraphLengths);
  const hasCode = /```[\s\S]*?```|`[\s\S]*?`|\b(function|class|def|var|const|let|import|from|public|private)\b/.test(text);
  const hasLists = /^\s*[-*+]\s+|\b\d+\.\s+/m.test(text);
  const hasHeaders = /^#+\s+/m.test(text);
  let result: ChunkingResult;
  let strategyDescription: string;
  const customOptions = { ...options };
  if (hasCode) {
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(5, paragraphCount));
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking optimized for code content";
  } else if (paragraphCount <= 1 && sentenceCount > 10) {
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(8, Math.ceil(sentenceCount / 3)));
    result = sentenceBasedChunking(text, customOptions);
    strategyDescription = "sentence-based chunking for single paragraphs with many sentences";
  } else if (paragraphLengthVariance > 10000 && maxParagraphLength > 1000) {
    customOptions.overlap = options.overlap || Math.min(50, Math.ceil(options.chunkSize ? options.chunkSize / 5 : 20));
    result = hybridChunking(text, customOptions);
    strategyDescription = "hybrid chunking for text with variable paragraph lengths";
  } else if (avgParagraphSize < 50 && paragraphCount > 5) {
    customOptions.chunkSize = options.chunkSize || Math.max(3, Math.min(10, Math.ceil(paragraphCount / 3)));
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking for multiple small paragraphs";
  } else if (avgSentenceLength > 20) {
    customOptions.overlap = options.overlap || Math.min(50, Math.ceil(options.chunkSize ? options.chunkSize / 4 : 25));
    result = slidingWindowChunking(text, customOptions);
    strategyDescription = "sliding window with overlap for long sentences";
  } else if (tokenCount > 1000) {
    result = hybridChunking(text, customOptions);
    strategyDescription = "hybrid chunking for lengthy documents";
  } else if (hasLists || hasHeaders) {
    result = paragraphBasedChunking(text, customOptions);
    strategyDescription = "paragraph-based chunking for structured content with lists or headers";
  } else {
    result = heuristicSemanticChunking(text, customOptions);
    strategyDescription = "semantic-like chunking for medium-sized documents";
  }
  result.analysis.notes = `Agentic chunking automatically selected ${strategyDescription} based on document analysis: ${paragraphCount} paragraphs, ${sentenceCount} sentences, avg sentence length: ${Math.round(avgSentenceLength)} tokens, avg paragraph size: ${Math.round(avgParagraphSize)} tokens, paragraph length variance: ${Math.round(paragraphLengthVariance)}${hasCode ? ", contains code" : ""}${hasLists ? ", contains lists" : ""}${hasHeaders ? ", contains headers" : ""}.`;
  return result;
};
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
  const squaredDiffs = numbers.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / numbers.length;
}
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
    case 'recursive':
      return recursiveTextSplitter(text, options);
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
  const effectiveChunkSize = Math.max(10, chunkSize);
  const effectiveOverlap = Math.min(effectiveChunkSize - 1, Math.max(0, overlap));
  const step = effectiveChunkSize - effectiveOverlap;
  const chunks: Chunk[] = [];
  const findBreakPoint = (text: string, targetPos: number): number => {
    const sentenceBreak = /[.!?]\s+/g;
    const paragraphBreak = /\n\s*\n/g;
    const lineBreak = /\n/g;
    const wordBreak = /\s+/g;
    const searchRange = Math.min(targetPos, Math.ceil(effectiveChunkSize * 0.2));
    const minPos = targetPos - searchRange;
    const searchText = text.substring(minPos, targetPos);
    let matches = [...searchText.matchAll(sentenceBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    matches = [...searchText.matchAll(paragraphBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    matches = [...searchText.matchAll(lineBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    matches = [...searchText.matchAll(wordBreak)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      return minPos + (lastMatch.index || 0) + lastMatch[0].length;
    }
    return targetPos;
  };
  for (let i = 0; i < text.length; i += step) {
    let endPos = Math.min(i + effectiveChunkSize, text.length);
    if (endPos < text.length) {
      endPos = findBreakPoint(text, endPos);
    }
    const chunkText = text.substring(i, endPos);
    if (chunkText.length < effectiveChunkSize / 4 && chunks.length > 0) break;
    const finalChunkText = separator ? chunkText + separator : chunkText;
    chunks.push({
      id: chunks.length,
      text: finalChunkText,
      tokens: countTokens(finalChunkText),
      characters: finalChunkText.length
    });
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
export const recursiveTextSplitter = (
  text: string,
  options: ChunkingOptions = {}
): ChunkingResult => {
  const { 
    chunkSize = 500, 
    overlap = 50,
    maxChunks = 0,
    chunkingMode = 'characters',
    customSeparators
  } = options;
  const defaultSeparators = [
    '\n\n',     // Paragraphs
    '\n',       // Line breaks
    '. ',       // Sentences
    ', ',       // Clauses
    ' ',        // Words
    ''          // Characters
  ];
  const separators = customSeparators || defaultSeparators;
  const recursiveSplit = (
    text: string, 
    separators: string[], 
    chunkSize: number,
    overlap: number
  ): string[] => {
    if (separators.length === 0 || 
        (chunkingMode === 'characters' && text.length <= chunkSize) ||
        (chunkingMode === 'tokens' && countTokens(text) <= chunkSize)) {
      return [text];
    }
    const separator = separators[0];
    const nextSeparators = separators.slice(1);
    const segments = text.split(separator).filter(s => s.trim().length > 0);
    if (segments.length > 1) {
      const isSmallEnough = segments.every(segment => 
        (chunkingMode === 'characters' && segment.length <= chunkSize) ||
        (chunkingMode === 'tokens' && countTokens(segment) <= chunkSize)
      );
      if (isSmallEnough) {
        return segments;
      }
    }
    if (segments.length <= 1 || !segments.every(segment => 
      (chunkingMode === 'characters' && segment.length <= chunkSize) ||
      (chunkingMode === 'tokens' && countTokens(segment) <= chunkSize)
    )) {
      const results: string[] = [];
      for (const segment of segments) {
        if ((chunkingMode === 'characters' && segment.length <= chunkSize) ||
            (chunkingMode === 'tokens' && countTokens(segment) <= chunkSize)) {
          results.push(segment);
        } else {
          const subSegments = recursiveSplit(segment, nextSeparators, chunkSize, overlap);
          results.push(...subSegments);
        }
      }
      return results;
    }
    return segments;
  };
  const mergeSmallChunks = (chunks: string[], targetSize: number): string[] => {
    if (chunks.length <= 1) return chunks;
    const result: string[] = [];
    let currentChunk = chunks[0];
    let currentSize = chunkingMode === 'characters' 
      ? currentChunk.length 
      : countTokens(currentChunk);
    for (let i = 1; i < chunks.length; i++) {
      const nextChunk = chunks[i];
      const nextSize = chunkingMode === 'characters' 
        ? nextChunk.length 
        : countTokens(nextChunk);
      if (currentSize + nextSize <= targetSize) {
        currentChunk += (currentChunk.endsWith('.') ? ' ' : '. ') + nextChunk;
        currentSize += nextSize;
      } else {
        result.push(currentChunk);
        currentChunk = nextChunk;
        currentSize = nextSize;
      }
    }
    if (currentChunk) {
      result.push(currentChunk);
    }
    return result;
  };
  const applyOverlap = (chunks: string[], overlapSize: number): string[] => {
    if (chunks.length <= 1 || overlapSize <= 0) return chunks;
    const result: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i];
      if (i > 0) {
        const prevChunk = chunks[i - 1];
        let overlapText = '';
        if (chunkingMode === 'characters') {
          if (prevChunk.length > overlapSize) {
            overlapText = prevChunk.substring(prevChunk.length - overlapSize);
          } else {
            overlapText = prevChunk;
          }
        } else {
          const prevTokens = tokenize(prevChunk);
          if (prevTokens.length > overlapSize) {
            overlapText = prevTokens.slice(-overlapSize).join(' ');
          } else {
            overlapText = prevChunk;
          }
        }
        chunk = overlapText + (overlapText.endsWith('.') ? ' ' : '. ') + chunk;
      }
      result.push(chunk);
    }
    return result;
  };
  try {
    let textChunks = recursiveSplit(text, separators, chunkSize, overlap);
    textChunks = mergeSmallChunks(textChunks, chunkSize);
    if (overlap > 0) {
      textChunks = applyOverlap(textChunks, overlap);
    }
    if (maxChunks > 0 && textChunks.length > maxChunks) {
      textChunks = textChunks.slice(0, maxChunks);
    }
    const chunks: Chunk[] = textChunks.map((chunkText, index) => ({
      id: index,
      text: chunkText,
      tokens: countTokens(chunkText),
      characters: chunkText.length
    }));
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
        notes: `Text was recursively split into ${chunks.length} chunks of approximately ${chunkSize} ${chunkingMode} each${overlap > 0 ? ` with ${overlap} ${chunkingMode} of overlap` : ''}, preserving natural text boundaries.`
      }
    };
  } catch (error) {
    console.error('Error in recursive text splitting:', error);
    return fixedLengthChunking(text, options);
  }
};