import { useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LuTrendingUp, LuRadio, LuScanSearch, LuBot, LuArrowLeftRight, LuBrain } from 'react-icons/lu';
import { SiPython } from 'react-icons/si';
import siteConfig from '../../config/site';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MermaidDiagram from '../../components/ui/MermaidDiagram';
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
};

function BlogIcon({ iconKey }) {
  const Icon = BLOG_ICON_MAP[iconKey];
  return Icon ? <Icon size={48} aria-hidden="true" /> : null;
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
    pre({ children }) {
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
  const { t }    = useTranslation();
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
  const { t } = useTranslation();

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
