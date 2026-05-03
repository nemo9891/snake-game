import React, { useState } from "react";
import { motion } from "motion/react";
import { Hash, User, Zap } from "lucide-react";

interface LobbyProps {
  onJoin: (username: string, roomId: string, color: string) => void;
  isConnected: boolean;
}

const COLORS = [
  "#00f3ff", // Cyan
  "#ff00ff", // Pink
  "#f3ff00", // Yellow
  "#9d00ff", // Purple
  "#00ff00", // Green
  "#ff4e00", // Orange
];

const Lobby: React.FC<LobbyProps> = ({ onJoin, isConnected }) => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("CYBER-PUNK");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && isConnected) {
      onJoin(username.trim(), roomId.trim().toUpperCase(), selectedColor);
    }
  };

  return (
    <div className="w-full max-w-md bg-black/60 border border-cyan-900/30 p-8 rounded-2xl neon-border-cyan backdrop-blur-xl">
      <div className="flex items-center justify-between mb-8 border-b border-cyan-900/30 pb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-neon-yellow w-5 h-5" />
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white">System initialization</h2>
          </div>
          <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`} />
              <span className="text-[8px] font-mono opacity-50 uppercase">{isConnected ? "Online" : "Offline"}</span>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-[10px] uppercase font-mono text-cyan-400 mb-3 tracking-[0.2em]">
            Identity Auth
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ENTER ID..."
              className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-lg py-4 pl-10 pr-4 text-white focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all font-mono placeholder:text-cyan-900"
              maxLength={12}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-mono text-pink-400 mb-3 tracking-[0.2em]">
            Frequency Band
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/50" />
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-pink-950/10 border border-pink-900/50 rounded-lg py-4 pl-10 pr-4 text-white focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all font-mono uppercase"
              required
            />
          </div>
        </div>

        <div>
            <label className="block text-[10px] uppercase font-mono text-gray-500 mb-3 tracking-[0.2em] text-center">
                Trace Color Signature
            </label>
            <div className="flex justify-center gap-4">
                {COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-sm transition-all transform hover:scale-125 ${
                            selectedColor === color ? "ring-2 ring-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "opacity-30"
                        }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </div>

        <motion.button
          whileHover={isConnected ? { scale: 1.02 } : {}}
          whileTap={isConnected ? { scale: 0.98 } : {}}
          type="submit"
          disabled={!isConnected}
          className={`w-full p-[2px] rounded-lg overflow-hidden group transition-all ${
            isConnected 
              ? "bg-gradient-to-r from-neon-cyan to-neon-pink cursor-pointer" 
              : "bg-gray-800 cursor-not-allowed opacity-50"
          }`}
        >
          <div className={`w-full bg-black py-4 rounded-[6px] flex items-center justify-center gap-3 transition-colors ${
            isConnected ? "group-hover:bg-transparent" : ""
          }`}>
            <span className={`text-sm font-bold uppercase tracking-[0.4em] ${
              isConnected ? "text-white group-hover:text-black" : "text-gray-600"
            }`}>
              {isConnected ? "Boot Link" : "Link Unavailable"}
            </span>
          </div>
        </motion.button>
      </form>
    </div>
  );
};

export default Lobby;
