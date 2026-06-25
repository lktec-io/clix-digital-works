import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import '../styles/testimonials.css';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Amina Rashidi',
    role: 'Executive Director',
    org: 'Mbeya Community Church',
    avatar: 'AR',
    color: '#39FF14',
    rating: 5,
    metric: '70% admin time saved',
    text: 'Clix Digital Works transformed how we manage our 3,000+ member congregation. The church management system handles tithes, event scheduling, and SMS broadcasts in one place. Our staff were up and running within a week.',
  },
  {
    id: 2,
    name: 'Joseph Mwanga',
    role: 'Finance Manager',
    org: 'Mbeya Highlands SACCO',
    avatar: 'JM',
    color: '#00E5FF',
    rating: 5,
    metric: 'Loan approvals: days → minutes',
    text: 'The SACCO management system is exceptional. Loan processing that used to take three working days now takes under ten minutes. Regulatory reports that once required a full week are generated at the click of a button.',
  },
  {
    id: 3,
    name: 'Dr. Fatuma Kileo',
    role: 'Medical Director',
    org: 'Highlands Medical Centre',
    avatar: 'FK',
    color: '#39FF14',
    rating: 5,
    metric: '100% paperless records',
    text: 'Before Clix, our patient files were spread across six paper ledgers. Now every record, appointment, and billing entry is digital and searchable instantly. The system paid for itself in the first three months.',
  },
  {
    id: 4,
    name: 'Bernard Njau',
    role: 'CEO',
    org: 'Tanzanite Trading Co.',
    avatar: 'BN',
    color: '#00E5FF',
    rating: 5,
    metric: '40% drop in inventory losses',
    text: 'The custom ERP gave us real-time visibility across procurement, production, and sales for the first time. Inventory losses fell by 40% in Q1 alone. The ROI exceeded our expectations and the team was professional throughout.',
  },
  {
    id: 5,
    name: 'Grace Mhango',
    role: 'Headmistress',
    org: 'Mbeya International School',
    avatar: 'GM',
    color: '#39FF14',
    rating: 5,
    metric: 'Fee collection up 35%',
    text: 'The school management system changed everything. Parents check results online, fees are collected via M-Pesa and tracked automatically, and our admin team has halved the time they spend on paperwork. We\'ve already referred four other schools.',
  },
  {
    id: 6,
    name: 'Peter Kishimba',
    role: 'Program Director',
    org: 'Tanzania Relief Foundation',
    avatar: 'PK',
    color: '#00E5FF',
    rating: 5,
    metric: 'Donor reporting automated',
    text: 'Clix built us a donor management platform that professionalized our reporting overnight. Our international donors are impressed by the real-time impact dashboards. Securing our last funding round was significantly easier because of this system.',
  },
];

function StarRating({ rating }) {
  return (
    <div className="star-rating" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? 'star star-filled' : 'star'}>★</span>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const autoRef = useRef(null);

  const goTo = (index, dir = 1) => {
    setDirection(dir);
    setCurrent((index + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const next = () => goTo(current + 1, 1);
  const prev = () => goTo(current - 1, -1);

  useEffect(() => {
    autoRef.current = setInterval(next, 5000);
    return () => clearInterval(autoRef.current);
  }, [current]);

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <section className="section testimonials-section" id="testimonials">
      <div className="testimonials-bg" aria-hidden="true" />

      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Client Reviews</span>
          <h2 className="section-title">
            What Our <span>Clients Say</span>
          </h2>
          <p className="section-subtitle">
            Don't take our word for it — hear from the organizations we've transformed.
          </p>
        </motion.div>

        <div className="testimonials-carousel">
          <div className="testimonials-main">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                className="testimonial-card glass-card"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
              >
                <div className="testimonial-quote">"</div>
                {TESTIMONIALS[current].metric && (
                  <div className="testimonial-metric" style={{ '--tc': TESTIMONIALS[current].color }}>
                    <span className="testimonial-metric-dot" aria-hidden="true" />
                    {TESTIMONIALS[current].metric}
                  </div>
                )}
                <p className="testimonial-text">{TESTIMONIALS[current].text}</p>

                <div className="testimonial-footer">
                  <div
                    className="testimonial-avatar"
                    style={{ '--tc': TESTIMONIALS[current].color }}
                    aria-hidden="true"
                  >
                    {TESTIMONIALS[current].avatar}
                  </div>
                  <div className="testimonial-author">
                    <div className="testimonial-name">{TESTIMONIALS[current].name}</div>
                    <div className="testimonial-role">
                      {TESTIMONIALS[current].role} · {TESTIMONIALS[current].org}
                    </div>
                    <StarRating rating={TESTIMONIALS[current].rating} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side cards preview */}
          <div className="testimonials-side">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={t.id}
                className={`side-card ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                aria-label={`View testimonial from ${t.name}`}
                style={{ '--tc': t.color }}
              >
                <div className="side-avatar">{t.avatar}</div>
                <div className="side-info">
                  <div className="side-name">{t.name}</div>
                  <div className="side-org">{t.org}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="testimonials-controls">
          <button className="control-btn" onClick={prev} aria-label="Previous testimonial">
            <FiChevronLeft size={20} />
          </button>

          <div className="testimonial-dots">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`t-dot ${i === current ? 'active' : ''}`}
                onClick={() => goTo(i, i > current ? 1 : -1)}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>

          <button className="control-btn" onClick={next} aria-label="Next testimonial">
            <FiChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
