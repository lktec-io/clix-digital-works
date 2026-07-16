import { motion } from 'framer-motion';
import BlogPreview from '../sections/BlogPreview';
import Contact from '../sections/Contact';
import '../styles/pages.css';
import SEO from '../components/SEO';
import { buildBreadcrumbs } from '../utils/seo';

const PAGE_SCHEMA = [
  buildBreadcrumbs([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]),
  {
    '@context': 'https://schema.org',
    '@type':    'Blog',
    name:       'Clix Digital Works Blog',
    description: 'Expert articles on technology, software development, cybersecurity, AI, and digital transformation for businesses and organizations across Tanzania.',
    url:        'https://clixworks.co.tz/blog',
    publisher: {
      '@type': 'Organization',
      name:    'Clix Digital Works',
      url:     'https://clixworks.co.tz',
    },
    blogPost: [
      {
        '@type':     'BlogPosting',
        headline:    'Why Every Business Needs a Professional Website in 2025',
        datePublished: '2025-06-01',
        author:      { '@type': 'Organization', name: 'Clix Digital Works' },
        url:         'https://clixworks.co.tz/blog',
        articleSection: 'Digital Business',
      },
      {
        '@type':     'BlogPosting',
        headline:    'The Real Benefits of Accounting Software for SMEs',
        datePublished: '2025-05-15',
        author:      { '@type': 'Organization', name: 'Clix Digital Works' },
        url:         'https://clixworks.co.tz/blog',
        articleSection: 'Finance & Software',
      },
      {
        '@type':     'BlogPosting',
        headline:    'AI for Modern Businesses: Where to Start',
        datePublished: '2025-05-01',
        author:      { '@type': 'Organization', name: 'Clix Digital Works' },
        url:         'https://clixworks.co.tz/blog',
        articleSection: 'Artificial Intelligence',
      },
      {
        '@type':     'BlogPosting',
        headline:    'Cybersecurity Tips Every SME Must Know in 2025',
        datePublished: '2025-04-20',
        author:      { '@type': 'Organization', name: 'Clix Digital Works' },
        url:         'https://clixworks.co.tz/blog',
        articleSection: 'Cybersecurity',
      },
    ],
  },
];

export default function BlogPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Tech Insights &amp; Digital Guides"
        description="Expert articles on technology, software development, cybersecurity, AI, and digital transformation for businesses and organizations across Tanzania. Stay ahead with Clix Digital Works."
        canonical="/blog"
        schema={PAGE_SCHEMA}
      />

      <div className="page-hero">
        <div className="page-hero-bg" />
        <div className="container">
          <motion.div
            className="page-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">Knowledge Hub</span>
            <h1 className="page-hero-title">
              Insights &amp; <span className="gradient-text">Digital Guides</span>
            </h1>
            <p className="page-hero-subtitle">
              Expert articles on technology, software, cybersecurity, and digital transformation for modern organizations.
            </p>
          </motion.div>
        </div>
      </div>

      <BlogPreview />
      <Contact />
    </motion.main>
  );
}
