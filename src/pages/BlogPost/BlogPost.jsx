import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useEnglishTranslation } from '../../i18n/index';
import { LuTrendingUp, LuRadio, LuScanSearch, LuBot, LuArrowLeftRight, LuBrain, LuCpu } from 'react-icons/lu';
import { SiPython } from 'react-icons/si';
import siteConfig from '../../config/site';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '../../components/ui/MermaidDiagram';
import Panel from '../../components/ui/Panel';
import blogs from '../../data/blogs/index';
import './BlogPost.css';

const BLOG_ICON_MAP = {
  TrendingUp:     LuTrendingUp,
  Radio:          LuRadio,
  ScanSearch:     LuScanSearch,
  Bot:            LuBot,
  ArrowLeftRight: LuArrowLeftRight,
  Brain:          LuBrain,
  Python:         SiPython,
  Cpu:            LuCpu,
};

function BlogIcon({ iconKey }) {
  const Icon = BLOG_ICON_MAP[iconKey];
  return Icon ? <Icon size={48} aria-hidden="true" /> : null;
}

/*
 * A video with its play control in the middle of the frame rather than in the
 * browser's own bar at the bottom left. The native control is a 20px target in
 * a corner and readers miss it; a poster-sized button in the centre is the one
 * thing a video is asking to be clicked. Once it is playing, the overlay gets
 * out of the way and the native bar takes over for scrubbing.
 */
function BlogVideo({ src, alt }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);

  const start = () => {
    const v = ref.current;
    if (!v) return;
    if (!v.paused) { v.pause(); return; }
    // A browser may decline: a backgrounded tab pauses muted video to save
    // power and rejects with AbortError. Nothing to do, and an unhandled
    // rejection in the console is worse than none.
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };

  // A span, not a div: markdown wraps an image in a <p>, and a <div> inside a
  // <p> is invalid, so the browser closes the paragraph early and the frame is
  // torn away from its own overlay. CSS makes the span a block.
  return (
    <span className={`blog-video-frame${playing ? ' is-playing' : ''}`}>
      <video
        ref={ref}
        className="blog-video"
        src={src}
        controls
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt || 'Video'}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      {!playing && (
        <button
          type="button"
          className="blog-video-play"
          onClick={start}
          aria-label={alt ? `Play: ${alt}` : 'Play video'}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.2v13.6a1 1 0 0 0 1.53.85l10.6-6.8a1 1 0 0 0 0-1.7L9.53 4.35A1 1 0 0 0 8 5.2z" />
          </svg>
        </button>
      )}
    </span>
  );
}

// Custom markdown components — renders mermaid fenced blocks as diagrams
function mdComponents() {
  return {
    code({ inline, className, children, ...props }) {
      const lang = (className || '').replace('language-', '');
      if (!inline && lang === 'mermaid') {
        return <MermaidDiagram definition={String(children).trim()} />;
      }
      return (
        <code className={`blog-code${className ? ' ' + className : ''}`} {...props}>
          {children}
        </code>
      );
    },
    p({ children }) {
      return <p>{children}</p>;
    },
    pre({ children }) {
      // A mermaid fence renders as a diagram, not as code, so it must not keep
      // the code-block shell around it. That shell is a dark panel with its own
      // padding and border, which in light mode framed every diagram in a band
      // of #0d1117 and double-framed it in dark.
      const only = Array.isArray(children) ? children[0] : children;
      const cls = only?.props?.className;
      if (typeof cls === 'string' && cls.includes('language-mermaid')) return only;
      return <pre className="blog-pre">{children}</pre>;
    },
    h2({ children }) {
      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return <h2 id={id} className="blog-h2">{children}</h2>;
    },
    h3({ children }) {
      const id = String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return <h3 id={id} className="blog-h3">{children}</h3>;
    },
    blockquote({ children }) {
      return <blockquote className="blog-blockquote">{children}</blockquote>;
    },
    table({ children }) {
      return (
        <div className="blog-table-wrapper">
          <table className="blog-table">{children}</table>
        </div>
      );
    },
    a({ href, children }) {
      const external = href?.startsWith('http');
      return (
        <a
          href={href}
          className="blog-link"
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          aria-label={external ? `${children} (opens in new tab)` : undefined}
        >
          {children}
        </a>
      );
    },
    img({ src, alt }) {
      // A video written with image syntax renders as a video. Keeps posts in
      // plain markdown: ![caption](/videos/my-post.mp4) just works.
      if (/\.(mp4|webm)$/i.test(src || '')) {
        return <BlogVideo src={src} alt={alt} />;
      }
      // A diagram panel, written in markdown as an image so a post stays plain
      // markdown: ![caption](/diagrams/my-post-1.svg). It is inlined rather
      // than shown as an image; see Panel.jsx for why.
      if (/^\/diagrams\/.+\.svg$/i.test(src || '')) {
        return <Panel src={src} alt={alt} />;
      }
      return <img src={src} alt={alt || ''} className="blog-img" loading="lazy" />;
    },
  };
}

// Extract h2 headings from markdown for the table of contents
function extractToc(content) {
  const headings = [];
  const re = /^## (.+)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    headings.push({
      text: m[1],
      id:   m[1].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    });
  }
  return headings;
}

export default function BlogPost() {
  const { slug } = useParams();
  const { t }    = useEnglishTranslation();
  const blog     = useMemo(() => blogs.find(b => b.slug === slug), [slug]);

  // Scroll to top and set page title when post changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (blog) {
      document.title = `${blog.title} — Nishan Poojary`;
    }
  }, [slug, blog]);

  if (!blog) return <Navigate to="/blogs" replace />;

  const toc = extractToc(blog.content);

  // Siblings in the same series, ordered by part. Read order, not publish order.
  const siblings = blog.series
    ? blogs.filter(b => b.series === blog.series).sort((a, b) => (a.part ?? 0) - (b.part ?? 0))
    : [];
  const here = siblings.findIndex(b => b.slug === blog.slug);
  const prev = here > 0 ? siblings[here - 1] : null;
  const next = here >= 0 && here < siblings.length - 1 ? siblings[here + 1] : null;
  const first = siblings.length ? siblings[0] : null;
  const categoryLabel = t(`blogs.categoryLabels.${blog.category}`, blog.category);

  return (
    <div className="blogpost-page">
      {/* Back nav */}
      <Link to="/blogs" className="blogpost-back">
        {t('blogs.backToBlog')}
      </Link>

      {/* Article */}
      <article className="blogpost-article" aria-labelledby="post-title">
        {/* Header */}
        <header className="blogpost-header" style={{ '--post-accent': blog.color }}>
          <div className="blogpost-meta-top">
            <span className={`blogpost-category blogpost-category--${blog.category}`}>
              {categoryLabel}
            </span>
            <span className="blogpost-read">{blog.readTime} {t('blogs.readSuffix')}</span>
          </div>

          <span className="blogpost-emoji" aria-hidden="true"><BlogIcon iconKey={blog.iconKey} /></span>
          <h1 id="post-title" className="blogpost-title">{blog.title}</h1>
          <p className="blogpost-excerpt">{blog.excerpt}</p>

          <div className="blogpost-meta-row">
            <time className="blogpost-date" dateTime={blog.date}>{blog.date}</time>
            <span className="blogpost-author">{siteConfig.profile.firstName} {siteConfig.profile.lastName}</span>
          </div>

          <ul className="blogpost-tags" aria-label="Tags">
            {blog.tags.map(tag => (
              <li key={tag} className="blogpost-tag">{tag}</li>
            ))}
          </ul>

          {blog.githubUrl && (
            <a
              href={blog.githubUrl}
              className="blogpost-github-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('a11y.viewOnGitHub', { title: blog.title })}
            >
              View on GitHub →
            </a>
          )}
        </header>

        {/* Series bar. Placed before the body, above the table of contents,
            because a reader arriving from a search result needs to know they
            are mid-series before they start reading, not after. */}
        {blog.series && siblings.length > 1 && (
          <nav className="blogpost-series" aria-label={`${blog.series} series navigation`}>
            <div className="blogpost-series-head">
              <span className="blogpost-series-name">{blog.series}</span>
              <span className="blogpost-series-part">
                Part {blog.part} of {siblings.length}
              </span>
              {blog.part !== 1 && first && (
                <Link to={`/blogs/${first.slug}`} className="blogpost-series-start">
                  Start at part 1
                </Link>
              )}
            </div>
            <ol className="blogpost-series-list">
              {siblings.map(b => (
                <li
                  key={b.slug}
                  className={b.slug === blog.slug ? 'is-current' : undefined}
                  aria-current={b.slug === blog.slug ? 'true' : undefined}
                >
                  {b.slug === blog.slug ? (
                    <span>{b.part}. {b.title}</span>
                  ) : (
                    <Link to={`/blogs/${b.slug}`}>{b.part}. {b.title}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="blogpost-body">
          {/* Table of contents */}
          {toc.length > 2 && (
            <nav className="blogpost-toc" aria-label={t('a11y.tocNav')}>
              <p className="blogpost-toc-title" id="toc-heading">{t('blogs.tableOfContents')}</p>
              <ol className="blogpost-toc-list" aria-labelledby="toc-heading">
                {toc.map(h => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="blogpost-toc-link">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* Markdown content */}
          <div className="blogpost-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={mdComponents()}
            >
              {blog.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Where to go next in the series. */}

        {blog.series && (prev || next) && (

          <nav className="blogpost-series-nav" aria-label="Series pager">

            {prev ? (

              <Link to={`/blogs/${prev.slug}`} className="blogpost-series-prev">

                <span>Previous</span>

                <strong>{prev.part}. {prev.title}</strong>

              </Link>

            ) : <span />}

            {next && (

              <Link to={`/blogs/${next.slug}`} className="blogpost-series-next">

                <span>Next</span>

                <strong>{next.part}. {next.title}</strong>

              </Link>

            )}

          </nav>

        )}


        {/* References */}
        {blog.references && blog.references.length > 0 && (
          <section className="blogpost-references" aria-labelledby="references-heading">
            <h2 id="references-heading" className="blogpost-references-title">
              {t('blogs.references')}
            </h2>
            <ol className="blogpost-references-list">
              {blog.references.map((ref, i) => (
                <li key={i} className="blogpost-reference-item">
                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="blog-link"
                      aria-label={`${ref.text || ref.label} (${t('a11y.externalLink')})`}
                    >
                      {ref.text || ref.label}
                    </a>
                  ) : (
                    ref.text || ref.label
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </article>

      {/* Related posts */}
      <RelatedPosts current={blog} />
    </div>
  );
}

function RelatedPosts({ current }) {
  const { t } = useEnglishTranslation();

  const related = blogs
    .filter(b => b.slug !== current.slug && (
      b.category === current.category ||
      b.tags.some(tag => current.tags.includes(tag))
    ))
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <section className="blogpost-related" aria-labelledby="related-heading">
      <h2 id="related-heading" className="blogpost-related-title">
        {t('blogs.relatedPosts')}
      </h2>
      <div className="blogpost-related-grid">
        {related.map(b => (
          <Link
            key={b.slug}
            to={`/blogs/${b.slug}`}
            className="related-card"
            aria-label={t('a11y.readMore', { title: b.title })}
          >
            <span className="related-card-emoji" aria-hidden="true">{b.emoji}</span>
            <div>
              <div className="related-card-title">{b.title}</div>
              <div className="related-card-meta">
                {b.readTime} {t('blogs.readSuffix')} · <time dateTime={b.date}>{b.date}</time>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
