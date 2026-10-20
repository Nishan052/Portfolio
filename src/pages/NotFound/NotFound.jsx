import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

// The page for any address the site does not define. The host serves public/404.html
// for these on a direct visit (with a real 404 status), and this is the same page for
// the times the app is already loaded: a mistyped link, or a post that was removed.
export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found — Nishan Poojary';
  }, []);

  return (
    <main className="notfound-page">
      <h1>Page not found</h1>
      <p>There is nothing at this address.</p>
      <Link to="/" className="notfound-home">Back to the home page</Link>
    </main>
  );
}
