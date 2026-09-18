'use client';

import { useState, useEffect } from 'react';
import { Gamepad2, Minimize2, Maximize2, X, Swords, HelpCircle } from 'lucide-react';
import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import TriviaDuel from './TriviaDuel';

const AVAILABLE_GAMES = [
  {
    id: 'tictactoe',
    name: 'Zero Kaata (Tic-Tac-Toe)',
    icon: '⭕❌',
    desc: 'Classic 3x3 turn-based Indian duel',
    tag: 'Quick & Fun',
  },
  {
    id: 'rps',
    name: 'Stone Paper Scissors',
    icon: '🪨📄✂️',
    desc: 'Secret moves with simultaneous dramatic reveal',
    tag: 'Best of 5',
  },
  {
    id: 'trivia',
    name: 'Desi Quiz Duel',
    icon: '🏆🎬',
    desc: '5 timed Bollywood, Cricket & Desi pop questions',
    tag: 'Knowledge Battle',
  },
];

export default function GameHub({
  socket,
  sound,
  isOpen,
  onClose,
  incomingInvite,
  onClearInvite,
}) {
  const [activeGame, setActiveGame] = useState(null); // 'tictactoe' | 'rps' | 'trivia' | null
  const [isHost, setIsHost] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [pendingSentInvite, setPendingSentInvite] = useState(null);

  // Handle incoming invite responses and game start events
  useEffect(() => {
    if (!socket) return;

    const onGameStart = ({ gameType, hostId }) => {
      setActiveGame(gameType);
      setIsHost(socket.id === hostId);
      setIsMinimized(false);
      setPendingSentInvite(null);
      onClearInvite?.();
      sound?.playMatch();
    };

    const onGameRejected = ({ gameType }) => {
      setPendingSentInvite(null);
      sound?.playDisconnect();
      alert(`Stranger declined your invite to play ${gameType}.`);
    };

    const onGameClose = () => {
      setActiveGame(null);
      setIsMinimized(false);
      setPendingSentInvite(null);
      sound?.playDisconnect();
    };

    socket.on('game_start', onGameStart);
    socket.on('game_rejected', onGameRejected);
    socket.on('game_close', onGameClose);

    return () => {
      socket.off('game_start', onGameStart);
      socket.off('game_rejected', onGameRejected);
      socket.off('game_close', onGameClose);
    };
  }, [socket, sound, onClearInvite]);

  // Send an invite
  const handleSendInvite = (gameId) => {
    setPendingSentInvite(gameId);
    socket?.emit('game_invite', { gameType: gameId });
    sound?.playGameInvite();
  };

  // Accept or decline an incoming invite
  const handleRespondInvite = (accept) => {
    if (!incomingInvite) return;
    socket?.emit('game_response', {
      gameType: incomingInvite.gameType,
      accept,
    });
    if (!accept) {
      onClearInvite?.();
    }
  };

  const handleQuitGame = () => {
    if (activeGame) {
      socket?.emit('game_close', { gameType: activeGame });
    }
    setActiveGame(null);
    setIsMinimized(false);
    onClose?.();
  };

  // 1. Minimized floating pill during active game
  if (activeGame && isMinimized) {
    const gameMeta = AVAILABLE_GAMES.find((g) => g.id === activeGame);
    return (
      <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-dark-900 font-bold shadow-xl shadow-primary-500/30 hover:bg-primary-400 active:scale-95 transition-all cursor-pointer border border-primary-400"
        >
          <span>{gameMeta?.icon || '🎮'}</span>
          <span className="text-xs">Resume {gameMeta?.name}</span>
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Incoming Invite Banner (if game modal is not actively open)
  if (incomingInvite && !activeGame && !isOpen) {
    const gameMeta = AVAILABLE_GAMES.find((g) => g.id === incomingInvite.gameType);
    return (
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md p-3.5 rounded-2xl bg-dark-900/95 border border-primary-500/50 shadow-2xl backdrop-blur-md animate-slide-up">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{gameMeta?.icon || '🎮'}</span>
            <div>
              <div className="text-xs text-primary-400 font-semibold uppercase tracking-wider">Game Challenge!</div>
              <div className="text-sm font-bold text-dark-50">{gameMeta?.name || 'Mini Game'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRespondInvite(false)}
              className="px-3 py-1.5 rounded-lg bg-dark-800 text-dark-300 text-xs font-medium hover:bg-dark-700 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={() => handleRespondInvite(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primary-500 text-dark-900 text-xs font-bold hover:bg-primary-400 active:bg-primary-600 transition-colors shadow-md shadow-primary-500/20"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If not open and no active game, render nothing
  if (!isOpen && !activeGame) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-dark-900 border border-dark-800 rounded-3xl p-5 sm:p-6 shadow-2xl animate-slide-up relative max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* If an active game is currently in session */}
        {activeGame ? (
          <div>
            <div className="flex items-center justify-end gap-2 mb-2">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
                title="Minimize game to chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {activeGame === 'tictactoe' && (
              <TicTacToe socket={socket} isHost={isHost} sound={sound} onClose={handleQuitGame} />
            )}
            {activeGame === 'rps' && (
              <RockPaperScissors socket={socket} sound={sound} onClose={handleQuitGame} />
            )}
            {activeGame === 'trivia' && (
              <TriviaDuel socket={socket} isHost={isHost} sound={sound} onClose={handleQuitGame} />
            )}
          </div>
        ) : (
          /* Game Selection Hub */
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-dark-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary-500/10 text-primary-400">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-dark-50">Play In-Chat Games</h3>
                  <p className="text-xs text-dark-400">Challenge stranger to real-time multiplayer fun</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-dark-400 hover:text-dark-100 hover:bg-dark-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pending Sent Invitation Notice */}
            {pendingSentInvite && (
              <div className="p-3 mb-4 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-between animate-pulse">
                <span className="text-xs text-primary-300 font-medium">
                  Challenge sent! Waiting for stranger to accept…
                </span>
                <button
                  onClick={() => setPendingSentInvite(null)}
                  className="text-xs text-dark-400 hover:text-dark-100 underline"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Game Options List */}
            <div className="space-y-3">
              {AVAILABLE_GAMES.map((game) => (
                <div
                  key={game.id}
                  className="p-4 rounded-2xl bg-dark-800/60 hover:bg-dark-800 border border-dark-700/60 hover:border-primary-500/40 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-3xl">{game.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-dark-100 group-hover:text-primary-300 transition-colors">
                          {game.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-700/60 text-dark-300 font-medium">
                          {game.tag}
                        </span>
                      </div>
                      <p className="text-xs text-dark-400 mt-0.5">{game.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendInvite(game.id)}
                    disabled={!!pendingSentInvite}
                    className="px-3.5 py-2 rounded-xl bg-primary-500 text-dark-900 font-semibold text-xs hover:bg-primary-400 active:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-md shadow-primary-500/10"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Challenge
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3 rounded-xl bg-dark-950/60 border border-dark-800/80 text-[11px] text-dark-400 text-center flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-primary-500" />
              <span>You can minimize the game anytime to keep chatting!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
