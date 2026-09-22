'use client';

import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, X as CloseIcon } from 'lucide-react';

const CHOICES = [
  { id: 'rock', label: 'Stone (Patthar)', emoji: '🪨', beats: 'scissors' },
  { id: 'paper', label: 'Paper (Kaagaz)', emoji: '📄', beats: 'rock' },
  { id: 'scissors', label: 'Scissors (Kainchi)', emoji: '✂️', beats: 'paper' },
];

export default function RockPaperScissors({ socket, sound, onClose }) {
  const [myChoice, setMyChoice] = useState(null);
  const [strangerChoice, setStrangerChoice] = useState(null);
  const [roundWinner, setRoundWinner] = useState(null); // 'me' | 'stranger' | 'draw' | null
  const [scores, setScores] = useState({ me: 0, stranger: 0 });
  const [round, setRound] = useState(1);
  const [revealing, setRevealing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Pick your move!');

  const myChoiceRef = useRef(myChoice);
  myChoiceRef.current = myChoice;
  const strangerChoiceRef = useRef(strangerChoice);
  strangerChoiceRef.current = strangerChoice;

  const determineRoundWinner = (mine, theirs) => {
    if (mine === theirs) return 'draw';
    const choiceObj = CHOICES.find((c) => c.id === mine);
    return choiceObj && choiceObj.beats === theirs ? 'me' : 'stranger';
  };

  const handlePick = (choiceId) => {
    if (myChoice || revealing) return;
    setMyChoice(choiceId);
    sound?.playGameMove();

    socket?.emit('game_move', {
      gameType: 'rps',
      moveData: { choice: choiceId, round },
    });

    if (strangerChoiceRef.current) {
      triggerReveal(choiceId, strangerChoiceRef.current);
    } else {
      setStatusMessage('Locked in! Waiting for stranger to pick…');
    }
  };

  const triggerReveal = (mine, theirs) => {
    setRevealing(true);
    setStatusMessage('Stone… Paper… Scissors… Shoot! ✊✋✌️');

    setTimeout(() => {
      const winner = determineRoundWinner(mine, theirs);
      setRoundWinner(winner);
      setRevealing(false);

      if (winner === 'me') {
        sound?.playGameWin();
        setScores((s) => ({ ...s, me: s.me + 1 }));
        setStatusMessage('🎉 You won this round!');
      } else if (winner === 'stranger') {
        sound?.playGameLoss();
        setScores((s) => ({ ...s, stranger: s.stranger + 1 }));
        setStatusMessage('Stranger won this round!');
      } else {
        setStatusMessage("It's a tie! Great minds think alike 🤝");
      }
    }, 1200);
  };

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    const onGameMove = ({ gameType, moveData }) => {
      if (gameType !== 'rps' || !moveData) return;
      const { choice } = moveData;
      setStrangerChoice(choice);

      if (myChoiceRef.current) {
        triggerReveal(myChoiceRef.current, choice);
      } else {
        setStatusMessage('Stranger is ready! Make your choice!');
      }
    };

    const onGameReset = ({ gameType }) => {
      if (gameType !== 'rps') return;
      setMyChoice(null);
      setStrangerChoice(null);
      setRoundWinner(null);
      setRevealing(false);
      setRound((r) => r + 1);
      setStatusMessage('New round! Pick your move!');
    };

    socket.on('game_move', onGameMove);
    socket.on('game_reset', onGameReset);

    return () => {
      socket.off('game_move', onGameMove);
      socket.off('game_reset', onGameReset);
    };
  }, [socket, sound]);

  const handleNextRound = () => {
    setMyChoice(null);
    setStrangerChoice(null);
    setRoundWinner(null);
    setRevealing(false);
    setRound((r) => r + 1);
    setStatusMessage('New round! Pick your move!');
    socket?.emit('game_reset', { gameType: 'rps' });
  };

  const getEmoji = (id) => CHOICES.find((c) => c.id === id)?.emoji || '❓';

  return (
    <div className="flex flex-col items-center select-none animate-fade-in w-full max-w-sm">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪨📄✂️</span>
          <h3 className="font-semibold text-dark-100 text-base sm:text-lg">Stone Paper Scissors</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          title="Close Game"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Scoreboard */}
      <div className="flex items-center justify-around w-full py-2 px-4 rounded-xl bg-dark-950/70 border border-dark-800 mb-4 text-xs sm:text-sm font-medium">
        <div className="text-center text-primary-400">
          <div className="text-[10px] text-dark-400 uppercase tracking-wider">You</div>
          <div className="text-xl font-black">{scores.me}</div>
        </div>
        <div className="text-center text-dark-500">
          <div className="text-[10px] uppercase tracking-wider">Round</div>
          <div className="text-sm font-bold text-dark-300">#{round}</div>
        </div>
        <div className="text-center text-blue-400">
          <div className="text-[10px] text-dark-400 uppercase tracking-wider">Stranger</div>
          <div className="text-xl font-black">{scores.stranger}</div>
        </div>
      </div>

      {/* Status banner */}
      <div className={`text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-5 text-center transition-all ${
        roundWinner === 'me'
          ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
          : roundWinner === 'stranger'
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : roundWinner === 'draw'
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : revealing
          ? 'bg-primary-500/20 text-primary-300 animate-bounce'
          : 'bg-dark-800 text-dark-300'
      }`}>
        {statusMessage}
      </div>

      {/* Duel Arena / Showdown View */}
      {(revealing || roundWinner) ? (
        <div className="flex items-center justify-center gap-3 sm:gap-6 my-3 sm:my-4 p-3.5 sm:p-5 rounded-2xl bg-dark-950/80 border border-dark-800 w-full animate-fade-in">
          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs text-primary-400 font-semibold mb-1">YOU</span>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-800/90 border border-primary-500/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
              {revealing ? '✊' : getEmoji(myChoice)}
            </div>
            <span className="text-[11px] sm:text-xs text-dark-400 mt-1.5 font-medium capitalize truncate max-w-[80px]">
              {revealing ? '...' : myChoice}
            </span>
          </div>

          <div className="text-lg sm:text-xl font-bold text-dark-500 italic px-1">VS</div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] sm:text-xs text-blue-400 font-semibold mb-1">STRANGER</span>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-dark-800/90 border border-blue-500/40 flex items-center justify-center text-3xl sm:text-4xl shadow-lg">
              {revealing ? '✊' : getEmoji(strangerChoice)}
            </div>
            <span className="text-[11px] sm:text-xs text-dark-400 mt-1.5 font-medium capitalize truncate max-w-[80px]">
              {revealing ? '...' : strangerChoice}
            </span>
          </div>
        </div>
      ) : (
        /* Move Selection Buttons */
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full my-2">
          {CHOICES.map((choice) => {
            const isSelected = myChoice === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => handlePick(choice.id)}
                disabled={!!myChoice}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-primary-500/20 border-primary-500 scale-105 shadow-lg shadow-primary-500/20'
                    : myChoice
                    ? 'bg-dark-800/40 border-dark-800 opacity-40 cursor-not-allowed'
                    : 'bg-dark-800/80 hover:bg-dark-700/90 border-dark-700 hover:border-primary-500/50 cursor-pointer active:scale-95'
                }`}
              >
                <span className="text-2xl sm:text-4xl mb-1">{choice.emoji}</span>
                <span className="text-[11px] sm:text-xs font-medium text-dark-200 text-center leading-tight">
                  {choice.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Next Round Button */}
      {roundWinner && (
        <button
          onClick={handleNextRound}
          className="mt-4 w-full py-2.5 rounded-xl bg-primary-500 text-dark-900 font-semibold hover:bg-primary-400 active:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 animate-slide-up"
        >
          <RotateCcw className="w-4 h-4" />
          Next Round
        </button>
      )}
    </div>
  );
}
