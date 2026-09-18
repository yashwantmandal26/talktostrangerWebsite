'use client';

import { useState } from 'react';
import { Sparkles, Dices, Send, X, Flame } from 'lucide-react';
import { ICEBREAKER_CATEGORIES, getRandomIcebreaker } from '../data/icebreakers';

export default function IcebreakerModal({ isOpen, onClose, onSendIcebreaker }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPrompt, setCurrentPrompt] = useState(() => getRandomIcebreaker('all'));

  if (!isOpen) return null;

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPrompt(getRandomIcebreaker(catId));
  };

  const handleShuffle = () => {
    setCurrentPrompt(getRandomIcebreaker(selectedCategory));
  };

  const handleSend = () => {
    onSendIcebreaker(currentPrompt.text);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-dark-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-dark-50">Break The Ice</h3>
              <p className="text-xs text-dark-400">Funny debates & Indian conversation starters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ICEBREAKER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-primary-500 text-dark-900 font-bold shadow-md shadow-primary-500/20'
                  : 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Active Prompt Card */}
        <div className="p-5 rounded-2xl bg-dark-950/90 border border-dark-800/90 mb-5 relative group">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-400 px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-2 inline-block">
            {currentPrompt.tag}
          </span>
          <p className="text-sm sm:text-base font-semibold text-dark-100 leading-relaxed mt-1">
            "{currentPrompt.text}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleShuffle}
            className="flex-1 py-3 px-4 rounded-xl bg-dark-800 border border-dark-700 text-dark-200 font-semibold hover:bg-dark-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            <Dices className="w-4 h-4 text-primary-400" />
            Roll Another
          </button>
          <button
            onClick={handleSend}
            className="flex-1 py-3 px-4 rounded-xl bg-primary-500 text-dark-900 font-bold hover:bg-primary-400 active:bg-primary-600 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
          >
            <Send className="w-4 h-4" />
            Send to Chat
          </button>
        </div>
      </div>
    </div>
  );
}
