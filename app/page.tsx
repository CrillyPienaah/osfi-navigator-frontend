'use client';

import { useState } from 'react';
import { Search, Shield, ChevronDown, Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

const DOMAINS = [
  { id: 'all', label: 'All Domains' },
  { id: 'osfi_e23', label: 'OSFI E-23 — Model Risk' },
  { id: 'b20', label: 'OSFI B-20 — Mortgages' },
  { id: 'fintrac', label: 'FINTRAC — AML/KYC' },
  { id: 'ifrs9', label: 'IFRS 9 — Credit Loss' },
  { id: 'basel3', label: 'Basel III — Capital' },
  { id: 'pipeda', label: 'PIPEDA / Law 25 — Privacy' },
  { id: 'casl', label: 'CASL — Anti-Spam' },
];

const SAMPLE_QUESTIONS = [
  'What is the minimum qualifying rate for an uninsured mortgage?',
  'When does OSFI E-23 take effect and who does it apply to?',
  'What are the five data properties required under E-23?',
  'What triggers a Suspicious Transaction Report under FINTRAC?',
  'What is the D-SIB CET1 minimum capital requirement?',
  'What are Quebec Law 25 obligations for automated decisions?',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function Home() {
  const [question, setQuestion] = useState('');
  const [domain, setDomain] = useState('all');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleQuery = async (q = question) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, model, domain }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-400" size={28} />
            <div>
              <h1 className="text-xl font-bold">OSFI Navigator</h1>
              <p className="text-xs text-gray-400">Canadian Financial Regulatory AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://huggingface.co/datasets/CrillyPienaah/CanFinBench" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
              Powered by CanFinBench <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Query Panel */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ask a Regulatory Question</h2>
            <p className="text-gray-400 text-sm">Grounded answers from OSFI E-23, FINTRAC, B-20, IFRS 9, Basel III, PIPEDA, and CASL.</p>
          </div>

          {/* Domain Filter */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Regulatory Domain</label>
            <div className="relative">
              <select
                value={domain}
                onChange={e => setDomain(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* Model Toggle */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Model</label>
            <div className="flex gap-3">
              {[
                { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast · Cheap' },
                { id: 'gpt-4o', label: 'GPT-4o', desc: 'Best quality' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${model === m.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-gray-700 text-gray-400 hover:border-gray-600'}`}
                >
                  <div>{m.label}</div>
                  <div className="text-xs opacity-60 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Input */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Your Question</label>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuery(); } }}
              placeholder="e.g. What are the model validation requirements under OSFI E-23?"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Searching regulations...</> : <><Search size={20} /> Search Regulations</>}
          </button>

          {/* Sample Questions */}
          <div>
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider font-medium">Try these questions</p>
            <div className="space-y-2">
              {SAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setQuestion(q); handleQuery(q); }}
                  className="w-full text-left text-sm text-gray-400 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-lg px-4 py-2.5 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Answer Panel */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Regulatory Answer</h2>

          {!result && !loading && !error && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Shield className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-500">Ask a question to get a grounded answer with regulatory citations.</p>
            </div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Loader2 className="text-emerald-400 mx-auto mb-4 animate-spin" size={48} />
              <p className="text-gray-400">Searching {DOMAINS.find(d => d.id === domain)?.label}...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 flex gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-red-400 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Confidence Badge */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${result.grounded ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'}`}>
                  <CheckCircle size={14} />
                  {result.grounded ? 'Grounded Answer' : 'Low Confidence'}
                </div>
                <span className="text-xs text-gray-500">Confidence: {Math.round(result.confidence * 100)}% · {result.model_used}</span>
              </div>

              {/* Answer */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-4">Answer</h3>
                <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{result.answer}</p>
              </div>

              {/* Sources */}
              {result.sources?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Regulatory Sources</h3>
                  {result.sources.map((src, i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-white text-sm">{src.title}</p>
                          <p className="text-xs text-emerald-400 mt-0.5">{src.section}</p>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded shrink-0">{Math.round(src.relevance * 100)}% match</span>
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{src.excerpt}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-gray-500">
          <p>OSFI Navigator · Built by Christopher Crilly Pienaah</p>
          <p>For informational purposes only. Always consult primary regulatory sources.</p>
        </div>
      </footer>
    </div>
  );
}
