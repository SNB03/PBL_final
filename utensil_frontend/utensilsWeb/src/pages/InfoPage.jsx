// src/pages/InfoPage.jsx
import React, { useEffect } from 'react';
import Navbar from '../components/layout/Navbar';

const InfoPage = ({ title, lastUpdated, sections }) => {
  // Always scroll to top when opening a new policy page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '60px' }}>
      <Navbar />
      
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#0f172a', margin: '0 0 10px 0' }}>{title}</h1>
          {lastUpdated && <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Last Updated: {lastUpdated}</p>}
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          {sections.map((section, index) => (
            <div key={index} style={{ marginBottom: index === sections.length - 1 ? '0' : '30px' }}>
              <h2 style={{ fontSize: '1.3rem', color: '#0f172a', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '15px' }}>
                {section.heading}
              </h2>
              {/* If the content is an array, render paragraphs. Otherwise render text. */}
              {Array.isArray(section.content) ? (
                section.content.map((paragraph, pIdx) => (
                  <p key={pIdx} style={{ color: '#475569', lineHeight: '1.7', marginBottom: '10px' }}>{paragraph}</p>
                ))
              ) : (
                <p style={{ color: '#475569', lineHeight: '1.7' }}>{section.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPage;