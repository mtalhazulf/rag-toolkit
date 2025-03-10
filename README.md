# RAG Toolkit

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2.1-black)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![Vercel](https://img.shields.io/badge/Vercel-ready-black)

A powerful, flexible text chunking and Retrieval-Augmented Generation (RAG) system built with Next.js and deployed on Vercel. This application provides multiple text chunking strategies and a complete RAG pipeline for semantic search and retrieval.

## 🚀 Features

- **Multiple Chunking Methods**:
  - Fixed-length (tokens or characters)
  - Recursive text splitting
  - Sentence-based
  - Paragraph-based
  - Sliding window
  - Semantic chunking
  - Hybrid approaches
  - Agentic chunking

- **Complete RAG Pipeline**:
  - Text chunking
  - Embedding generation
  - Vector similarity search
  - Query processing

- **User-Friendly Interface**:
  - Interactive chunk visualization
  - Real-time analysis
  - JSON export
  - Sample text integration

- **Advanced Features**:
  - Customizable chunk size and overlap
  - Token counting
  - Performance metrics
  - Embedding visualization

- **Optimized for Performance**:
  - Fast processing
  - Responsive UI
  - Edge-optimized deployment

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (recommended for faster development)

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rag-toolkit.git
   cd rag-toolkit
   ```

2. Install dependencies:
   ```bash
   # Using npm
   npm install
   
   # Using Bun (recommended)
   bun install
   ```

3. Set up environment variables (optional):
   Create a `.env.local` file in the root directory with your API keys if needed:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

## 💻 Development

Run the development server:

```bash
# Using npm
npm run dev

# Using Bun (recommended)
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 🏗️ Building for Production

Build the application for production:

```bash
# Using npm
npm run build

# Using Bun
bun run build
```

## ☁️ Vercel Deployment

This project is optimized for Vercel deployment:

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Configure your deployment settings
4. Deploy!

You can also use the Vercel CLI for deployment:

```bash
# Install Vercel CLI if you haven't already
npm install -g vercel

# Deploy to Vercel
vercel
```

## 📊 Usage Examples

### Basic Text Chunking

1. Enter or paste your text in the input area
2. Select a chunking method (e.g., "Fixed Length")
3. Configure chunking options (chunk size, overlap)
4. Click "Process Text"
5. View and analyze the resulting chunks

### RAG Pipeline

1. Process your text using any chunking method
2. Click "Finalize Chunks" to prepare for RAG
3. Enter your OpenAI API key (for embeddings)
4. Click "Generate Embeddings"
5. Enter a query in the search box
6. View semantically similar chunks

## 🧩 Project Structure

```
├── public/             # Static assets
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── components/     # React components
│   │   │   ├── chunking/   # Chunking UI components
│   │   │   ├── rag/        # RAG interface components
│   │   │   └── ui/         # Shared UI components
│   │   └── lib/            # Core functionality
│   │       └── chunking.ts # Text chunking algorithms
│   └── types/              # TypeScript type definitions
└── next.config.ts      # Next.js configuration
```

## 🔍 SEO Implementation

This project includes comprehensive SEO features:

- Metadata configuration using Next.js App Router
- OpenGraph and Twitter card metadata
- JSON-LD structured data
- Dynamic OG image generation
- Sitemap generation
- Robots.txt configuration

See [SEO.md](SEO.md) for implementation details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React Framework
- [Vercel](https://vercel.com/) - Edge hosting platform
- [OpenAI](https://openai.com/) - For embeddings API
- [Tailwind CSS](https://tailwindcss.com/) - For styling
- Big Help from [brandonstarxel](https://github.com/brandonstarxel/chunking_evaluation.git)
