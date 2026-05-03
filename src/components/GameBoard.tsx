import React, { useEffect, useRef, useState } from "react";
import { Room, Point, Player, GRID_SIZE } from "../types";
import { motion } from "motion/react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy, Users, Zap } from "lucide-react";

interface GameBoardProps {
  room: Room;
  onDirectionChange: (dir: Point) => void;
  myId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ room, onDirectionChange, myId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          onDirectionChange({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          onDirectionChange({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          onDirectionChange({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          onDirectionChange({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onDirectionChange]);

  // Swipe logic (simple version)
  const touchStart = useRef<Point | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 20) onDirectionChange({ x: dx > 0 ? 1 : -1, y: 0 });
    } else {
        if (Math.abs(dy) > 20) onDirectionChange({ x: 0, y: dy > 0 ? 1 : -1 });
    }
    touchStart.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = Math.min(windowWidth - 40, 500);
    canvas.width = size;
    canvas.height = size;
    const cell = size / GRID_SIZE;

    // Clear
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, size, size);

    // Draw Grid
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(size, i * cell);
      ctx.stroke();
    }

    // Draw Players
    (Object.values(room.players) as Player[]).forEach((player) => {
      if (!player.isAlive) return;

      ctx.fillStyle = player.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = player.color;

      player.snake.forEach((segment, index) => {
        const opacity = index === 0 ? 1 : 1 - (index / player.snake.length) * 0.7;
        ctx.globalAlpha = opacity;
        
        // Draw head differently
        if (index === 0) {
            ctx.fillRect(segment.x * cell + 2, segment.y * cell + 2, cell - 4, cell - 4);
            // Eyes
            ctx.fillStyle = "white";
            ctx.fillRect(segment.x * cell + 4, segment.y * cell + 4, 3, 3);
            ctx.fillRect(segment.x * cell + cell - 7, segment.y * cell + 4, 3, 3);
            ctx.fillStyle = player.color;
        } else {
            ctx.beginPath();
            ctx.roundRect(segment.x * cell + 4, segment.y * cell + 4, cell - 8, cell - 8, 4);
            ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    });

    // Draw Food
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#fff";
    ctx.beginPath();
    ctx.roundRect(room.food.x * cell + cell / 4, room.food.y * cell + cell / 4, cell / 2, cell / 2, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Powerups
    if (room.powerUp) {
        ctx.fillStyle = "#f3ff00";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#f3ff00";
        ctx.beginPath();
        const px = room.powerUp.pos.x * cell + cell / 2;
        const py = room.powerUp.pos.y * cell + cell / 2;
        ctx.arc(px, py, cell / 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

  }, [room, windowWidth]);

  const me = room.players[myId];
  const sortedPlayers = (Object.values(room.players) as Player[]).sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full transition-all">
      {/* Left Aside: Power-ups & Stats */}
      <aside className="hidden xl:flex flex-col gap-4 w-64 h-full shrink-0">
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-900/30 flex-1 min-h-[300px]">
              <h2 className="text-[10px] mb-4 opacity-50 border-b border-cyan-900/30 pb-2 uppercase tracking-[0.2em] font-orbitron">Active Power-ups</h2>
              <div className="space-y-6">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-yellow-400/10 border border-yellow-400/50 flex items-center justify-center text-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                          <Zap size={16} />
                      </div>
                      <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider">Turbo Dash</div>
                          <div className="w-24 h-1 bg-gray-800 rounded-full mt-1 overflow-hidden">
                              <motion.div 
                                initial={{ width: "0%" }}
                                animate={{ width: room.powerUp?.type === "speed" ? "100%" : "0%" }}
                                className="h-full bg-yellow-400 shadow-[0_0_5px_#fbbf24]"
                              />
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-30">
                      <div className="w-10 h-10 rounded bg-blue-400/10 border border-blue-400/50 flex items-center justify-center text-blue-400">
                          <Users size={16} />
                      </div>
                      <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider">Phase Shift</div>
                          <div className="w-24 h-1 bg-gray-800 rounded-full mt-1"></div>
                      </div>
                  </div>
              </div>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-cyan-900/30 h-48 overflow-hidden">
              <h2 className="text-[10px] mb-3 opacity-50 uppercase tracking-[0.2em]">Live Data Feed</h2>
              <div className="font-mono text-[10px] space-y-2 text-cyan-400/60 overflow-y-auto h-full scrollbar-none">
                  {sortedPlayers.map((p, i) => (
                      <div key={p.id} className="flex justify-between border-b border-cyan-900/10 pb-1">
                          <span className="truncate max-w-[100px]">{i+1}. {p.username}</span>
                          <span className="font-bold">{p.score.toLocaleString()}</span>
                      </div>
                  ))}
              </div>
          </div>
      </aside>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col items-center gap-4 w-full">
          {/* Mobile HUD */}
          <div className="xl:hidden w-full flex justify-between items-center bg-black/40 p-3 border border-cyan-900/20 rounded-lg backdrop-blur-sm">
             <div className="flex flex-col">
                 <span className="text-[8px] uppercase tracking-widest opacity-40">Operator</span>
                 <span className="text-xs font-bold text-neon-cyan truncate max-w-[80px]">{me?.username}</span>
             </div>
             <div className="flex flex-col items-end">
                 <span className="text-[8px] uppercase tracking-widest opacity-40">System Yield</span>
                 <span className="text-xl font-black text-white">{me?.score || 0}</span>
             </div>
          </div>

          {/* Canvas Container */}
          <div 
            className="relative neon-border-cyan rounded-2xl overflow-hidden bg-black/80 grid-pattern group"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <canvas 
                ref={canvasRef} 
                className="block"
            />
            
            {me && !me.isAlive && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-6 text-center border-2 border-neon-pink">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="space-y-4"
                    >
                        <h2 className="text-4xl md:text-5xl font-black text-neon-pink uppercase italic tracking-tighter leading-none neon-text-pink">Connection<br/>Severed</h2>
                        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-neon-pink to-transparent my-4" />
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] mb-8">Signal integrity lost. Node recalibrating.</p>
                        <button 
                          onClick={() => window.location.reload()}
                          className="px-12 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-neon-cyan transition-all transform hover:scale-105 active:scale-95"
                        >
                            Re-establish Link
                        </button>
                    </motion.div>
                </div>
            )}

            {/* In-Game HUD Overlays */}
            <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 border-l-4 border-neon-cyan backdrop-blur-sm pointer-events-none">
                <div className="text-[8px] opacity-60 font-mono tracking-widest uppercase">Node Trace</div>
                <div className="text-xl neon-text-cyan font-bold">{me?.score.toLocaleString() || "0"}</div>
            </div>

            <div className="absolute bottom-4 right-4 text-right pointer-events-none opacity-20">
                <div className="text-[8px] font-mono uppercase tracking-[0.5em]">Mesh Grid // {GRID_SIZE}x{GRID_SIZE}</div>
            </div>
          </div>

          {/* Mobile D-Pad */}
          <div className="grid grid-cols-3 gap-2 xl:hidden mt-4">
              <div />
              <button onPointerDown={() => onDirectionChange({x:0, y:-1})} className="w-14 h-14 bg-cyan-900/20 border border-neon-cyan/30 rounded-full flex items-center justify-center text-neon-cyan active:scale-90 transition-transform"><ChevronUp size={24}/></button>
              <div />
              <button onPointerDown={() => onDirectionChange({x:-1, y:0})} className="w-14 h-14 bg-cyan-900/20 border border-neon-cyan/30 rounded-full flex items-center justify-center text-neon-cyan active:scale-90 transition-transform"><ChevronLeft size={24}/></button>
              <button onPointerDown={() => onDirectionChange({x:0, y:1})} className="w-14 h-14 bg-cyan-900/20 border border-neon-cyan/30 rounded-full flex items-center justify-center text-neon-cyan active:scale-90 transition-transform"><ChevronDown size={24}/></button>
              <button onPointerDown={() => onDirectionChange({x:1, y:0})} className="w-14 h-14 bg-cyan-900/20 border border-neon-cyan/30 rounded-full flex items-center justify-center text-neon-cyan active:scale-90 transition-transform"><ChevronRight size={24}/></button>
          </div>
      </div>

      {/* Right Aside: Session Info */}
      <aside className="hidden xl:flex flex-col gap-4 w-64 h-full shrink-0">
          <div className="p-6 rounded-xl bg-black/60 border border-cyan-900/30 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 relative mb-6">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#111" strokeWidth="4"/>
                      <motion.circle 
                        cx="50" cy="50" r="45" 
                        fill="none" 
                        stroke="var(--color-neon-cyan)" 
                        strokeWidth="4" 
                        strokeDasharray="283"
                        animate={{ strokeDashoffset: [283, 0] }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="opacity-50"
                      />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold neon-text-cyan leading-none">AI</span>
                      <span className="text-[8px] opacity-50 uppercase tracking-widest mt-1">Core Engine</span>
                  </div>
              </div>
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold">Network Synced</h3>
              <p className="text-[9px] opacity-40 mt-3 font-mono leading-relaxed px-4">Node communication stable at 30ms jitter. No packet loss in 60s.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 h-32">
              <button className="neon-border-cyan rounded-xl bg-cyan-900/10 flex flex-col items-center justify-center group active:scale-95 transition-all">
                  <span className="text-xl">⌨️</span>
                  <span className="text-[8px] mt-2 opacity-60 tracking-widest font-bold">CONTROLS</span>
              </button>
              <button className="neon-border-pink rounded-xl bg-pink-900/10 flex flex-col items-center justify-center group active:scale-95 transition-all">
                  <span className="text-xl">⚙️</span>
                  <span className="text-[8px] mt-2 opacity-60 tracking-widest font-bold">SETTINGS</span>
              </button>
          </div>
      </aside>

      {/* Persistence Info Footer */}
      <footer className="fixed bottom-0 left-0 w-full h-8 px-8 flex items-center justify-between text-[8px] opacity-30 font-mono border-t border-cyan-900/20 bg-black/60 backdrop-blur-md z-40">
          <div>SERVER: AIS-NODAL-PROTO</div>
          <div>CYBER_SERPENT_CORP // NO SIGNAL LOSS DETECTED</div>
          <div className="hidden md:block">© 2026 NEON-SYSTEMS</div>
      </footer>
    </div>
  );
};

export default GameBoard;
