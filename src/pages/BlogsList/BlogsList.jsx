import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import blogs from '../../data/blogs/index';
import './BlogsList.css';

const CATEGORIES = ['all', 'project', 'research', 'news'];

export default function BlogsList() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch]                 = useState('');

  // Update document title
  useEffect(() => {
    document.title = `${t('blogs.pageTitle')} — Nishan Poojary`;
  }, [t]);

  const filtered = useMemo(() => {
    return blogs.filter(b => {
      const matchCat = activeCategory === 'all' || b.category === activeCategory;
      const q        = search.toLowerCase();
      const matchQ   = !q ||
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.tags.some(tag => tag.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [activeCategory, search]);

  const filterLabels = {
    all:      t('blogs.filter.all'),
    project:  t('blogs.filter.project'),
    research: t('blogs.filter.research'),
    news:     t('blogs.filter.news'),
  };

  return (
    <div className="blogs-page">
      {/* Header */}
      <header className="blogs-hero">
        <Link to="/" className="blogs-back-link">
          {t('blogs.backToPortfolio')}
        </Link>
        <h1 className="blogs-title">
          <span className="blogs-title-accent">{t('blogs.pageTitle')}</span>
        </h1>
        <p className="blogs-subtitle">{t('blogs.pageSubtitle')}</p>
      </header>

      {/* Controls */}
      <div className="blogs-controls">
        {/* Category filter */}
        <div
          className="blogs-filter-row"
          role="group"
          aria-label={t('a11y.filterPosts')}
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              className={`blogs-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
            >
              {filterLabels[cat]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div role="search">
          <label htmlFor="blog-search" className="sr-only">
            {t('a11y.searchPosts')}
          </label>
          <input
            id="blog-search"
            className="blogs-search"
            type="search"
            placeholder={t('blogs.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('a11y.searchPosts')}
          />
        </div>
      </div>

      {/* Live results region */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {filtered.length === 0
          ? t('blogs.empty')
          : t('blogs.resultCount', { count: filtered.length })}
      </div>

      {/* List */}
      <div className="blogs-list" role="list">
        {filtered.length === 0 ? (
          <p className="blogs-empty" role="status">{t('blogs.empty')}</p>
        ) : (
          filtered.map(blog => (
            <BlogCard key={blog.slug} blog={blog} />
          ))
        )}
      </div>
    </div>
  );
}

function BlogCard({ blog }) {
  const { t } = useTranslation();
  const categoryLabel = t(`blogs.categoryLabels.${blog.category}`, blog.category);
  const filterLabels  = {
    project:  t('blogs.filter.project'),
    research: t('blogs.filter.research'),
    news:     t('blogs.filter.news'),
  };

  return (
    <article role="listitem" className="blog-card-wrapper" style={{ '--card-accent': blog.color }}>
      <Link
        to={`/blogs/${blog.slug}`}
        className="blog-card"
        aria-label={t('a11y.readMore', { title: blog.title })}
      >
        {/* Emoji column */}
        <div className="blog-card-emoji-col" aria-hidden="true">{blog.emoji}</div>

        {/* Content */}
        <div className="blog-card-content">
          <div className="blog-card-meta-top">
            <span className={`blog-card-category blog-card-category--${blog.category}`}>
              {filterLabels[blog.category] || categoryLabel}
            </span>
            <span className="blog-card-date">
              <time dateTime={blog.date}>{blog.date}</time>
            </span>
            <span className="blog-card-read">{blog.readTime} {t('blogs.readSuffix')}</span>
          </div>

          <h2 className="blog-card-title">{blog.title}</h2>
          <p className="blog-card-excerpt">{blog.excerpt}</p>

          <div className="blog-card-bottom">
            <ul className="blog-card-tags" aria-label="Tags">
              {blog.tags.slice(0, 4).map(tag => (
                <li key={tag} className="blog-card-tag">{tag}</li>
              ))}
            </ul>
            <span className="blog-card-cta" aria-hidden="true">{t('blogs.readPost')}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
