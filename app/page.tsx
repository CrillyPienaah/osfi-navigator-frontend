'use client';

import { useState } from 'react';
import { Search, Shield, ChevronDown, Loader2, CheckCircle, AlertCircle, ExternalLink, BookOpen } from 'lucide-react';

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

const DOMAIN_COLORS: Record<string, string> = {
  osfi_e23: 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30',
  b20: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30',
  fintrac: 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30',
  ifrs9: 'bg-violet-500/20 text-violet-300 border-violet-500/40 hover:bg-violet-500/30',
  basel3: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30',
  pipeda: 'bg-pink-500/20 text-pink-300 border-pink-500/40 hover:bg-pink-500/30',
  casl: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40 hover:bg-yellow-500/30',
  general: 'bg-gray-500/20 text-gray-300 border-gray-500/40 hover:bg-gray-500/30',
};

const DOMAIN_URLS: Record<string, string> = {
  'OSFI Guideline E-23': 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/guideline-e-23-model-risk-management-2027',
  'OSFI Guideline B-20': 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/b-20-residential-mortgage-underwriting-practices-procedures',
  'FINTRAC / PCMLTFA': 'https://www.fintrac-canafe.gc.ca/guidance-directives/overview-apercu/Guide1/1-eng',
  'IFRS 9 ECL': 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/ifrs-9-financial-instruments-disclosures',
  'Basel III / OSFI CAR': 'https://www.osfi-bsif.gc.ca/en/guidance/guidance-library/capital-adequacy-requirements-car-guideline-2026',
  'PIPEDA / Quebec Law 25': 'https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/',
  'CASL': 'https://www.fightspam.gc.ca/eic/site/030.nsf/eng/home',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

interface Source {
  title: string;
  section: string;
  excerpt: string;
  relevance: number;
}

interface Result {
  answer: string;
  sources: Source[];
  model_used: string;
  grounded: boolean;
  confidence: number;
}

// Parse answer text and inject citation chips inline
function AnswerWithCitations({ answer, sources }: { answer: string; sources: Source[] }) {
  const [activeChip, setActiveChip] = useState<number | null>(null);

  if (!sources || sources.length === 0) {
    return <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{answer}</p>;
  }

  // Split answer into sentences and inject citation chips after regulatory references
  const sentences = answer.split(/(?<=[.!?])\s+/);
  
  // Keywords that indicate a regulatory citation
  const citationKeywords = [
    'E-23', 'B-20', 'FINTRAC', 'PCMLTFA', 'IFRS 9', 'Basel III', 
    'PIPEDA', 'Law 25', 'CASL', 'OSFI', 'CAR', 'LCR', 'NSFR',
    'Section', 'section', 'guideline', 'Guideline', 'requirement', 'requires'
  ];

  const hasCitationKeyword = (text: string) =>
    citationKeywords.some(kw => text.includes(kw));

  // Map sources to citation chips
  const getChipForSentence = (sentence: string): number | null => {
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      if (
        sentence.includes(src.title.split(' ').slice(-1)[0]) ||
        sentence.includes(src.section.split(' ').slice(-1)[0]) ||
        (hasCitationKeyword(sentence) && i === 0)
      ) {
        return i;
      }
    }
    return hasCitationKeyword(sentence) ? 0 : null;
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-200 leading-relaxed">
        {sentences.map((sentence, idx) => {
          const chipIdx = getChipForSentence(sentence);
          const src = chipIdx !== null ? sources[chipIdx] : null;
          const chipColor = src ? (DOMAIN_COLORS[
            src.title.toLowerCase().includes('e-23') ? 'osfi_e23' :
            src.title.toLowerCase().includes('b-20') ? 'b20' :
            src.title.toLowerCase().includes('fintrac') ? 'fintrac' :
            src.title.toLowerCase().includes('ifrs') ? 'ifrs9' :
            src.title.toLowerCase().includes('basel') ? 'basel3' :
            src.title.toLowerCase().includes('pipeda') || src.title.toLowerCase().includes('law 25') ? 'pipeda' :
            src.title.toLowerCase().includes('casl') ? 'casl' : 'general'
          ] || DOMAIN_COLORS.general) : '';

          return (
            <span key={idx}>
              {sentence}{' '}
              {src && (
                <button
                  onClick={() => setActiveChip(activeChip === chipIdx ? null : chipIdx)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono border cursor-pointer transition-all mx-0.5 ${chipColor}`}
                  title={`${src.title} — ${src.section}`}
                >
                  <BookOpen size={10} />
                  {src.title.split(' ').slice(-2).join(' ')} § {src.section.split(' ').slice(0, 3).join(' ')}
                </button>
              )}
            </span>
          );
        })}
      </p>

      {/* Expanded chip detail */}
      {activeChip !== null && sources[activeChip] && (
        <div className={`rounded-xl border p-4 transition-all ${DOMAIN_COLORS[
          sources[activeChip].title.toLowerCase().includes('e-23') ? 'osfi_e23' :
          sources[activeChip].title.toLowerCase().includes('b-20') ? 'b20' :
          sources[activeChip].title.toLowerCase().includes('fintrac') ? 'fintrac' :
          sources[activeChip].title.toLowerCase().includes('ifrs') ? 'ifrs9' :
          sources[activeChip].title.toLowerCase().includes('basel') ? 'basel3' :
          sources[activeChip].title.toLowerCase().includes('pipeda') ? 'pipeda' :
          sources[activeChip].title.toLowerCase().includes('casl') ? 'casl' : 'general'
        ]}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="font-semibold text-white text-sm">{sources[activeChip].title}</p>
              <p className="text-xs opacity-80 mt-0.5">{sources[activeChip].section}</p>
            </div>
            {DOMAIN_URLS[sources[activeChip].title] && (
              <a
                href={DOMAIN_URLS[sources[activeChip].title]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs opacity-70 hover:opacity-100 whitespace-nowrap"
              >
                Primary source <ExternalLink size={10} />
              </a>
            )}
          </div>
          <p className="text-xs opacity-70 leading-relaxed">{sources[activeChip].excerpt}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState('');
  const [domain, setDomain] = useState('all');
  const [model, setModel] = useState('gpt-4o-mini');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
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
      setError(e instanceof Error ? e.message : 'Failed to connect to API');
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
          <a
            href="https://huggingface.co/datasets/CrillyPienaah/CanFinBench"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            Powered by CanFinBench <ExternalLink size={12} />
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Query Panel */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ask a Regulatory Question</h2>
            <p className="text-gray-400 text-sm">
              Grounded answers with inline citations from OSFI E-23, FINTRAC, B-20, IFRS 9, Basel III, PIPEDA, and CASL.
            </p>
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
                  className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                    model === m.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
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
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
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
            {loading
              ? <><Loader2 size={20} className="animate-spin" /> Searching regulations...</>
              : <><Search size={20} /> Search Regulations</>
            }
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
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Regulatory Answer</h2>
            {result && (
              <span className="text-xs text-gray-500 bg-gray-900 px-3 py-1 rounded-full border border-gray-800">
                Click citation chips to expand sources
              </span>
            )}
          </div>

          {!result && !loading && !error && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Shield className="text-gray-600 mx-auto mb-4" size={48} />
              <p className="text-gray-500 mb-2">Ask a question to get a grounded answer.</p>
              <p className="text-gray-600 text-sm">Answers include inline citation chips linking to primary regulatory sources.</p>
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
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  result.grounded
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                }`}>
                  <CheckCircle size={14} />
                  {result.grounded ? 'Grounded Answer' : 'Low Confidence'}
                </div>
                <span className="text-xs text-gray-500">
                  Confidence: {Math.round(result.confidence * 100)}% · {result.model_used}
                </span>
              </div>

              {/* Answer with inline citation chips */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BookOpen size={14} />
                  Answer with Citations
                </h3>
                <AnswerWithCitations answer={result.answer} sources={result.sources} />
              </div>

              {/* Full Sources Panel */}
              {result.sources?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                    All Regulatory Sources ({result.sources.length})
                  </h3>
                  {result.sources.map((src, i) => {
                    const domainKey =
                      src.title.toLowerCase().includes('e-23') ? 'osfi_e23' :
                      src.title.toLowerCase().includes('b-20') ? 'b20' :
                      src.title.toLowerCase().includes('fintrac') ? 'fintrac' :
                      src.title.toLowerCase().includes('ifrs') ? 'ifrs9' :
                      src.title.toLowerCase().includes('basel') ? 'basel3' :
                      src.title.toLowerCase().includes('pipeda') || src.title.toLowerCase().includes('law 25') ? 'pipeda' :
                      src.title.toLowerCase().includes('casl') ? 'casl' : 'general';

                    return (
                      <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-white text-sm">{src.title}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs border font-mono ${DOMAIN_COLORS[domainKey]}`}>
                                § {src.section.split(' ').slice(0, 4).join(' ')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{src.section}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded shrink-0">
                              {Math.round(src.relevance * 100)}% match
                            </span>
                            {DOMAIN_URLS[src.title] && (
                              <a
                                href={DOMAIN_URLS[src.title]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-white transition-colors"
                                title="View primary source"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">{src.excerpt}</p>
                      </div>
                    );
                  })}
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
