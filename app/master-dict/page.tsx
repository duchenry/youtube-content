'use client';

import { useState, useMemo } from 'react';
import dictData from '@/app/lib/master-dict.json';

interface Mapping {
  boring_term: string;
  killer_term: string;
}

interface PhrasePattern {
  boring_phrase: string;
  killer_phrase: string;
}

interface Category {
  id: string;
  focus: string;
  mapping: Mapping[];
  phrase_patterns: PhrasePattern[];
}

interface DictData {
  metadata: {
    version: string;
    target_audience: string;
    tone: string;
    logic_framework: string;
  };
  database: Category[];
  structural_rules: string[];
}

export default function MasterDictPage() {
  const [activeCategory, setActiveCategory] = useState('CAT_1_THE_DIAGNOSIS');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'mapping' | 'phrases'>('all');

  const data = dictData as DictData;
  
  const currentCategory = data.database.find((cat) => cat.id === activeCategory);

  const filteredMapping = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchTerm) return currentCategory.mapping;
    
    const term = searchTerm.toLowerCase();
    return currentCategory.mapping.filter(
      (m) => m.boring_term.toLowerCase().includes(term) || m.killer_term.toLowerCase().includes(term)
    );
  }, [currentCategory, searchTerm]);

  const filteredPhrases = useMemo(() => {
    if (!currentCategory) return [];
    if (!searchTerm) return currentCategory.phrase_patterns;
    
    const term = searchTerm.toLowerCase();
    return currentCategory.phrase_patterns.filter(
      (p) =>
        p.boring_phrase.toLowerCase().includes(term) ||
        p.killer_phrase.toLowerCase().includes(term)
    );
  }, [currentCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#111]/95 backdrop-blur border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-orange-400">Master</span> Dictionary
          </h1>
          <p className="text-gray-400">{data.metadata.target_audience}</p>
          <p className="text-sm text-gray-500 mt-2">Tone: {data.metadata.tone}</p>
          <p className="text-xs text-gray-600 mt-1">v{data.metadata.version}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Categories */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-[#1a1a1a] rounded-lg border border-orange-500/20 p-4 sticky top-24">
              <h2 className="text-lg font-bold text-orange-400 mb-4">Categories</h2>
              <div className="space-y-2">
                {data.database.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setSearchTerm('');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border-l-2 transition-all ${
                      activeCategory === cat.id
                        ? 'bg-orange-500/20 border-orange-400 text-orange-200'
                        : 'border-transparent hover:bg-[#222] text-gray-300 hover:text-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium">{cat.id}</div>
                    <div className="text-xs text-gray-400 mt-1">{cat.focus}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {currentCategory && (
              <>
                {/* Category Header */}
                <div className="bg-[#1a1a1a] rounded-lg border border-orange-500/30 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-orange-400 mb-2">{currentCategory.focus}</h2>
                      <p className="text-gray-400 text-sm">{currentCategory.id}</p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>{currentCategory.mapping.length} terms</p>
                      <p>{currentCategory.phrase_patterns.length} patterns</p>
                    </div>
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-[#1a1a1a] rounded-lg border border-orange-500/20 p-4 space-y-4">
                  <input
                    type="text"
                    placeholder="Search boring or killer terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#111] border border-gray-700 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-orange-400 transition-colors"
                  />
                  <div className="flex gap-2">
                    {(['all', 'mapping', 'phrases'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setSearchType(type)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          searchType === type
                            ? 'bg-orange-500 text-white'
                            : 'bg-[#222] text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {type === 'all' ? 'All' : type === 'mapping' ? 'Mapping' : 'Phrases'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mapping Section */}
                {(searchType === 'all' || searchType === 'mapping') && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-orange-300">Killer Transformations</h3>
                    {filteredMapping.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredMapping.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-[#1a1a1a] border border-gray-700 hover:border-orange-400/50 rounded-lg p-4 transition-all hover:bg-[#222]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-2">Boring</p>
                                <p className="text-gray-300 font-medium mb-3">{item.boring_term}</p>
                                <p className="text-xs text-orange-500 font-bold uppercase mb-2">Killer Term</p>
                                <p className="text-orange-300 font-semibold leading-relaxed">{item.killer_term}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-6">No mapping matches found.</p>
                    )}
                  </div>
                )}

                {/* Phrase Patterns Section */}
                {(searchType === 'all' || searchType === 'phrases') && (
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-orange-300">Phrase Patterns</h3>
                    {filteredPhrases.length > 0 ? (
                      <div className="space-y-3">
                        {filteredPhrases.map((phrase, idx) => (
                          <div
                            key={idx}
                            className="bg-[#1a1a1a] border border-gray-700 hover:border-orange-400/50 rounded-lg p-5 transition-all hover:bg-[#222]"
                          >
                            {/* Boring Phrase */}
                            <div className="mb-4 pb-4 border-b border-gray-800">
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                                Boring Version
                              </p>
                              <p className="text-gray-300 italic">{phrase.boring_phrase}</p>
                            </div>

                            {/* Killer Phrase */}
                            <div>
                              <p className="text-xs font-bold text-orange-500 uppercase tracking-wide mb-1">
                                Killer Version
                              </p>
                              <p className="text-orange-200 font-semibold leading-relaxed">{phrase.killer_phrase}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-6">No phrase patterns match found.</p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Structural Rules Footer */}
      <div className="border-t border-gray-800 bg-[#0a0a0a] mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h3 className="text-lg font-bold text-orange-400 mb-4">Structural Rules</h3>
          <ul className="space-y-2 text-gray-400">
            {data.structural_rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-orange-400 font-bold mt-1">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
