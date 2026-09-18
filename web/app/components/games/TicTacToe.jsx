'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, X as CloseIcon } from 'lucide-react';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6],             // Diagonals
];

export default function TicTacToe({ socket, isHost, sound, onClose }) {
  const mySymbol = isHost ? 'X' : 'O';
  const strangerSymbol = isHost ? 'O' : 'X';

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X'); // X always goes first
  const [winner, setWinner] = useState(null); // 'X' | 'O' | 'draw' | null
  const [winningLine, setWinningLine] = useState(null);
  const [scores, setScores] = useState({ me: 0, stranger: 0, ties: 0 });
  const [statusMessage, setStatusMessage] = useState('');

  const checkWinner = useCallback((currentBoard) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'draw', line: null };
    }
    return null;
  }, []);

  const handleCellClick = (index) => {
    if (board[index] || winner || turn !== mySymbol) return;

    const nextBoard = [...board];
    nextBoard[index] = mySymbol;
    setBoard(nextBoard);
    sound?.playGameMove();

    const result = checkWinner(nextBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === mySymbol) {
        sound?.playGameWin();
        setScores((s) => ({ ...s, me: s.me + 1 }));
      } else if (result.winner === 'draw') {
        setScores((s) => ({ ...s, ties: s.ties + 1 }));
      }
    } else {
      setTurn(strangerSymbol);
    }

    socket?.emit('game_move', {
      gameType: 'tictactoe',
      moveData: { index, symbol: mySymbol },
    });
  };

  const handleReset = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine(null);
    setTurn('X');
    socket?.emit('game_reset', { gameType: 'tictactoe' });
  };

  // Socket listener for stranger moves and reset
  useEffect(() => {
    if (!socket) return;

    const onGameMove = ({ gameType, moveData }) => {
      if (gameType !== 'tictactoe' || !moveData) return;
      const { index, symbol } = moveData;

      setBoard((prev) => {
        const nextBoard = [...prev];
        nextBoard[index] = symbol;
        sound?.playGameMove();

        const result = checkWinner(nextBoard);
        if (result) {
          setWinner(result.winner);
          setWinningLine(result.line);
          if (result.winner === strangerSymbol) {
            sound?.playGameLoss();
            setScores((s) => ({ ...s, stranger: s.stranger + 1 }));
          } else if (result.winner === 'draw') {
            setScores((s) => ({ ...s, ties: s.ties + 1 }));
          }
        } else {
          setTurn(mySymbol);
        }
        return nextBoard;
      });
    };

    const onGameReset = ({ gameType }) => {
      if (gameType !== 'tictactoe') return;
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWinningLine(null);
      setTurn('X');
    };

    socket.on('game_move', onGameMove);
    socket.on('game_reset', onGameReset);

    return () => {
      socket.off('game_move', onGameMove);
      socket.off('game_reset', onGameReset);
    };
  }, [socket, checkWinner, mySymbol, strangerSymbol, sound]);

  // Turn status banner text
  useEffect(() => {
    if (winner) {
      if (winner === mySymbol) {
        setStatusMessage('🎉 You won this round!');
      } else if (winner === strangerSymbol) {
        setStatusMessage('Stranger won this round! Nice try!');
      } else {
        setStatusMessage("It's a draw! Well played both!");
      }
    } else if (turn === mySymbol) {
      setStatusMessage('Your turn! Make a move');
    } else {
      setStatusMessage("Stranger's turn... waiting");
    }
  }, [turn, winner, mySymbol, strangerSymbol]);

  const isMyTurn = turn === mySymbol && !winner;

  return (
    <div className="flex flex-col items-center select-none animate-fade-in">
      {/* Top Controls & Title */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-dark-800 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭕❌</span>
          <h3 className="font-semibold text-dark-100 text-base sm:text-lg">Zero Kaata (Tic-Tac-Toe)</h3>
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
      <div className="flex items-center justify-around w-full max-w-xs py-2 px-3 rounded-xl bg-dark-950/70 border border-dark-800 mb-4 text-xs sm:text-sm font-medium">
        <div className={`text-center ${mySymbol === 'X' ? 'text-primary-400' : 'text-blue-400'}`}>
          <div className="text-[10px] text-dark-400 uppercase tracking-wider">You ({mySymbol})</div>
          <div className="text-lg font-bold">{scores.me}</div>
        </div>
        <div className="text-center text-dark-500">
          <div className="text-[10px] uppercase tracking-wider">Draws</div>
          <div className="text-lg font-bold">{scores.ties}</div>
        </div>
        <div className={`text-center ${strangerSymbol === 'X' ? 'text-primary-400' : 'text-blue-400'}`}>
          <div className="text-[10px] text-dark-400 uppercase tracking-wider">Stranger ({strangerSymbol})</div>
          <div className="text-lg font-bold">{scores.stranger}</div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`text-xs sm:text-sm font-medium px-3 py-1.5 rounded-full mb-4 flex items-center gap-1.5 transition-all ${
        winner === mySymbol
          ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse'
          : winner === strangerSymbol
          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
          : winner === 'draw'
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          : isMyTurn
          ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40 animate-pulse'
          : 'bg-dark-800 text-dark-400'
      }`}>
        {winner && <Trophy className="w-3.5 h-3.5" />}
        <span>{statusMessage}</span>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-64 h-64 sm:w-72 sm:h-72 p-2 bg-dark-950/80 rounded-2xl border border-dark-800 shadow-xl">
        {board.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index);
          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || !!winner || turn !== mySymbol}
              className={`flex items-center justify-center rounded-xl text-3xl sm:text-4xl font-black transition-all duration-150 ${
                isWinningCell
                  ? 'bg-primary-500/30 text-primary-400 border-2 border-primary-500 shadow-lg shadow-primary-500/20 scale-105'
                  : cell
                  ? 'bg-dark-800/90 text-dark-100 cursor-default'
                  : isMyTurn
                  ? 'bg-dark-800/40 hover:bg-dark-700/60 hover:border-primary-500/40 border border-dark-700/50 cursor-pointer active:scale-95'
                  : 'bg-dark-800/30 border border-dark-800 cursor-not-allowed opacity-70'
              }`}
            >
              {cell === 'X' && <span className="text-primary-400">X</span>}
              {cell === 'O' && <span className="text-blue-400">O</span>}
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      {winner && (
        <div className="mt-4 flex gap-2 w-full max-w-xs animate-slide-up">
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-3 rounded-xl bg-primary-500 text-dark-900 font-semibold hover:bg-primary-400 active:bg-primary-600 transition-colors text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-primary-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
