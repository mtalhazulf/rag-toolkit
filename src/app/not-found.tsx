import { Metadata } from 'next';
import Link from 'next/link';

export const runtime = "edge";

export const metadata: Metadata = {
  title: 'Page Not Found - 404 Error | Text Chunking & RAG System',
  description: 'The page you are looking for could not be found. Please check the URL or navigate back to the homepage.',
  robots: 'noindex, nofollow',
};

export default function NotFound() {
  return (
    <>
      <div style={styles.error}>
        <div>
          <style
            dangerouslySetInnerHTML={{
              __html: `body{color:#000;background:#fff;margin:0}.next-error-h1{border-right:1px solid rgba(0,0,0,.3)}@media (prefers-color-scheme:dark){body{color:#fff;background:#000}.next-error-h1{border-right:1px solid rgba(255,255,255,.3)}}`,
            }}
          />
          <h1 className="next-error-h1" style={styles.h1}>
            404
          </h1>
          <div style={styles.desc}>
            <h2 style={styles.h2}>This page could not be found.</h2>
            <p style={styles.p}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link href="/" style={styles.link}>
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  error: {
    fontFamily:
      'system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji"',
    height: "100vh",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  desc: {
    display: "inline-block",
  },
  h1: {
    display: "inline-block",
    margin: "0 20px 0 0",
    padding: "0 23px 0 0",
    fontSize: 24,
    fontWeight: 500,
    verticalAlign: "top",
    lineHeight: "49px",
  },
  h2: {
    fontSize: 14,
    fontWeight: 400,
    lineHeight: "49px",
    margin: 0,
  },
  p: {
    margin: "10px 0",
    fontSize: 14,
    lineHeight: "20px",
  },
  link: {
    display: "inline-block",
    margin: "20px 0",
    padding: "10px 15px",
    backgroundColor: "#0070f3",
    color: "#fff",
    textDecoration: "none",
    borderRadius: "5px",
    fontSize: 14,
  },
} as const;
