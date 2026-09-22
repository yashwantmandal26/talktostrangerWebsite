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
  { id: 'bollywood', label: '🎬 Bollywood & Web Series' },
  { id: 'gaming', label: '🎮 Gaming & BGMI' },
  { id: 'latenight', label: '☕ Late Night Talks' },
  { id: 'tech', label: '💻 Tech & AI' },
  { id: 'food', label: '🍕 Foodies & Chai' },
  { id: 'college', label: '📚 College & UPSC' },
  { id: 'music', label: '🎧 Music & Desi Hip-Hop' },
  { id: 'travel', label: '✈️ Travel & Goa Trips' },
  { id: 'memes', label: '🎭 Standup & Memes' },
];

const QUICK_REACTIONS = ['❤️', '😂', '🔥', '👏', '🇮🇳', '🤝', '👍', '☕'];
const QUICK_PHRASES = [
  'Haha sahi hai! 😂',
  'Arey waah! 🔥',
  'Sach me bhai? 🤯',
  'Chai pe charcha! ☕',
  'Badhiya baat boli 🤝',
  'GG! Kya match tha 🎮',
];

export default function Chat() {
  const [socket, setSocket] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
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
  const mainScrollRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const pendingFindStrangerRef = useRef(null);

  // Only scroll to bottom when actively chatting (CONNECTED state with messages)
  useEffect(() => {
    if (state === 'CONNECTED' && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, state]);

  // Scroll main area to TOP when on landing/searching/disconnected
  useEffect(() => {
    if (state === 'IDLE' || state === 'SEARCHING' || state === 'DISCONNECTED') {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTop = 0;
      }
    }
  }, [state]);

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
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 30000,
    });

    newSocket.on('connect', () => {
      console.log('[socket] connected', newSocket.id);
      setIsSocketConnected(true);
      if (pendingFindStrangerRef.current !== null) {
        const interests = pendingFindStrangerRef.current;
        pendingFindStrangerRef.current = null;
        newSocket.emit('find_stranger', { interests });
      }
    });

    newSocket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[socket] connect_error', err.message);
      setIsSocketConnected(false);
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

    newSocket.on('search_cancelled', () => {
      setState('IDLE');
    });

    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const findStranger = useCallback((interests = selectedInterests) => {
    setMessages([]);
    setState('SEARCHING');
    setIncomingGameInvite(null);
    if (socket && socket.connected) {
      socket.emit('find_stranger', { interests });
    } else {
      pendingFindStrangerRef.current = interests;
    }
  }, [socket, selectedInterests]);

  const nextStranger = useCallback((interests = selectedInterests) => {
    if (socket && state === 'CONNECTED') {
      socket.emit('skip_chat');
    }
    setMessages([]);
    setState('SEARCHING');
    setTyping(false);
    setIncomingGameInvite(null);
    setIsGameHubOpen(false);
    if (socket && socket.connected) {
      socket.emit('find_stranger', { interests });
    } else {
      pendingFindStrangerRef.current = interests;
    }
  }, [socket, state, selectedInterests]);

  const cancelSearch = useCallback(() => {
    pendingFindStrangerRef.current = null;
    if (socket) {
      socket.emit('cancel_search');
    }
    setState('IDLE');
  }, [socket]);

  const goHome = useCallback(() => {
    pendingFindStrangerRef.current = null;
    if (socket) {
      if (state === 'CONNECTED') {
        socket.emit('skip_chat');
      } else if (state === 'SEARCHING') {
        socket.emit('cancel_search');
      }
    }
    setMessages([]);
    setState('IDLE');
    setTyping(false);
    setIncomingGameInvite(null);
    setIsGameHubOpen(false);
  }, [socket, state]);

  const skipInterestFilter = useCallback(() => {
    if (!socket) return;
    setSelectedInterests([]);
    socket.emit('skip_interest_filter');
  }, [socket]);

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

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      if (state === 'CONNECTED') {
        nextStranger();
      } else if (state === 'SEARCHING' || state === 'DISCONNECTED') {
        goHome();
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
  }, [sendMessage, state, nextStranger, goHome]);

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
    <div className={`flex flex-col h-[100dvh] w-full ${state === 'IDLE' ? 'sm:max-w-4xl' : 'sm:max-w-2xl'} sm:mx-auto bg-dark-900 sm:border-x sm:border-dark-800 relative`}>
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-dark-800 bg-dark-900/90 backdrop-blur-md sticky top-0 z-20 pt-safe">
        {/* Branding */}
        <button
          onClick={goHome}
          className="flex items-center gap-2 min-w-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
          title="Back to Home"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-dark-50 tracking-tight leading-tight truncate">
              <span className="sm:hidden">TTS India</span>
              <span className="hidden sm:inline">{APP_NAME}</span>
            </h1>
            {/* Online count — visible on mobile below title */}
            <p className="text-[10px] text-dark-500 flex items-center gap-1 sm:hidden">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${isSocketConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
              {isSocketConnected ? `${onlineCount.toLocaleString()} online` : 'Connecting...'}
            </p>
          </div>
        </button>

        {/* Header Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 flex-shrink-0">
          {/* Online count / Connection indicator — desktop only */}
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-800/80 border border-dark-700/60 text-dark-300 text-xs font-medium mr-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            <Users className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
            <span>{isSocketConnected ? `${onlineCount.toLocaleString()} online` : 'Connecting...'}</span>
          </span>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-dark-400 hover:text-dark-100 hover:bg-dark-800 active:bg-dark-700 transition-colors cursor-pointer"
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
                className="w-10 h-10 flex items-center justify-center rounded-xl text-amber-400 hover:text-amber-300 hover:bg-dark-800 active:bg-dark-700 transition-colors cursor-pointer"
                title="Break The Ice (Alt+I)"
                aria-label="Icebreaker prompts"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsGameHubOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 hover:text-primary-300 active:bg-primary-500/30 transition-colors cursor-pointer"
                title="Play Games (Alt+G)"
                aria-label="Open game hub"
              >
                <Gamepad2 className="w-4 h-4" />
                {incomingGameInvite && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                )}
              </button>
            </>
          )}

          {/* Skip / Cancel / New Chat Button */}
          {state === 'SEARCHING' && (
            <button
              onClick={cancelSearch}
              className="px-3 py-1.5 rounded-xl transition-colors text-red-400 hover:text-red-300 hover:bg-red-500/10 active:bg-red-500/20 cursor-pointer flex items-center gap-1 text-xs font-semibold"
              aria-label="Cancel search"
              title="Cancel Search (Esc)"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>Cancel</span>
            </button>
          )}

          {state === 'CONNECTED' && (
            <button
              onClick={() => nextStranger()}
              className="px-3 py-1.5 rounded-xl transition-colors text-dark-300 hover:text-dark-100 hover:bg-dark-800 active:bg-dark-700 cursor-pointer flex items-center gap-1 text-xs font-semibold border border-dark-700"
              aria-label="Next stranger"
              title="Next Stranger (Esc)"
            >
              <SkipForward className="w-4 h-4" aria-hidden="true" />
              <span>Next</span>
            </button>
          )}
        </div>
      </header>

      {/* Connected Status Bar */}
      {state === 'CONNECTED' && (
        <div className="px-3 sm:px-4 py-2 bg-dark-900/95 border-b border-dark-800 flex items-center gap-2 animate-fade-in">
          {/* Stranger Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-xs font-bold text-dark-900">
              S
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-dark-900" />
          </div>

          {/* Status text + interests */}
          <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-semibold text-dark-100 whitespace-nowrap">Stranger</span>
            <span className="text-[10px] text-green-400 font-medium whitespace-nowrap">● connected</span>
            {commonInterests.length > 0 && (
              <div className="flex gap-1 overflow-x-auto scrollbar-thin">
                {commonInterests.map((interest) => (
                  <span key={interest} className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 text-[10px] font-medium capitalize border border-primary-500/20">
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Skip / Next button — right here near the context */}
          <button
            onClick={() => nextStranger()}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 text-xs font-semibold hover:bg-dark-700 hover:text-dark-100 hover:border-dark-600 active:bg-dark-600 active:scale-95 transition-all cursor-pointer"
            title="Skip to next stranger (Esc)"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Next</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-3.5 scrollbar-thin scroll-momentum" role="log" aria-live="polite" aria-label="Chat messages">
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
          <SearchingView
            onlineCount={onlineCount}
            selectedInterests={selectedInterests}
            onCancel={cancelSearch}
            onSkipFilter={skipInterestFilter}
            isSocketConnected={isSocketConnected}
          />
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {state === 'DISCONNECTED' && (
          <DisconnectedView
            onFindNew={() => nextStranger(selectedInterests)}
            onGoHome={goHome}
          />
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Typing Indicator */}
      {typing && state === 'CONNECTED' && (
        <div className="px-4 py-2 flex items-center gap-2 animate-fade-in">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-[9px] font-bold text-dark-900 flex-shrink-0">
            S
          </div>
          <div className="flex items-center gap-1 px-3 py-2 rounded-2xl rounded-tl-sm bg-dark-800 border border-dark-700/60">
            <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-dark-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}

      {/* Input Bar */}
      {state === 'CONNECTED' && (
        <div className="border-t border-dark-800/80 bg-dark-900/95 backdrop-blur-xl pb-safe">
          {/* Quick Reactions Drawer */}
          {showReactionsBar && (
            <div className="px-3 py-2 border-b border-dark-800/60 flex items-center gap-1 overflow-x-auto scrollbar-thin animate-slide-up">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-xl w-11 h-11 flex items-center justify-center hover:scale-125 active:scale-90 transition-transform flex-shrink-0 rounded-xl hover:bg-dark-800"
                  title={`Send ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
              <div className="flex-shrink-0 w-px h-6 bg-dark-700 mx-1" />
              {QUICK_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => sendMessage(phrase)}
                  className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-dark-800 hover:bg-dark-700 active:bg-dark-600 text-dark-300 hover:text-dark-100 transition-colors whitespace-nowrap"
                >
                  {phrase}
                </button>
              ))}
            </div>
          )}

          {/* Main Input Row */}
          <div className="px-2 sm:px-3 py-2 flex items-end gap-1.5">
            {/* Left action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              <button
                onClick={() => setShowReactionsBar((prev) => !prev)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  showReactionsBar
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-500 hover:text-dark-200 hover:bg-dark-800 active:bg-dark-700'
                }`}
                aria-label="Quick reactions"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsIcebreakerOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-amber-500/70 hover:text-amber-400 hover:bg-dark-800 active:bg-dark-700 transition-all cursor-pointer"
                aria-label="Icebreaker"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              maxLength={500}
              rows={1}
              className="flex-1 resize-none bg-dark-800/80 border border-dark-700/80 focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/30 text-dark-50 placeholder-dark-600 rounded-2xl px-4 py-2.5 text-base outline-none leading-normal transition-all"
              aria-label="Message input"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            {/* Right action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-0.5">
              {/* Send */}
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-dark-900 hover:from-primary-400 hover:to-primary-500 active:from-primary-600 active:to-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 cursor-pointer shadow-lg shadow-primary-500/25"
                aria-label="Send message"
              >
                <Send className="w-4.5 h-4.5" aria-hidden="true" />
              </button>

              {/* Skip / Next — right next to send */}
              <button
                onClick={() => nextStranger()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-dark-800/80 border border-dark-700/60 text-dark-400 hover:text-dark-100 hover:bg-dark-700 hover:border-dark-600 active:bg-dark-600 active:scale-95 transition-all cursor-pointer"
                aria-label="Next stranger"
                title="Next stranger (Esc)"
              >
                <SkipForward className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="px-4 pb-1 flex items-center justify-between text-[10px] text-dark-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-1 text-dark-600 hover:text-red-400 transition-colors cursor-pointer"
                title="Report user"
              >
                <Flag className="w-3 h-3" />
                <span>Report</span>
              </button>
              <button
                onClick={() => setIsGameHubOpen(true)}
                className="flex items-center gap-1 text-dark-600 hover:text-primary-400 transition-colors cursor-pointer"
              >
                <Gamepad2 className="w-3 h-3" />
                <span>Games</span>
              </button>
            </div>
            <span className={`tabular-nums transition-colors ${input.length > 450 ? 'text-red-400' : input.length > 350 ? 'text-amber-400' : ''}`}>
              {input.length}/500
            </span>
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
    a: 'Talk to Strangers India is a 100% free, anonymous 1-on-1 text chat and mini-games platform built specifically for Indian internet users. Connect instantly with verified Indian strangers online, send spicy desi icebreakers, and duel in real-time multiplayer games without registration.',
  },
  {
    q: 'Is Talk to Strangers India completely free to use?',
    a: 'Yes, completely free forever! There are no subscriptions, no premium passes, no hidden paywalls, and no credit card required. Everything from text chat to multiplayer mini-games is 100% free.',
  },
  {
    q: 'Do I need to sign up, enter a phone number, or install an app?',
    a: 'Zero registration needed! No email, no mobile number, no OTP, and no app download. Simply open the website in Chrome, Safari, or any browser on your phone or PC, tap "Start Chatting Now", and jump straight in.',
  },
  {
    q: 'How are privacy and safety protected on this platform?',
    a: 'We prioritize your privacy above all: 1) Zero chat logs are stored on our servers — when you leave, all messages vanish permanently. 2) Real-time safety filters block phone numbers, social handles, and abusive words. 3) A 1-click report button immediately blocks violators by IP for 24 hours in compliance with the Indian IT Act, 2000.',
  },
  {
    q: 'What multiplayer games can I play while chatting?',
    a: 'You can duel your stranger in 3 interactive games right inside the chat window: Zero Kaata (Tic-Tac-Toe), Stone-Paper-Scissors with simultaneous dramatic reveal, and Desi Quiz Duel featuring timed questions on Bollywood, Cricket, Memes, and Indian pop culture.',
  },
  {
    q: 'How does interest-based matchmaking work?',
    a: 'Select preset topic chips like Cricket & IPL, Bollywood, BGMI, Tech & AI, or Late Night Talks — or type any custom topic (e.g., UPSC, Gym, Anime, Goa). Our queue will prioritize pairing you with someone who selected the exact same interests!',
  },
  {
    q: 'How do I skip or find a new stranger quickly?',
    a: 'Simply click the "Next" button right next to the message textbox or press the "Esc" key on your keyboard to instantly jump to a new stranger without returning to the home screen.',
  },
];

const CITIES = [
  'Delhi NCR', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad', 'Kolkata', 'Chennai',
  'Ahmedabad', 'Jaipur', 'Chandigarh', 'Lucknow', 'Indore', 'Bhopal', 'Patna', 'Kochi',
  'Surat', 'Nagpur', 'Goa', 'Dehradun', 'Varanasi',
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
    <div className="flex flex-col items-center justify-center min-h-full px-3 sm:px-6 text-center animate-fade-in py-6 sm:py-10 space-y-10">
      {/* Hero Section */}
      <div className="flex flex-col items-center max-w-2xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-500/15 to-amber-500/10 border border-primary-500/25 text-primary-300 text-xs font-semibold mb-5 animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
          <Sparkles className="w-3.5 h-3.5" />
          <span>India's Favorite Free Anonymous Chat & Games</span>
        </div>

        {/* Gradient H1 */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3 leading-tight">
          <span className="bg-gradient-to-r from-primary-400 via-amber-400 to-primary-300 bg-clip-text text-transparent">
            Talk to Strangers
          </span>
          <br />
          <span className="text-dark-50">India 🇮🇳</span>
        </h1>
        <p className="text-sm sm:text-base text-dark-300 mb-6 max-w-xl leading-relaxed">
          Meet interesting people across India in seconds. Play multiplayer mini-games, debate Biryani vs Maggi, and share spontaneous late-night thoughts — 100% free, zero login, totally anonymous.
        </p>

        {/* Online Stats Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-dark-400 mb-6">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <Users className="w-3.5 h-3.5 text-primary-400" aria-hidden="true" />
            {onlineCount.toLocaleString()} Indians online now
          </span>
          <span className="flex items-center gap-1.5 text-green-400 px-3 py-1.5 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <Shield className="w-3.5 h-3.5" aria-hidden="true" />
            Safe & IT Act Compliant
          </span>
          <span className="flex items-center gap-1.5 text-primary-300 px-3 py-1.5 rounded-full bg-dark-800/80 border border-dark-700/60 font-medium">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            100% Ephemeral & Private
          </span>
        </div>

        {/* Interest Matching Section */}
        <div className="w-full max-w-lg bg-dark-900/95 border border-dark-800 rounded-3xl p-5 mb-6 text-left shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-dark-100 flex items-center gap-1.5">
                <span>🎯 Match by Interests</span>
                <span className="text-[10px] text-dark-400 font-normal">(Optional)</span>
              </h2>
              <p className="text-xs text-dark-400">Pick topics to chat with someone on your wavelength!</p>
            </div>
            {selectedInterests.length > 0 && (
              <button
                onClick={() => selectedInterests.forEach((id) => onToggleInterest(id))}
                className="text-[11px] text-primary-400 hover:text-primary-300 underline cursor-pointer font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Preset Chips */}
          <div className="flex sm:flex-wrap gap-2 mb-3 overflow-x-auto scrollbar-thin pb-1 sm:pb-0 -mx-1 px-1">
            {PRESET_INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  onClick={() => onToggleInterest(interest.id)}
                  className={`flex-shrink-0 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-primary-500 text-dark-900 font-bold shadow-md shadow-primary-500/20'
                      : 'bg-dark-800 hover:bg-dark-700 active:bg-dark-600 text-dark-300 border border-dark-700/60'
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
              placeholder="Add any topic (e.g. UPSC, Gym, Anime, Coding)…"
              maxLength={25}
              className="flex-1 px-3.5 py-3 rounded-xl bg-dark-800 border border-dark-700 text-sm text-dark-100 placeholder-dark-500 outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              disabled={!customTag.trim()}
              className="px-4 py-3 rounded-xl bg-dark-700 text-dark-200 text-xs font-semibold hover:bg-dark-600 active:bg-dark-500 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>

        {/* Start Button CTA */}
        <button
          onClick={onStart}
          className="w-full py-4 sm:py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-amber-500 text-dark-900 font-black text-lg hover:from-primary-400 hover:to-amber-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-primary-500/25 cursor-pointer"
        >
          <Search className="w-5 h-5" aria-hidden="true" />
          Start Chatting Now
        </button>

        <p className="mt-4 text-xs text-dark-500 max-w-xs leading-relaxed">
          100% free & anonymous. By starting, you confirm you are 18+ and accept our{' '}
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
            Built from the ground up for Indian users looking for genuine, spontaneous, and safe conversations.
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
            <h3 className="text-sm font-bold text-dark-100 mb-1">1-Click Desi Icebreakers</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Never get stuck with a boring 'Hi'. Send spicy debate starters on Biryani wars, Goa trips, or 90s songs.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-blue-500/10 text-blue-400 mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Smart Interest Matching</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Match with like-minded strangers who share your passion for Cricket, BGMI, Anime, Startups, or Late Night talks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-green-500/10 text-green-400 mb-3">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">100% Safe & Moderated</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Server-side filters automatically strip phone numbers and handles. Instant 24-hour IP ban on reported users.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-purple-500/10 text-purple-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Zero Sign-Up Required</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              No phone verification, no passwords, no email. Jump straight into conversation within seconds.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-dark-900/80 border border-dark-800/80 hover:border-primary-500/30 transition-all">
            <div className="p-2 w-fit rounded-xl bg-red-500/10 text-red-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Completely Ephemeral & Private</h3>
            <p className="text-xs text-dark-400 leading-relaxed">
              Zero chat history is stored on disk. When your chat ends or you skip, everything disappears permanently.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full max-w-3xl text-left pt-6 border-t border-dark-800/80">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-50 mb-2">How It Works</h2>
          <p className="text-xs sm:text-sm text-dark-400">Three simple steps to start chatting with strangers across India</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              1
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Pick Your Interests</h3>
            <p className="text-xs text-dark-400">
              Select what you love (Cricket, Movies, Tech) or leave blank to match with any random Indian user.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              2
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Instant Matchmaking</h3>
            <p className="text-xs text-dark-400">
              Our real-time queue pairs you 1-on-1 with another active Indian user in seconds.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-dark-900/90 border border-dark-800 text-center sm:text-left">
            <div className="w-8 h-8 rounded-full bg-primary-500 text-dark-950 font-bold flex items-center justify-center mb-3 text-sm mx-auto sm:mx-0">
              3
            </div>
            <h3 className="text-sm font-bold text-dark-100 mb-1">Chat, Play & Connect</h3>
            <p className="text-xs text-dark-400">
              Talk freely, challenge stranger to mini-games, send icebreakers, or click Next to meet someone new.
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

const DESI_TIPS = [
  { emoji: '🏏', text: 'Virat Kohli 82* vs Pakistan or Dhoni 2011 final six — which moment gave you more goosebumps?' },
  { emoji: '🍛', text: 'Hyderabadi Biryani vs Kolkata Biryani (with Aloo) — which one reigns supreme?' },
  { emoji: '☕', text: 'Chai pe charcha! If you could only drink Chai or Coffee for the rest of your life, which one stays?' },
  { emoji: '🎬', text: 'Hera Pheri, Dhamaal, or Welcome — which is the greatest Indian comedy movie ever made?' },
  { emoji: '🎮', text: 'Challenge your partner! Tap the 🎮 Games icon to play Zero Kaata or Desi Quiz Duel.' },
  { emoji: '🍜', text: 'Spicy debate: Maggi with ketchup — genius hack or complete food crime?' },
  { emoji: '🎧', text: '2000s Bollywood nostalgic tracks (KK, Emraan Hashmi era) vs Modern Desi Hip-Hop?' },
  { emoji: '🏔️', text: 'Goa beach party trip with friends VS peaceful road trip to Himachal — pick one!' },
  { emoji: '🚗', text: 'Would you rather: Bangalore Silk Board traffic for 4 hrs OR Delhi peak 45°C summer without AC?' },
  { emoji: '📱', text: 'UPI processes 13+ billion transactions a month. India is truly digital first!' },
  { emoji: '✨', text: 'No awkward "Hi"! Tap the ✨ icon below to send a fun 1-click Icebreaker debate.' },
  { emoji: '🚀', text: 'ISRO made India the first country to land on the Moon\'s south pole. Proud moment!' },
  { emoji: '🌙', text: 'Late night talks: What keeps you awake at 2 AM — deep thoughts, career goals, or insomnia?' },
];

function SearchingView({ onlineCount, selectedInterests, onCancel, onSkipFilter, isSocketConnected }) {
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * DESI_TIPS.length));
  const [tipVisible, setTipVisible] = useState(true);
  const startTimeRef = useRef(Date.now());

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotating tips with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setTipVisible(false);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % DESI_TIPS.length);
        setTipVisible(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const tip = DESI_TIPS[tipIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center animate-fade-in py-6 sm:py-8 gap-0">
      {/* Free Tier Server Wakeup Notice */}
      {!isSocketConnected && (
        <div className="mb-4 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Waking up free server (~15-20s)... Finding match right after</span>
        </div>
      )}

      {/* Spinner + Flag */}
      <div className="relative mb-5">
        {/* Outer glow ring */}
        <div className="absolute inset-0 w-20 h-20 rounded-full bg-primary-500/20 animate-ping" />
        <div className="relative w-20 h-20 rounded-full border-4 border-primary-500/30 border-t-primary-500 animate-spin" />
        <span className="absolute inset-0 flex items-center justify-center text-2xl pointer-events-none">🇮🇳</span>
      </div>

      {/* Title + Timer */}
      <h3 className="text-xl font-black text-dark-50 mb-1">Finding your stranger…</h3>
      <p className="text-sm text-primary-400 font-semibold mb-1 tabular-nums">
        ⏱ Searching for {formatTime(elapsed)}
      </p>
      <p className="text-xs text-dark-500 mb-5">
        {isSocketConnected ? `${onlineCount.toLocaleString()} users online right now` : 'Connecting to match queue...'}
      </p>

      {/* Active interest tags */}
      {selectedInterests.length > 0 && (
        <div className="mb-4 max-w-xs w-full">
          <p className="text-[11px] text-dark-400 font-semibold uppercase tracking-wide mb-2">Matching with interests:</p>
          <div className="flex flex-wrap gap-1.5 justify-center mb-3">
            {selectedInterests.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-medium capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
          {elapsed >= 8 && (
            <button
              onClick={onSkipFilter}
              className="w-full py-2 rounded-xl bg-dark-800 border border-dark-700 text-dark-200 text-xs font-semibold hover:bg-dark-700 hover:border-primary-500/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-fade-in"
            >
              <Zap className="w-3.5 h-3.5 text-primary-400" />
              Match with anyone (skip filters)
            </button>
          )}
        </div>
      )}

      {/* Rotating Desi Tips Card */}
      <div
        className="w-full max-w-xs rounded-2xl bg-dark-800/60 border border-dark-700/60 p-4 mb-6 transition-opacity duration-400"
        style={{ opacity: tipVisible ? 1 : 0 }}
      >
        <div className="flex items-start gap-3 text-left">
          <span className="text-2xl flex-shrink-0 mt-0.5">{tip.emoji}</span>
          <p className="text-xs text-dark-300 leading-relaxed">{tip.text}</p>
        </div>
        <div className="mt-2.5 flex gap-1 justify-center">
          {DESI_TIPS.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === tipIndex ? 'bg-primary-500 w-3' : 'bg-dark-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Cancel Button — prominent and red */}
      <button
        onClick={onCancel}
        className="group px-7 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer shadow-lg shadow-red-500/10 hover:shadow-red-500/25 text-sm"
        aria-label="Cancel search"
      >
        <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        Cancel Search
        <span className="text-[11px] opacity-60 font-normal">(Esc)</span>
      </button>

      <p className="mt-3 text-[11px] text-dark-600">Tip: You can also press Esc anytime to cancel</p>
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
      <div className="flex justify-center my-3">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-dark-800/70 border border-dark-700/40 text-[11px] text-dark-500 text-center leading-relaxed">
          {text}
        </span>
      </div>
    );
  }

  // Icebreaker Prompt Message Bubble
  if (type === 'icebreaker') {
    return (
      <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in my-2 gap-2`}>
        {!isYou && (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-dark-900 flex-shrink-0 mt-auto">
            S
          </div>
        )}
        <div className="max-w-[82%] sm:max-w-[72%] rounded-3xl p-4 bg-gradient-to-br from-amber-500/20 via-dark-800/90 to-dark-900 border border-amber-500/30 shadow-lg shadow-amber-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>{isYou ? 'You sent an Icebreaker' : 'Stranger sent an Icebreaker'}</span>
          </div>
          <p className="text-sm sm:text-base font-medium text-dark-50 leading-relaxed italic">
            "{text}"
          </p>
          <div className="mt-2 text-right text-[10px] text-dark-600">{time}</div>
        </div>
      </div>
    );
  }

  // Quick Emoji Reaction Bubble
  if (type === 'reaction') {
    return (
      <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in my-1`}>
        <div className="text-4xl animate-pop-in select-none">{text}</div>
      </div>
    );
  }

  // Standard Text Message Bubble
  return (
    <div className={`flex ${isYou ? 'justify-end' : 'justify-start'} animate-fade-in gap-2`}>
      {/* Stranger avatar */}
      {!isYou && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-amber-500 flex items-center justify-center text-[10px] font-bold text-dark-900 flex-shrink-0 mt-auto mb-1">
          S
        </div>
      )}

      <div className={`max-w-[78%] sm:max-w-[72%] flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-2.5 ${
          isYou
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-dark-900 rounded-2xl rounded-br-sm shadow-md shadow-primary-500/20'
            : 'bg-dark-800 border border-dark-700/60 text-dark-100 rounded-2xl rounded-bl-sm'
        }`}>
          <p className="whitespace-pre-wrap break-words text-sm sm:text-[15px] leading-relaxed">{text}</p>
        </div>
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isYou ? 'flex-row-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-dark-600">{time}</span>
          {isYou && <span className="text-[10px] text-primary-500/60 font-bold">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

function DisconnectedView({ onFindNew, onGoHome }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 text-center animate-fade-in py-12 gap-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-dark-700 flex items-center justify-center">
        <span className="text-3xl">👋</span>
      </div>

      {/* Text */}
      <div>
        <h3 className="text-lg font-bold text-dark-50 mb-1">Stranger has left</h3>
        <p className="text-xs sm:text-sm text-dark-400 max-w-xs">
          They disconnected or skipped. Hope it was a good chat! Ready to meet someone new?
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-2">
        <button
          onClick={onFindNew}
          className="px-6 py-3.5 rounded-2xl bg-primary-500 text-dark-900 font-bold hover:bg-primary-400 active:bg-primary-600 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary-500/20 text-sm cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" />
          Find New Stranger
        </button>

        <button
          onClick={onGoHome}
          className="px-6 py-3.5 rounded-2xl bg-dark-800 border border-dark-700 text-dark-200 font-semibold hover:bg-dark-700 hover:border-dark-600 active:scale-95 transition-all flex items-center gap-2 text-sm cursor-pointer"
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Back to Topics (Esc)
        </button>
      </div>

      <p className="text-[11px] text-dark-600 mt-1">
        Press <kbd className="px-1.5 py-0.5 rounded bg-dark-800 border border-dark-700 text-dark-400 font-mono text-[10px]">Esc</kbd> to go back to home screen
      </p>
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