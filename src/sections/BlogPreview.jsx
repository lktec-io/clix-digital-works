import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiClock, FiTag, FiGlobe, FiTrendingUp, FiCpu, FiShield } from 'react-icons/fi';
import '../styles/blog.css';

const POSTS = [
  {
    id: 1,
    Icon: FiGlobe,
    category: 'Digital Business',
    title: 'Why Every Business Needs a Professional Website in 2025',
    excerpt: 'In today\'s digital-first world, your website is your most powerful marketing tool. Discover why businesses without websites are losing customers daily.',
    readTime: '5 min read',
    date: 'June 2025',
    color: '#39FF14',
    featured: true,
  },
  {
    id: 2,
    Icon: FiTrendingUp,
    category: 'Finance & Software',
    title: 'The Real Benefits of Accounting Software for SMEs',
    excerpt: 'Manual bookkeeping is costing your business more than you think. Learn how automated accounting software transforms financial management.',
    readTime: '6 min read',
    date: 'May 2025',
    color: '#00E5FF',
  },
  {
    id: 3,
    Icon: FiCpu,
    category: 'Artificial Intelligence',
    title: 'AI for Modern Businesses: Where to Start',
    excerpt: 'Artificial intelligence is no longer reserved for tech giants. Here\'s how small and medium businesses can leverage AI to automate, optimize, and grow.',
    readTime: '8 min read',
    date: 'May 2025',
    color: '#39FF14',
  },
  {
    id: 4,
    Icon: FiShield,
    category: 'Cybersecurity',
    title: 'Cybersecurity Tips Every SME Must Know in 2025',
    excerpt: 'Cybercriminals are increasingly targeting small businesses. These actionable security tips will protect your business data and your reputation.',
    readTime: '7 min read',
    date: 'April 2025',
    color: '#00E5FF',
  },
];

export default function BlogPreview() {
  const [featured, ...rest] = POSTS;

  return (
    <section className="section blog-section" id="blog">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Knowledge Hub</span>
          <h2 className="section-title">
            Latest from Our <span>Blog</span>
          </h2>
          <p className="section-subtitle">
            Insights, tips, and guides on technology, business software, and digital transformation.
          </p>
        </motion.div>

        <div className="blog-layout">
          {/* Featured post */}
          <motion.article
            className="blog-featured glass-card"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -6 }}
            style={{ '--post-color': featured.color }}
          >
            <div className="blog-featured-img">
              <span className="blog-emoji" aria-hidden="true"><featured.Icon size={40} /></span>
              <span className="blog-category-badge" style={{ color: featured.color, borderColor: featured.color }}>
                {featured.category}
              </span>
            </div>
            <div className="blog-card-body">
              <div className="blog-meta">
                <span><FiClock size={12} /> {featured.readTime}</span>
                <span>{featured.date}</span>
              </div>
              <h3 className="blog-title featured-title">{featured.title}</h3>
              <p className="blog-excerpt">{featured.excerpt}</p>
              <Link to="/blog" className="blog-read-link">
                Read Article <FiArrowRight size={16} />
              </Link>
            </div>
          </motion.article>

          {/* Rest posts */}
          <div className="blog-list">
            {rest.map((post, i) => (
              <motion.article
                key={post.id}
                className="blog-card glass-card"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ x: 6 }}
                style={{ '--post-color': post.color }}
              >
                <div className="blog-card-left">
                  <span className="blog-card-emoji" aria-hidden="true"><post.Icon size={22} /></span>
                </div>
                <div className="blog-card-content">
                  <div className="blog-meta small">
                    <span style={{ color: post.color }}><FiTag size={11} /> {post.category}</span>
                    <span><FiClock size={11} /> {post.readTime}</span>
                  </div>
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">{post.excerpt}</p>
                  <Link to="/blog" className="blog-read-link small">
                    Read More <FiArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          className="blog-cta"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Link to="/blog" className="btn btn-outline">
            View All Articles <FiArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
