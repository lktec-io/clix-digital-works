import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import WhyChooseUs from '../sections/WhyChooseUs';
import TechStack from '../sections/TechStack';
import Process from '../sections/Process';
import Testimonials from '../sections/Testimonials';
import Contact from '../sections/Contact';
import { FiArrowRight, FiTarget, FiEye, FiHeart } from 'react-icons/fi';
import '../styles/pages.css';
import '../styles/about.css';

const TEAM = [
  {
    name: 'Leonard Nkosi',
    role: 'Founder & CEO',
    bio: 'Full-stack engineer and visionary behind Clix Digital Works. Passionate about leveraging technology to solve real African business problems.',
    emoji: '👨‍💻',
    color: '#39FF14',
    skills: ['React', 'Node.js', 'System Design'],
  },
  {
    name: 'Amina Juma',
    role: 'Lead Backend Engineer',
    bio: 'Experienced in building scalable APIs, database architecture, and cloud infrastructure that power enterprise-grade applications.',
    emoji: '⚙️',
    color: '#00E5FF',
    skills: ['Node.js', 'MySQL', 'DevOps'],
  },
  {
    name: 'Baraka Mwenda',
    role: 'UI/UX & Frontend Lead',
    bio: 'Crafts pixel-perfect, accessible interfaces with a keen eye for design systems, user psychology, and modern web aesthetics.',
    emoji: '🎨',
    color: '#39FF14',
    skills: ['React', 'Figma', 'CSS Architecture'],
  },
  {
    name: 'Fatuma Rashid',
    role: 'Mobile App Engineer',
    bio: 'Specialises in cross-platform mobile applications delivering native-quality experiences for Android and iOS users.',
    emoji: '📱',
    color: '#00E5FF',
    skills: ['React Native', 'Flutter', 'API Integration'],
  },
  {
    name: 'David Mwangi',
    role: 'AI & Data Engineer',
    bio: 'Builds machine learning pipelines, predictive models, and intelligent automation tools that give our clients a competitive edge.',
    emoji: '🤖',
    color: '#39FF14',
    skills: ['Python', 'TensorFlow', 'Data Analysis'],
  },
  {
    name: 'Grace Luhanga',
    role: 'Project Manager & QA Lead',
    bio: 'Ensures every project is delivered on time, within scope, and exceeds quality standards through rigorous testing and clear communication.',
    emoji: '📋',
    color: '#00E5FF',
    skills: ['Agile', 'QA Testing', 'Client Relations'],
  },
];

const VALUES = [
  { icon: FiTarget, title: 'Excellence', desc: 'We set and maintain the highest standards in everything we build.' },
  { icon: FiHeart, title: 'Client Success', desc: 'Your growth is our success. We measure ourselves by your outcomes.' },
  { icon: FiEye, title: 'Transparency', desc: 'We communicate openly about timelines, costs, and challenges.' },
];

export default function AboutPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="page-hero">
        <div className="page-hero-bg" />
        <div className="container">
          <motion.div
            className="page-hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-label">About Clix Digital Works</span>
            <h1 className="page-hero-title">
              Building Tanzania's <span className="gradient-text">Digital Future</span>
            </h1>
            <p className="page-hero-subtitle">
              We are a passionate team of engineers, designers, and digital innovators committed to helping organizations across Tanzania harness the power of technology.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Story Section */}
      <section className="section">
        <div className="container">
          <div className="about-story-grid">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="section-label">Our Story</span>
              <h2 className="section-title" style={{ textAlign: 'left' }}>
                From Mbeya to the<br /><span>Digital World</span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-lg)' }}>
                Clix Digital Works was founded with a clear mission: to bring world-class software engineering to organizations in Tanzania that deserve better digital tools — schools, hospitals, churches, businesses, and government institutions.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 'var(--space-xl)' }}>
                Based in Mbeya — the gateway city of Southern Tanzania — we understand the unique challenges and opportunities of our local market. We combine global software engineering standards with deep local knowledge to deliver solutions that actually work for our clients.
              </p>
              <Link to="/contact" className="btn btn-primary">
                Work With Us <FiArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              className="about-values"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {VALUES.map((v, i) => (
                <motion.div
                  key={v.title}
                  className="value-card glass-card"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="value-icon">
                    <v.icon size={20} />
                  </div>
                  <div>
                    <h3 className="value-title">{v.title}</h3>
                    <p className="value-desc">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-label">The Team</span>
            <h2 className="section-title">The People <span>Behind the Code</span></h2>
            <p className="section-subtitle">Passionate engineers and designers dedicated to your success.</p>
          </motion.div>

          <div className="team-grid">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                className="team-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                style={{ '--tm-color': member.color }}
              >
                <div className="team-avatar">{member.emoji}</div>
                <h3 className="team-name">{member.name}</h3>
                <p className="team-role" style={{ color: member.color }}>{member.role}</p>
                <p className="team-bio">{member.bio}</p>
                <div className="team-skills">
                  {member.skills.map(s => (
                    <span key={s} className="team-skill">{s}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WhyChooseUs />
      <TechStack />
      <Process />
      <Testimonials />
      <Contact />
    </motion.main>
  );
}
