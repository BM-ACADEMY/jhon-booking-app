import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Loader2 } from 'lucide-react';
import api from '../api';

const TermsPage = () => {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data && res.data.termsAndConditions) {
          setTerms(res.data.termsAndConditions);
        }
      } catch (err) {
        console.error('Failed to fetch terms:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="bg-stone-50 font-sans text-stone-800 min-h-screen animate-in fade-in duration-500">
      {/* Hero Header */}
      <section className="relative py-20 bg-gradient-to-b from-gray-900 to-stone-900 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 mt-12 flex flex-col items-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-3">
            Terms & Conditions
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm tracking-wider max-w-xl font-light uppercase">
            Please read these terms carefully before booking your stay
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-6 sm:p-10 md:p-16">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-stone-600" />
              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Loading terms...</p>
            </div>
          ) : terms ? (
            <div 
              className="prose prose-stone max-w-none text-stone-700 leading-relaxed text-sm sm:text-base ql-editor-display"
              dangerouslySetInnerHTML={{ __html: terms }}
            />
          ) : (
            <div className="text-center py-20 text-stone-400 italic">
              Terms & Conditions have not been published yet. Please check back later.
            </div>
          )}
        </div>
      </section>

      {/* Custom styles to handle basic HTML styling from editor */}
      <style>{`
        .ql-editor-display h1 { font-size: 2em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #1c1917; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
        .ql-editor-display h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #1c1917; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
        .ql-editor-display h3 { font-size: 1.25em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #1c1917; }
        .ql-editor-display p { margin-bottom: 1em; }
        .ql-editor-display ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .ql-editor-display ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; }
        .ql-editor-display li { margin-bottom: 0.5em; }
        .ql-editor-display blockquote { border-left: 4px solid #e7e5e4; padding-left: 1em; color: #57534e; font-style: italic; margin-bottom: 1em; }
        .ql-editor-display a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default TermsPage;
