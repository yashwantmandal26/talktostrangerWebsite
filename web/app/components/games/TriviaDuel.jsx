'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Timer, RotateCcw, X as CloseIcon } from 'lucide-react';
import { TRIVIA_QUESTIONS, getRandomQuizSet } from '../../data/triviaQuestions';

const QUESTION_TIME = 10; // seconds per question
const TOTAL_QUESTIONS = 5;

export default function TriviaDuel({ socket, isHost, sound, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [strangerAnswered, setStrangerAnswered] = useState(false);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scores, setScores] = useState({ me: 0, stranger: 0 });
  const [gameOver, setGameOver] = useState(false);

  const timerRef = useRef(null);
  const currentQRef = useRef(null);

  // Initialize questions
  useEffect(() => {
    if (isHost) {
      const selected = getRandomQuizSet(TOTAL_QUESTIONS);
      setQuestions(selected);
      // Send question IDs to partner so both get the exact same questions
      socket?.emit('game_move', {
        gameType: 'trivia',
        moveData: { type: 'init_questions', questionIds: selected.map((q) => q.id) },
      });
    }
  }, [isHost, socket]);

  const currentQuestion = questions[currentIndex];
  currentQRef.current = currentQuestion;

  // Countdown timer for active question
  useEffect(() => {
    if (!currentQuestion || isRevealed || gameOver) return;

    setTimer(QUESTION_TIME);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, currentQuestion, isRevealed, gameOver]);

  const handleTimeUp = useCallback(() => {
    if (isRevealed) return;
    setIsRevealed(true);
    sound?.playGameLoss();

    setTimeout(() => {
      advanceQuestion();
    }, 2500);
  }, [isRevealed, sound]);

  const handleSelectOption = (optionIndex) => {
    if (selectedOption !== null || isRevealed) return;
    setSelectedOption(optionIndex);
    sound?.playGameMove();

    const isCorrect = optionIndex === currentQuestion?.answer;
    let earnedPoints = 0;
    if (isCorrect) {
      sound?.playGameWin();
      earnedPoints = timer > 5 ? 15 : 10; // Speed bonus
      setScores((s) => ({ ...s, me: s.me + earnedPoints }));
    } else {
      sound?.playGameLoss();
    }

    setIsRevealed(true);

    socket?.emit('game_move', {
      gameType: 'trivia',
      moveData: {
        type: 'answer',
        questionIndex: currentIndex,
        points: earnedPoints,
        optionIndex,
      },
    });

    setTimeout(() => {
      advanceQuestion();
    }, 2500);
  };

  const advanceQuestion = () => {
    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      setGameOver(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setStrangerAnswered(false);
    setIsRevealed(false);
  };

  // Socket listener
  useEffect(() => {
    if (!socket) return;

    const onGameMove = ({ gameType, moveData }) => {
      if (gameType !== 'trivia' || !moveData) return;

      if (moveData.type === 'init_questions') {
        const loaded = moveData.questionIds
          .map((id) => TRIVIA_QUESTIONS.find((q) => q.id === id))
          .filter(Boolean);
        setQuestions(loaded);
      } else if (moveData.type === 'answer') {
        setStrangerAnswered(true);
        if (moveData.points > 0) {
          setScores((s) => ({ ...s, stranger: s.stranger + moveData.points }));
        }
      }
    };

    const onGameReset = ({ gameType }) => {
      if (gameType !== 'trivia') return;
      if (isHost) {
        const selected = getRandomQuizSet(TOTAL_QUESTIONS);
        setQuestions(selected);
        socket.emit('game_move', {
          gameType: 'trivia',
          moveData: { type: 'init_questions', questionIds: selected.map((q) => q.id) },
        });
      }
      setCurrentIndex(0);
      setSelectedOption(null);
      setStrangerAnswered(false);
      setIsRevealed(false);
      setScores({ me: 0, stranger: 0 });
      setGameOver(false);
    };

    socket.on('game_move', onGameMove);
    socket.on('game_reset', onGameReset);

    return () => {
      socket.off('game_move', onGameMove);
      socket.off('game_reset', onGameReset);
    };
  }, [socket, isHost]);

  const handleRestart = () => {
    if (isHost) {
      const selected = getRandomQuizSet(TOTAL_QUESTIONS);
      setQuestions(selected);
      socket?.emit('game_move', {
        gameType: 'trivia',
        moveData: { type: 'init_questions', questionIds: selected.map((q) => q.id) },
      });
    }
    setCurrentIndex(0);
    setSelectedOption(null);
    setStrangerAnswered(false);
    setIsRevealed(false);
    setScores({ me: 0, stranger: 0 });
    setGameOver(false);
    socket?.emit('game_reset', { gameType: 'trivia' });
  };

  if (!currentQuestion && !gameOver) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-dark-400">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm">Preparing Desi Trivia Duel…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center select-none animate-fade-in w-full max-w-md">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆🎬</span>
          <h3 className="font-semibold text-dark-100 text-base sm:text-lg">Desi Pop Culture Quiz</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
          title="Close Game"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Scoreboard & Progress */}
      <div className="flex items-center justify-between w-full py-2 px-4 rounded-xl bg-dark-950/70 border border-dark-800 mb-4 text-xs sm:text-sm font-medium">
        <div className="text-left text-primary-400">
          <span className="text-[10px] text-dark-400 uppercase tracking-wider block">You</span>
          <span className="text-lg font-bold">{scores.me} pts</span>
        </div>
        <div className="text-center">
          <span className="px-2.5 py-0.5 rounded-full bg-primary-500/10 text-primary-400 text-xs font-semibold">
            Q {currentIndex + 1} / {TOTAL_QUESTIONS}
          </span>
        </div>
        <div className="text-right text-blue-400">
          <span className="text-[10px] text-dark-400 uppercase tracking-wider block">Stranger</span>
          <span className="text-lg font-bold">{scores.stranger} pts</span>
        </div>
      </div>

      {/* Game Over Screen */}
      {gameOver ? (
        <div className="flex flex-col items-center text-center p-6 bg-dark-950/80 rounded-2xl border border-dark-800 w-full animate-slide-up">
          <Trophy className="w-16 h-16 text-primary-500 mb-2 animate-bounce" />
          <h4 className="text-xl font-bold text-dark-50 mb-1">
            {scores.me > scores.stranger
              ? '🎉 Victory! You Won!'
              : scores.me < scores.stranger
              ? 'Stranger Won! Good game!'
              : "It's a Tie! Both are Desi Masters!"}
          </h4>
          <p className="text-xs text-dark-400 mb-6">
            Final Scores: You ({scores.me} pts) — Stranger ({scores.stranger} pts)
          </p>
          <button
            onClick={handleRestart}
            className="w-full py-3 rounded-xl bg-primary-500 text-dark-900 font-semibold hover:bg-primary-400 active:bg-primary-600 transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            Play Another Match
          </button>
        </div>
      ) : (
        /* Active Question Card */
        <div className="w-full">
          {/* Timer bar */}
          <div className="w-full bg-dark-800 rounded-full h-1.5 mb-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timer <= 3 ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{ width: `${(timer / QUESTION_TIME) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-dark-400 mb-2 px-1">
            <span className="px-2 py-0.5 rounded bg-dark-800 text-dark-300 font-medium">
              {currentQuestion.category}
            </span>
            <span className={`flex items-center gap-1 font-semibold ${timer <= 3 ? 'text-red-400 animate-pulse' : 'text-dark-400'}`}>
              <Timer className="w-3.5 h-3.5" />
              {timer}s
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-dark-950/80 border border-dark-800 mb-4 text-center">
            <p className="text-sm sm:text-base font-semibold text-dark-100 leading-snug">
              {currentQuestion.question}
            </p>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 gap-2 w-full">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQuestion.answer;

              let btnStyle = 'bg-dark-800/80 hover:bg-dark-700/80 border-dark-700 text-dark-200';
              if (isRevealed) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-green-500/20 border-green-500 text-green-300 font-bold';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-red-500/20 border-red-500 text-red-300';
                } else {
                  btnStyle = 'bg-dark-800/40 border-dark-800 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={selectedOption !== null || isRevealed}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs sm:text-sm text-left transition-all flex items-center justify-between ${btnStyle} ${
                    !isRevealed ? 'cursor-pointer active:scale-98' : 'cursor-default'
                  }`}
                >
                  <span>{option}</span>
                  {isRevealed && isCorrectAnswer && <span>✓</span>}
                  {isRevealed && isSelected && !isCorrectAnswer && <span>✗</span>}
                </button>
              );
            })}
          </div>

          {/* Stranger status */}
          <div className="mt-3 text-center text-[11px] text-dark-500 italic">
            {strangerAnswered ? 'Stranger has locked in their answer!' : 'Stranger is thinking…'}
          </div>
        </div>
      )}
    </div>
  );
}
