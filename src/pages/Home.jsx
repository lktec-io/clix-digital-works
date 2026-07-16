import { motion } from 'framer-motion';
import Hero from '../sections/Hero';
import Services from '../sections/Services';
import Solutions from '../sections/Solutions';
import WhyChooseUs from '../sections/WhyChooseUs';
import TechStack from '../sections/TechStack';
import Portfolio from '../sections/Portfolio';
import Process from '../sections/Process';
import Testimonials from '../sections/Testimonials';
import BlogPreview from '../sections/BlogPreview';
import Contact from '../sections/Contact';
import SEO from '../components/SEO';
import { buildBreadcrumbs } from '../utils/seo';

const BREADCRUMB_SCHEMA = buildBreadcrumbs([
  { name: 'Home', path: '/' },
]);

export default function Home() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SEO
        title="Software &amp; App Development, Tanzania"
        description="Tanzania's leading software engineering company. We build custom software, websites, mobile apps, AI systems, ERP platforms, and cybersecurity solutions for organizations across Tanzania and East Africa."
        canonical="/"
        schema={BREADCRUMB_SCHEMA}
      />
      <Hero />
      <Services />
      <Solutions />
      <WhyChooseUs />
      <TechStack />
      <Portfolio />
      <Process />
      <Testimonials />
      <BlogPreview />
      <Contact />
    </motion.main>
  );
}
