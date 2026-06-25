import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiFileText } from 'react-icons/fi';
import COMPANY from '../config/company';
import '../styles/legal.css';

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing and using the Clix Digital Works website or engaging our services, you confirm that you have read, understood, and agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you must not use our website or services.`,
  },
  {
    title: 'Services Description',
    content: `Clix Digital Works provides software engineering and digital transformation services including, but not limited to:`,
    list: [
      'Custom software development',
      'Website and mobile application development',
      'AI and machine learning solutions',
      'ERP and accounting systems',
      'Cybersecurity solutions',
      'Cloud and VPS hosting',
      'IT training and consultation',
      'Technical support and maintenance',
    ],
    after: `Specific service terms, deliverables, timelines, and pricing are defined in individual project agreements or service contracts signed between Clix Digital Works and the client.`,
  },
  {
    title: 'Project Agreements',
    content: `All project work is governed by a separate written agreement or Statement of Work (SOW) that includes:`,
    list: [
      'Scope of work and deliverables',
      'Project timeline and milestones',
      'Payment schedule and terms',
      'Intellectual property ownership',
      'Confidentiality obligations',
      'Change request procedures',
    ],
    after: `In the event of any conflict between these Terms of Service and a project-specific agreement, the project agreement shall take precedence.`,
  },
  {
    title: 'Payment Terms',
    content: `Unless otherwise specified in a project agreement:`,
    list: [
      'A deposit of 50% of the agreed project cost is required before work commences',
      'Remaining balances are due upon project completion and before final delivery',
      'Maintenance and support retainers are billed monthly in advance',
      'Late payments may attract a penalty fee as specified in the project agreement',
      'All prices are quoted in Tanzanian Shillings (TZS) unless otherwise agreed',
    ],
  },
  {
    title: 'Intellectual Property',
    content: `Upon receipt of full and final payment:`,
    list: [
      'The client receives full ownership of all custom deliverables created specifically for their project',
      'Clix Digital Works retains ownership of pre-existing tools, frameworks, libraries, and methodologies used in the project',
      'Open-source components remain subject to their respective licenses',
      'Clix Digital Works reserves the right to display completed work in our portfolio unless the client requests confidentiality in writing',
    ],
  },
  {
    title: 'Confidentiality',
    content: `Both parties agree to keep confidential any proprietary information shared during the course of the project. Clix Digital Works will not disclose client business information, data, or trade secrets to third parties without explicit written consent.`,
  },
  {
    title: 'Limitation of Liability',
    content: `To the fullest extent permitted by applicable law:`,
    list: [
      'Clix Digital Works shall not be liable for any indirect, incidental, special, or consequential damages',
      'Our total liability for any claim arising out of or relating to our services shall not exceed the total amount paid by the client for the specific service in dispute',
      'We are not liable for damages resulting from third-party services, hosting outages, or client-provided content',
    ],
  },
  {
    title: 'Client Responsibilities',
    content: `To ensure successful project delivery, clients are responsible for:`,
    list: [
      'Providing accurate and complete project requirements',
      'Supplying necessary content, assets, and access credentials on time',
      'Reviewing and approving deliverables within agreed review periods',
      'Ensuring all content provided does not infringe third-party rights',
      'Making timely payments as agreed',
    ],
  },
  {
    title: 'Warranty',
    content: `Clix Digital Works warrants that:`,
    list: [
      'Services will be performed in a professional and workmanlike manner',
      'Delivered software will function as specified in the project agreement',
      'A warranty period (as specified in the project agreement) covers bug fixes arising from our development work',
      'Warranty does not cover issues caused by client modifications, third-party integrations, or hosting environment changes',
    ],
  },
  {
    title: 'Termination',
    content: `Either party may terminate a project agreement with written notice. Upon termination:`,
    list: [
      'The client is liable for payment for all work completed up to the termination date',
      'Clix Digital Works will deliver all completed work to the client',
      'Both parties will return or destroy confidential information as requested',
    ],
  },
  {
    title: 'Governing Law',
    content: `These Terms of Service shall be governed by and construed in accordance with the laws of the United Republic of Tanzania. Any disputes shall be resolved through good-faith negotiation, and if necessary, through the courts of Tanzania.`,
  },
  {
    title: 'Changes to Terms',
    content: `We reserve the right to modify these Terms of Service at any time. Changes will be effective upon posting to our website. Your continued use of our services after changes are posted constitutes your acceptance of the revised terms.`,
  },
];

export default function TermsPage() {
  return (
    <motion.main
      className="legal-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="container">
        <motion.div
          className="legal-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-label">
            <FiFileText size={12} /> Legal
          </span>
          <h1>Terms of Service</h1>
          <p className="legal-meta">Last Updated: June 2025 · Clix Digital Works, Mbeya, Tanzania</p>
        </motion.div>

        <motion.div
          className="legal-body"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="legal-section">
            <p>
              These Terms of Service govern your use of the Clix Digital Works website and the
              engagement of our professional services. Please read these terms carefully before
              using our website or entering into a service agreement with us.
            </p>
          </div>

          {SECTIONS.map((sec, i) => (
            <motion.div
              key={sec.title}
              className="legal-section"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <h2>{sec.title}</h2>
              {sec.content && <p>{sec.content}</p>}
              {sec.list && (
                <ul>
                  {sec.list.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
              {sec.after && <p>{sec.after}</p>}
            </motion.div>
          ))}

          <div className="legal-contact-box">
            <h2 style={{ fontSize: 'var(--fs-lg)' }}>Questions About These Terms?</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us before
              engaging our services:
            </p>
            <p>
              <strong style={{ color: 'var(--text-primary)' }}>{COMPANY.name}</strong><br />
              {COMPANY.address.full}<br />
              Email: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </p>
            <p>
              <Link to="/contact" style={{ color: 'var(--accent)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                Get in touch →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </motion.main>
  );
}
