import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get title from query params
    const title = searchParams.get('title') || 'Text Chunking & RAG System';
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            padding: '40px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0070f3',
              borderRadius: '10px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              width: '90%',
              height: '80%',
            }}
          >
            <h1
              style={{
                fontSize: '60px',
                fontWeight: 'bold',
                color: '#0070f3',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '30px',
                color: '#333',
                textAlign: 'center',
                margin: '0',
              }}
            >
              A powerful tool for text chunking and retrieval-augmented generation
            </p>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}