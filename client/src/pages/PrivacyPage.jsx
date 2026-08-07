import React, { useState, useEffect } from 'react';
import { Shield, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const PrivacyPage = () => {
  const [privacy, setPrivacy] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.privacyPolicy) {
          setPrivacy(res.data.privacyPolicy);
        }
      } catch (err) {
        console.error('Failed to fetch privacy policy:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="bg-white min-h-screen font-sans text-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 md:pt-28 md:pb-10">
        {/* Breadcrumb & Header */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-3 flex items-center gap-2">
            <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-900">Privacy Policy</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Privacy Policy
          </h1>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 border-t border-gray-100">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <p className="text-sm text-gray-500">Loading privacy policy...</p>
          </div>
        ) : privacy ? (
          <div 
            className="prose prose-gray max-w-none text-gray-700 leading-relaxed ql-editor-display border-t border-gray-100 pt-4"
            dangerouslySetInnerHTML={{ __html: privacy }}
          />
        ) : (
          <div className="text-center py-10 text-gray-500 italic border-t border-gray-100">
            Privacy Policy has not been published yet. Please check back later.
          </div>
        )}
      </div>

      {/* Custom styles to handle basic HTML styling from editor */}
      <style>{`
        .ql-editor-display h1, .ql-editor-display h2, .ql-editor-display h3 { 
          color: #111827; 
          font-weight: 600; 
          margin-top: 1.5em; 
          margin-bottom: 0.5em; 
        }
        .ql-editor-display h1 { font-size: 1.875rem; }
        .ql-editor-display h2 { font-size: 1.5rem; }
        .ql-editor-display h3 { font-size: 1.25rem; }
        .ql-editor-display p { margin-top: 0; margin-bottom: 1em; line-height: 1.75; }
        .ql-editor-display ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .ql-editor-display ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .ql-editor-display li { margin-bottom: 0.25em; }
        .ql-editor-display blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; color: #4b5563; font-style: italic; margin-bottom: 1em; }
        .ql-editor-display a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default PrivacyPage;
