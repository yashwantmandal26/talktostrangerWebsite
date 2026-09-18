'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import {
  Send,
  Search,
  MessageSquare,
  Users,
  AlertCircle,
  Shield,
  Loader2,
  Flag,
  SkipForward,
  Volume2,
  VolumeX,
  Gamepad2,
  Sparkles,
  Smile,
  Plus,
  X,
  Flame,
  Heart,
  ThumbsUp,
  ChevronDown,
  CheckCircle2,
  Lock,
  Zap,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { sound } from '../utils/sound';
import GameHub from './games/GameHub';
import IcebreakerModal from './IcebreakerModal';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Talk to Strangers India';

const PRESET_INTERESTS = [
  { id: 'cricket', label: '🏏 Cricket & IPL' },
  { id: 'bollywood', label: '🎬 Bollywood & OTT' },
  { id: 'gaming', label: '🎮 Gaming & BGMI' },
  { id: 'tech', label: '💻 Tech & AI' },
  { id: 'music', label: '🎵 Music & Songs' },
  { id: 'latenight', label: '☕ Late Night Talks' },
  { id: 'food', label: '🍕 Foodies & Chai' },
  { id: 'college', label: '📚 College & Exams' },
];

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '👏', '🇮🇳', '🤝', '👍'];
const QUICK_PHRASES = [
  'Haha sahi hai! 😂',
  'Arey waah! 🔥',
  'Sach me? 🤯',
  'Badiya bhai! 🤝',
  'GG! 🎮',
];

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [state, setState] = useState('IDLE'); // 'IDLE' | 'SEARCHING' | 'CONNECTED' | 'DISCONNECTED'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [hasAcceptedAgeGate, setHasAcceptedAgeGate] = useState(false);
  const [showAgeGateModal, setShowAgeGateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Interest tags
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [commonInterests, setCommonInterests] = useState([]);

  // Games & Icebreakers state
  const [isGameHubOpen, setIsGameHubOpen] = useState(false);
  const [incomingGameInvite, setIncomingGameInvite] = useState(null);
  const [isIcebreakerOpen, setIsIcebreakerOpen] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Sync initial sound mute state & age verification
  useEffect(() => {
    setIsMuted(sound.isMuted());
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem('talktostrangers_age_verified') === 'true') {
          setHasAcceptedAgeGate(true);
        }
      } catch (e) {}
    }
  }, []);

  const toggleSound = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('[socket] connected', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[socket] connect_error', err.message);
    });

    newSocket.on('online_count', ({ count }) => setOnlineCount(count));

    newSocket.on('searching', () => {
      setState('SEARCHING');
      setCommonInterests([]);
    });

    newSocket.on('chat_started', ({ system, commonInterests: common = [] }) => {
      setState('CONNECTED');
      setCommonInterests(common);
      setMessages([{ id: crypto.randomUUID(), text: system, from: 'system', at: Date.now() }]);
      sound.playMatch();
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    newSocket.on('message', ({ text, from, type = 'text', at }) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text, from, type, at }]);
      if (from === 'stranger') {
        sound.playReceived();
      }
    });

    newSocket.on('typing', ({ isTyping }) => setTyping(isTyping));

    newSocket.on('stranger_disconnected', ({ reason }) => {
      const reasonText =
        reason === 'skip' ? 'Stranger skipped to a new chat.' :
        reason === 'disconnect' ? 'Stranger has left the chat.' :
        reason === 'reported' ? 'Chat ended due to a report.' :
        'Stranger has left the chat.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: reasonText, from: 'system', at: Date.now() }]);
      setState('DISCONNECTED');
      setTyping(false);
      setIncomingGameInvite(null);
      setIsGameHubOpen(false);
      sound.playDisconnect();
    });

    // In-chat game invites
    newSocket.on('game_invite', ({ gameType, hostId }) => {
      setIncomingGameInvite({ gameType, hostId });
      sound.playGameInvite();
    });

    newSocket.on('message_blocked', ({ reason }) => {
      const reasonText =
        reason === 'rate_limit' ? "Slow down! You're sending messages too fast." :
        reason === 'spam_repeat' ? 'Please avoid sending the same message repeatedly.' :
        reason === 'contact_info_blocked' ? 'Phone numbers, social links, and handles are not allowed for your safety.' :
        reason === 'profanity_blocked' ? 'Message contains blocked content. Keep it respectful.' :
        reason === 'too_long' ? 'Message too long (max 500 characters).' :
        'Message could not be sent.';
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: reasonText, from: 'system', at: Date.now() }]);
    });

    newSocket.on('blocked', ({ reason }) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text: reason, from: 'system', at: Date.now() }]);
      setState('IDLE');
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const findStranger = useCallback((interests = selectedInterests) => {
    if (!socket) return;
    setMessages([]);
    setState('SEARCHING');
    setIncomingGameInvite(null);
    socket.emit('find_stranger', { interests });
  }, [socket, selectedInterests]);

  const sendMessage = useCallback((overrideText, type = 'text') => {
    const content = (overrideText !== undefined ? overrideText : input).trim();
    if (!socket || !content || state !== 'CONNECTED') return;

    if (overrideText === undefined) {
      setInput('');
    }
    socket.emit('send_message', { text: content, type });
    socket.emit('typing', { isTyping: false });
    sound.playSent();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
  }, [socket, input, state]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value.slice(0, 500);
    setInput(value);
    if (!socket || state !== 'CONNECTED') return;
    socket.emit('typing', { isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { isTyping: false });
    }, 2000);
  }, [socket, state]);

  const skipChat = useCallback(() => {
    if (!socket) return;
    if (state === 'CONNECTED') {
      socket.emit('skip_chat');
    }
    setMessages([]);
    setState('IDLE');
    setTyping(false);
    setIncomingGameInvite(null);
    setIsGameHubOpen(false);
  }, [socket, state]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      if (state === 'CONNECTED' || state === 'SEARCHING') {
        skipChat();
      }
    }
    // Shortcuts: Alt+G for games, Alt+I for icebreakers
    if (e.altKey && e.key.toLowerCase() === 'g') {
      e.preventDefault();
      if (state === 'CONNECTED') setIsGameHubOpen((prev) => !prev);
    }
    if (e.altKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      if (state === 'CONNECTED') setIsIcebreakerOpen((prev) => !prev);
    }
  }, [sendMessage, state, skipChat]);

  const handleReport = useCallback(() => {
    if (!socket) return;
    socket.emit('report_partner', { reason: reportReason });
    setShowReportModal(false);
    setReportReason('');
  }, [socket, reportReason]);

  const handleStartChat = useCallback(() => {
    if (!hasAcceptedAgeGate) {
      setShowAgeGateModal(true);
      return;
    }
    findStranger(selectedInterests);
  }, [hasAcceptedAgeGate, findStranger, selectedInterests]);

  const acceptAgeGate = useCallback(() => {
    setHasAcceptedAgeGate(true);
    setShowAgeGateModal(false);
    try {
      localStorage.setItem('talktostrangers_age_verified', 'true');
    } catch (e) {}
    findStranger(selectedInterests);
  }, [findStranger, selectedInterests]);

  const handleSendIcebreaker = (promptText) => {
    sendMessage(promptText, 'icebreaker');
  };

  const handleSendReaction = (emoji) => {
    sendMessage(emoji, 'reaction');
    setShowReactionsBar(false);
  };

  const handleToggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className={`flex flex-col h-[100dvh] ${state === 'IDLE' ? 'max-w-4xl' : 'max-w-2xl'} mx-auto bg-dark-900 dark:bg-dark-950 border-x border-dark-800 relative`}>
      {/* Header */}
      <header className="flex items-center justify-between px-3.5 sm:px-4 py-3 border-b border-dark-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary-500/10 text-primary-400">
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-dark-50 tracking-tight flex items-center gap-1.5">
              <span>{APP_NAME}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 font-semibold uppercase">
                India
              </span>
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Online count */}
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 text-dark-300 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
            <span>{onlineCount.toLocaleString()} online</span>
          </span>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-primary-400" />}
          </button>

          {/* Connected Actions: Games & Icebreaker */}
          {state === 'CONNECTED' && (
            <>
              <button
                onClick={() => setIsIcebreakerOpen(true)}
                className="p-2 rounded-xl text-amber-400 hover:text-amber-300 hover:bg-dark-800 transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title="Break The Ice (Alt+I)"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Icebreaker</span>
              </button>

              <button
                onClick={() => setIsGameHubOpen(true)}
                className="relative p-2 rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
                title="Play Games (Alt+G)"
              >
                <Gamepad2 className="w-4 h-4" />
                <span className="hidden sm:inline">Games</span>
                {incomingGameInvite && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            </>
          )}

          {/* Skip / New Chat */}
          <button
            onClick={skipChat}
            disabled={state === 'IDLE'}
            className="p-2 rounded-xl text-dark-400 hover:text-dark-100 hover:bg-dark-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="New chat / Skip"
            title="New Chat (Esc)"
          >
            <SkipForward className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Shared Interests Banner (if matched with interests) */}
      {state === 'CONNECTED' && commonInterests.length > 0 && (
        <div className="px-4 py-2 bg-primary-500/10 border-b border-primary-500/20 flex items-center justify-center gap-2 text-xs text-primary-300 animate-fade-in">
          <span>✨</span>
          <span className="font-semibold">Shared Interests:</span>
          <div className="flex gap-1">
            {commonInterests.map((interest) => (
              <span key={interest} className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-200 font-medium capitalize">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chat Window */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin" role="log" aria-live="polite" aria-label="Chat messages">
        {state === 'IDLE' && (
          <LandingView
            onStart={handleStartChat}
            appName={APP_NAME}
            onlineCount={onlineCount}
            selectedInterests={selectedInterests}
            onToggleInterest={handleToggleInterest}
          />
        )}
        {state === 'SEARCHING' && (
          <SearchingView onlineCount={onlineCount} selectedInterests={selectedInterests} />
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {state === 'DISCONNECTED' && (
          <DisconnectedView onFindNew={() => findStranger(selectedInterests)} />
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Typing Indicator */}
      {typing && state === 'CONNECTED' && (
        <div className="px-4 py-1.5 text-xs text-dark-400 italic flex items-center gap-1.5 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          Stranger is typing…
        </div>
      )}

      {/* Quick Reactions Drawer (Above Input) */}
      {state === 'CONNECTED' && showReactionsBar && (
        <div className="px-4 py-2 border-t border-dark-800 bg-dark-900/90 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto scrollbar-thin animate-slide-up">
          <div className="flex items-center gap-2">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="text-xl p-1.5 hover:scale-125 active:scale-95 transition-transform"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex items-center gap-1 border-l border-dark-700 pl-2">
            {QUICK_PHRASES.slice(0, 3).map((phrase) => (
              <button
                key={phrase}
                onClick={() => sendMessage(phrase)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-dark-800 hover:bg-dark-700 text-dark-300 hover:text-dark-100 transition-colors whitespace-nowrap"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Bar */}
      {state === 'CONNECTED' && (
        <div className="px-3 sm:px-4 py-3 border-t border-dark-800 bg-dark-900/90 backdrop-blur-md">
          <div className="flex items-end gap-1.5 sm:gap-2">
            {/* Quick Reactions Toggle */}
            <button
              onClick={() => setShowReactionsBar((prev) => !prev)}
              className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
                showReactionsBar
                  ? 'bg-primary-500/20 border-primary-500 text-primary-400'
                  : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200'
              }`}
              title="Quick Reactions"
              aria-label="Toggle Quick Reactions"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Icebreaker shortcut */}
            <button
              onClick={() => setIsIcebreakerOpen(true)}
              className="p-2.5 rounded-xl bg-dark-800 border border-dark-700 text-amber-400 hover:text-amber-300 hover:bg-dark-700 transition-colors flex-shrink-0 cursor-pointer"
              title="Icebreaker Prompts"
              aria-label="Open Icebreaker Prompts"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            {/* Message Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (max 500 chars)"
              maxLength={500}
              rows={1}
              className="flex-1 resize-none bg-dark-800 border border-dark-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-dark-50 placeholder-dark-500 rounded-xl px-3.5 py-2.5 text-sm sm:text-base outline-none"
              aria-label="Message input"
            />

            {/* Send Button */}
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="p-2.5 sm:p-3 rounded-xl bg-primary-500 text-dark-900 font-semibold hover:bg-primary-400 active:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 cursor-pointer shadow-md shadow-primary-500/20"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              className="p-2.5 sm:p-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-400 hover:text-red-400 hover:border-red-500/50 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Report user"
              title="Report"
            >
              <Flag className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px] text-dark-500 px-1">
            <span>🎮 Tap <strong>Games</strong> to challenge stranger</span>
            <span>{input.length}/500 • Enter=Send • Esc=Skip</span>
          </div>
        </div>
      )}

      {/* Game Hub Modal & Float Widget */}
      <GameHub
        socket={socket}
        sound={sound}
        isOpen={isGameHubOpen}
        onClose={() => setIsGameHubOpen(false)}
        incomingInvite={incomingGameInvite}
        onClearInvite={() => setIncomingGameInvite(null)}
      />

      {/* Icebreaker Modal */}
      <IcebreakerModal
        isOpen={isIcebreakerOpen}
        onClose={() => setIsIcebreakerOpen(false)}
        onSendIcebreaker={handleSendIcebreaker}
      />

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReport}
          reason={reportReason}
          setReason={setReportReason}
        />
      )}

      {/* Age Gate Modal */}
      {showAgeGateModal && (
        <AgeGateModal
          appName={APP_NAME}
          onAccept={acceptAgeGate}
          onClose={() => setShowAgeGateModal(false)}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function AgeGateModal({ onAccept, onClose, appName }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-3xl p-6 sm:p-7 shadow-2xl animate-slide-up relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-primary-500" aria-hidden="true" />
          </div>
          <h2 id="age-gate-title" className="text-xl font-bold text-dark-50">Safety First — {appName}</h2>
          <p className="text-xs text-dark-400 mt-1">Please confirm your age to start chatting anonymously</p>
        </div>
        <ul className="space-y-3 text-xs sm:text-sm text-dark-300 mb-6">
          <li className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary-500 mt-0.5" />
            <span>You must be <strong>18 or older</strong> to use this platform.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary-500 mt-0.5" />
            <span>Zero tolerance for <strong>CSAM, harassment, hate speech, or abuse</strong> under the Indian IT Act, 2000.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary-500 mt-0.5" />
            <span>No phone numbers, social handles, or personal data — <strong>stay 100% anonymous</strong>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-primary-500 mt-0.5" />
            <span>Play multiplayer games, share desi icebreakers, and have fun safely!</span>
          </li>
        </ul>
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-primary-500 border-dark-700 rounded focus:ring-primary-500 cursor-pointer"
          />
          <span className="text-xs sm:text-sm text-dark-300 leading-relaxed">
            I am 18 or older and agree to the <a href="/terms" className="underline hover:text-primary-400" target="_blank" rel="noopener noreferrer">Terms of Use</a>, <a href="/privacy" className="underline hover:text-primary-400" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and <a href="/disclaimer" className="underline hover:text-primary-400" target="_blank" rel="noopener noreferrer">Disclaimer</a>.
          </span>
        </label>
        <button
          onClick={onAccept}
          disabled={!agreed}
          className="mt-5 w-full py-3.5 rounded-2xl bg-primary-500 text-dark-900 font-bold hover:bg-primary-400 active:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary-500/20 text-sm sm:text-base"
        >
          I Agree & Start Chatting
        </button>
      </div>
    </div>
  );
}

const FAQS = [
  {
    q: 'What is Talk to Strangers India?',
    a: 'Talk to Strangers India is a free, mobile-first anonymous 1-on-1 text chat platform designed for Indian users to meet and talk to random strangers safely, share desi icebreakers, and play real-time multiplayer games without registration.',
  },
  {
    q: 'Is Talk to Strangers India completely free?',
    a: 'Yes, Talk to Strangers India is 100% free forever. There are no subscriptions, no premium coins, no hidden paywalls, and no credit card required.',
  },
  {
    q: 'Do I need to sign up, provide a phone number, or download an app?',
    a: 'No. You do not need to register, provide an email address, or enter a phone number. The website works directly in any modern mobile or desktop browser with zero installation.',
  },
  {
    q: 'How does Talk to Strangers India protect user privacy and safety?',
    a: 'We do not store chat logs or personal records. Conversations are ephemeral and end permanently when you disconnect. Automated server-side filters block phone numbers, social media handles, and profanity. A 1-click report button enforces a 24-hour IP ban on violators.',
  },
  {
    q: 'What multiplayer games can I play in the chat?',
    a: 'You can play Zero Kaata (Tic-Tac-Toe), Stone-Paper-Scissors with simultaneous reveal, and Desi Quiz Duel featuring 5 timed Bollywood, Cricket, and Indian pop-culture trivia questions right inside the chat window.',
  },
  {
    q: 'How does interest matching work?',
    a: 'You can select preset interest chips such as Cricket & IPL, Bollywood & OTT, Gaming & BGMI, Tech & AI, or add custom tags like UPSC or College to get matched with like-minded Indian strangers.',
  },
];

const CITIES = [
  'Delhi NCR', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Kolkata', 'Chennai',
  'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 'Indore', 'Bhopal', 'Patna', 'Kochi',
];

function LandingView({ onStart, appName, onlineCount, selectedInterests, onToggleInterest }) {
  const [customTag, setCustomTag] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const tag = customTag.trim().toLowerCase();
    if (tag && !selectedInterests.includes(tag)) {
      onToggleInterest(tag);
      setCustomTag('');
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-3 sm:px-6 text-center animate-fade-in py-6 sm:py-10 space-y-12">
      {/* Hero Section */}
      <div className="flex flex-col items-center max-w-2xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>India’s #1 Free Anonymous Stranger Chat & Games</span>
        </div>

        {/* Primary H1 */}
        <h1 className="text-3xl sm:text-5xl font-black text-dark-50 tracking-tight mb-3">
          Talk to Strangers India
        </h1>
        <p className="text-sm sm:text-base text-dark-300 mb-6 max-w-xl leading-relaxed">
          Connect instantly with verified Indian strangers online. Play multiplayer games, share desi icebreakers, or chat freely with shared interests — 100% free, no login, no phone numbers required.
        </p>

        {/* Online Stats Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-dark-400 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <Users className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
            {onlineCount.toLocaleString()} online now
          </span>
          <span className="flex items-center gap-1.5 text-green-400 px-3 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            Safe & IT Act Compliant
          </span>
          <span className="flex items-center gap-1.5 text-primary-300 px-3 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            100% Ephemeral & Private
          </span>
        </div>

        {/* Interest Matching Section */}
        <div className="w-full max-w-lg bg-dark-900/95 border border-dark-800 rounded-3xl p-5 mb-6 text-left shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-dark-100 flex items-center gap-1.5">
                <span>🎯 Choose Your Interests</span>
                <span className="text-[10px] text-dark-400 font-normal">(Optional)</span>
              </h2>
              <p className="text-xs text-dark-400">Match with someone who shares what you love!</p>
            </div>
            {selectedInterests.length > 0 && (
              <button
                onClick={() => selectedInterests.forEach((id) => onToggleInterest(id))}
                className="text-[11px] text-dark-400 hover:text-dark-200 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Preset Chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {PRESET_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => onToggleInterest(interest.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-500 text-dark-900 font-bold shadow-md shadow-primary-500/20 scale-105'
                      : 'bg-dark-800 hover:bg-dark-700 text-dark-300 border border-dark-700/60'
                  }`}
                >
                  {interest.label}
                </button>
              );
            })}
          </div>

          {/* Custom Interest Input */}
          <form onSubmit={handleAddCustomTag} className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              placeholder="Add custom topic (e.g. UPSC, Anime, Gym, Coding)…"
              maxLength={25}
              className="flex-1 px-3.5 py-2 rounded-xl bg-dark-800 border border-dark-700 text-xs text-dark-100 placeholder-dark-500 outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!customTag.trim()}
              className="px-3.5 py-2 rounded-xl bg-dark-700 text-dark-200 text-xs font-semibold hover:bg-dark-600 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>

        {/* Start Button CTA */}
        <button
          onClick={onStart}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-primary-500 text-dark-900 font-black text-lg hover:bg-primary-400 active:bg-primary-600 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-primary-500/25 hover:scale-102 cursor-pointer"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          Start Chatting Now
        </button>

        <p className="mt-4 text-xs text-dark-500 max-w-xs leading-relaxed">
          100% anonymous. By starting, you confirm you are 18+ and accept our{' '}
          <a href="/terms" className="underline hover:text-primary-400">Terms</a>,{' '}
          <a href="/privacy" className="underline hover:text-primary-400">Privacy</a>, and{' '}
          <a href="/disclaimer" className="underline hover:text-primary-400">Disclaimer</a>.
        </p>
      </div>

      {/* Feature Grid: Why Talk to Strangers India? */}
      <section className="w-full max-w-3xl text-left pt-6 border-t border-dark-800/80">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-50 mb-2">
            Why Chat On Talk to Strangers India?
          </h2>
          <p className="text-xs sm:text-sm text-dark-400 max-w-md mx-auto">
            Built from the ground up for Indian internet users looking for genuine, spontaneous, and safe conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-primary-500/10 text-primary-400 mb-3">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Multiplayer In-Chat Games</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Duel in Zero Kaata (Tic-Tac-Toe), Stone-Paper-Scissors, or Desi Quiz Duel with live sync while you talk.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-amber-500/10 text-amber-400 mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Desi Icebreaker Prompts</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Never say an awkward 'Hi' again. 1-click prompts for spicy debates (Maggi with ketchup, Biryani wars, Goa trips).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Interest-Based Matching</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Match with like-minded strangers who love Cricket & IPL, Bollywood cinema, BGMI, Tech, or Late Night Talks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-green-500/10 text-green-400 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Safe & IT Act Compliant</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Server-side filters automatically strip phone numbers and handles. Instant 24-hour IP ban on reported users.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">100% Zero Sign-Up</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              No phone verification, no passwords, no email. Jump straight into conversation within seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-red-500/10 text-red-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Fully Ephemeral & Private</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              No chat logs or personal records are ever stored. When your chat ends, everything disappears permanently.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-3xl text-left pt-6 border-t border-dark-800/80">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-50 mb-2">How It Works</h2>
          <p className="text-xs sm:text-sm text-dark-400">Three simple steps to start chatting with strangers in India</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              1
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Pick Your Interests</h3>
            <p className="text-xs text-dark-400">
              Select what you love (Cricket, Movies, Tech) or leave it blank to match with any random Indian user.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              2
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Instant Matchmaking</h3>
            <p className="text-xs text-dark-400">
              Our fast queue pairs you 1-on-1 with an active user in real-time. No long waiting or confusing rooms.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              3
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Chat, Play & Connect</h3>
            <p className="text-xs text-dark-400">
              Talk freely, challenge your stranger to multiplayer mini-games, or tap Esc anytime to meet someone new.
            </p>
          </div>
        </div>
      </section>

      {/* Popular Cities in India */}
      <section className="w-full max-w-3xl text-center pt-6 border-t border-dark-800/80">
        <h2 className="text-sm font-bold text-dark-300 uppercase tracking-wider mb-3 flex items-center justify-center gap-1.5">
          <Globe className="w-4 h-4 text-primary-400" />
          <span>Active Users Across Indian Cities & Campuses</span>
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CITIES.map((city) => (
            <span
              key={city}
              className="px-3 py-1 rounded-full bg-dark-900 border border-dark-800 text-[11px] text-dark-400"
            >
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ Accordion) */}
      <section className="w-full max-w-3xl text-left pt-6 border-t border-dark-800/80">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-50 mb-2">Frequently Asked Questions</h2>
          <p className="text-xs sm:text-sm text-dark-400">Everything you need to know about Talk to Strangers India</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-dark-900/90 border border-dark-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-sm font-bold text-dark-100 hover:text-primary-300 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-dark-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-primary-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs sm:text-sm text-dark-400 leading-relaxed border-t border-dark-800/50 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SEO Footer */}
      <footer className="w-full max-w-3xl pt-8 pb-4 border-t border-dark-800/80 text-center text-xs text-dark-500 space-y-3">
        <p className="text-dark-400">
          <strong>Talk to Strangers India</strong> — The safe, free, anonymous text chat and multiplayer game platform for India.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs">
          <a href="/terms" className="hover:text-primary-400 underline">Terms of Use</a>
          <span>•</span>
          <a href="/privacy" className="hover:text-primary-400 underline">Privacy Policy</a>
          <span>•</span>
          <a href="/disclaimer" className="hover:text-primary-400 underline">Disclaimer</a>
          <span>•</span>
          <a href="mailto:grievance@talktostrangersindia.com" className="hover:text-primary-400 underline">Grievance Redressal</a>
        </div>
        <p className="text-[11px] text-dark-600">
          © {new Date().getFullYear()} Talk to Strangers India. Compliant with Information Technology Act, 2000 & IT Rules 2021.
        </p>
      </footer>
    </div>
  );
}

function SearchingView({ onlineCount, selectedInterests }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 text-center animate-fade-in py-16">
      <div className="relative mb-6">
        <Loader2 className="w-14 h-14 text-primary-500 animate-spin" aria-hidden="true" />
        <span className="absolute inset-0 flex items-center justify-center text-xs">🇮🇳</span>
      </div>
      <h3 className="text-xl font-bold text-dark-50 mb-1">Looking for a stranger…</h3>
      {selectedInterests.length > 0 ? (
        <p className="text-xs text-primary-400 mb-2 font-medium">
          Searching for someone who also likes: {selectedInterests.join(', ')}
        </p>
      ) : (
        <p className="text-xs text-dark-400 mb-2">Connecting you with an active Indian stranger</p>
      )}
      <p className="text-xs text-dark-500">{onlineCount.toLocaleString()} users online right now</p>

      <div className="mt-8 flex items-center justify-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" />
        <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
        <span className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}

function MessageBubble({ message }) {
  const { text, from, type = 'text', at } = message;
  const isYou = from === 'you';
  const isSystem = from === 'system';
  const time = new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3.5 py-1 rounded-full bg-dark-800/90 border border-dark-700/60 text-xs text-dark-400 text-center leading-relaxed">
          {text}
        </span>
      </div>
    );
  }

  // Icebreaker Prompt Message Bubble
  if (type === 'icebreaker') {
    return (
      <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in my-2`}>
        <div className="max-w-[85%] sm:max-w-[75%] rounded-3xl p-4 bg-gradient-to-br from-amber-500/15 via-dark-800 to-dark-900 border border-amber-500/40 shadow-xl">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isYou ? 'You shared an Icebreaker' : 'Stranger shared an Icebreaker'}</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-dark-50 leading-relaxed italic">
            "{text}"
          </p>
          <div className="mt-2 text-right text-[10px] text-dark-500">
            {time}
          </div>
        </div>
      </div>
    );
  }

  // Quick Emoji Reaction Bubble
  if (type === 'reaction') {
    return (
      <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in my-1`}>
        <div className="text-3xl p-1 animate-bounce">
          {text}
        </div>
      </div>
    );
  }

  // Standard Text Message Bubble
  return (
    <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`max-w-[80%] sm:max-w-[75%] ${isYou ? 'rounded-2xl bg-primary-500 text-dark-900' : 'rounded-2xl bg-dark-800 border border-dark-700 text-dark-100'}`}>
        <div className="px-4 py-2.5">
          <p className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">{text}</p>
        </div>
        <div className={`flex items-center gap-1.5 px-4 pb-1.5 ${isYou ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isYou ? 'text-dark-900/60' : 'text-dark-500'}`}>{time}</span>
          {isYou && <span className="text-[10px] text-dark-900/60 font-bold">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

function DisconnectedView({ onFindNew }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center animate-fade-in py-12">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3">
        <AlertCircle className="w-7 h-7 text-red-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-dark-50 mb-1">Stranger left the chat</h3>
      <p className="text-xs sm:text-sm text-dark-400 mb-6 max-w-sm">
        They disconnected or skipped. You can find another Indian stranger instantly.
      </p>
      <button
        onClick={onFindNew}
        className="px-6 py-3 rounded-xl bg-primary-500 text-dark-900 font-bold hover:bg-primary-400 active:bg-primary-600 transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/20 text-sm cursor-pointer"
      >
        <MessageSquare className="w-4 h-4" aria-hidden="true" />
        Find New Stranger
      </button>
    </div>
  );
}

function ReportModal({ onClose, onSubmit, reason, setReason }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="report-title">
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-2xl p-6 animate-slide-up shadow-2xl">
        <h3 id="report-title" className="text-lg font-bold text-dark-50 mb-2">Report this user</h3>
        <p className="text-xs sm:text-sm text-dark-400 mb-4">
          Help keep the community safe. This immediately ends the chat and blocks their IP for 24 hours.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for report (e.g. offensive language, inappropriate behavior)…"
          rows={3}
          className="w-full bg-dark-800 border border-dark-700 focus:border-primary-500 text-dark-50 placeholder-dark-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm resize-none mb-4 outline-none"
          aria-label="Report reason"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 font-medium hover:bg-dark-700 transition-colors text-xs sm:text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 active:bg-red-700 transition-colors text-xs sm:text-sm shadow-md shadow-red-600/20"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}