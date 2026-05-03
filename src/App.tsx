/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Room, Point } from "./types";
import Lobby from "./components/Lobby";
import GameBoard from "./components/GameBoard";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, Terminal } from "lucide-react";

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [username, setUsername] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("CYBER-PUNK");
  const [userColor, setUserColor] = useState("#00f3ff");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(`[SYSTEM] ${msg}`);
    setLogs(prev => [msg, ...prev].slice(0, 5));
  };

  useEffect(() => {
    addLog("System boot initiated...");
    const newSocket = io({
        transports: ['polling'], // Forced polling for maximum mobile compatibility
        reconnectionAttempts: 5,
        timeout: 10000,
    });
    
    setSocket(newSocket);

    newSocket.on("connect", () => {
      addLog("Neural Link SECURE.");
      setIsConnected(true);
      setError(null);
    });

    newSocket.on("disconnect", () => {
      addLog("Neural Link SEVERED.");
      setIsConnected(false);
      setRoom(null);
    });

    newSocket.on("connect_error", (err) => {
      addLog(`LINK ERR: ${err.message}`);
      setError(`Interface Error: ${err.message}`);
    });

    newSocket.on("room-update", (updatedRoom: Room) => {
      setRoom(updatedRoom);
      setIsConnecting(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleJoin = (name: string, roomId: string, color: string) => {
    if (socket && isConnected) {
        setUsername(name);
        setRoomIdInput(roomId);
        setUserColor(color);
        setIsConnecting(true);
        console.log("[CLIENT] Emitting join protocol...");
        socket.emit("join-room", { 
            roomId, 
            username: name, 
            color 
        });
    } else {
        setError("System offline. Cannot initialize link.");
    }
  };

  const handleDirectionChange = (direction: Point) => {
    if (socket && room) {
      socket.emit("change-direction", { roomId: room.id, direction });
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center bg-cyber-black font-orbitron overflow-hidden select-none">
      <div className="cyber-scanline" />
      
      {/* Background Grid */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Header */}
      <header className="h-16 w-full border-b border-cyan-900/50 flex items-center justify-between px-8 bg-black/40 backdrop-blur-md z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 neon-border-cyan flex items-center justify-center rounded-lg bg-black">
            <div className="w-6 h-2 neon-bg-cyan rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-widest neon-text-cyan">
            NEON SERPENT <span className="text-[10px] opacity-50 font-mono">v2.0.4</span>
          </h1>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          {room && (
            <>
              <div className="text-center">
                <div className="text-[10px] uppercase opacity-50 tracking-tighter font-mono">Mesh Node</div>
                <div className="text-sm font-mono text-white">#{room.id.slice(0,8)}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] uppercase opacity-50 tracking-tighter font-mono">Latency</div>
                <div className="text-sm font-mono text-green-400">14ms</div>
              </div>
            </>
          )}
          <div className="px-4 py-1 neon-border-pink bg-pink-900/10 rounded-full text-[10px] font-bold">
            LIVE PROTOCOL
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl flex flex-col items-center justify-center p-4 md:p-8 z-10">
        <AnimatePresence mode="wait">
        {!username ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="z-10"
          >
            <Lobby onJoin={handleJoin} isConnected={isConnected} />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-10 w-full max-w-7xl flex flex-col items-center"
          >
            {room ? (
              <GameBoard 
                room={room} 
                onDirectionChange={handleDirectionChange} 
                myId={socket?.id || ""} 
              />
            ) : (
               <div className="flex flex-col items-center gap-12 mt-20">
                  {error ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-6 text-center"
                    >
                       <div className="w-16 h-16 rounded-lg border-2 border-neon-pink flex items-center justify-center neon-border-pink">
                          <Terminal className="text-neon-pink w-8 h-8 font-bold" />
                       </div>
                       <div className="space-y-2">
                          <p className="text-neon-pink font-bold uppercase tracking-[0.2em]">{error}</p>
                          <p className="text-[10px] text-gray-600 font-mono">CODE: LINK_ERR_{isConnected ? "DATA_TIMEOUT" : "CONNECT_FAIL"}</p>
                       </div>
                       <button 
                        onClick={() => window.location.reload()} 
                        className="px-10 py-3 bg-neon-pink text-white font-bold uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-all"
                       >
                          Retry System Link
                       </button>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-8">
                       <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <Cpu className="text-neon-cyan w-8 h-8 animate-pulse" />
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-3">
                          <p className="font-bold text-neon-cyan animate-pulse tracking-[0.4em] uppercase text-sm">
                              {isConnecting ? "Synchronizing Mesh" : "Establishing Neural Mesh"}
                          </p>
                          <div className="flex gap-2">
                             {[0, 1, 2].map((i) => (
                               <motion.div
                                 key={i}
                                 animate={{ opacity: [0.2, 1, 0.2] }}
                                 transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                 className="w-1 h-1 bg-neon-cyan rounded-full"
                               />
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>

    {/* Persistence Info Footer */}
      <footer className="fixed bottom-0 left-0 w-full px-8 py-2 flex items-center justify-between text-[8px] font-mono border-t border-cyan-900/20 bg-black/80 backdrop-blur-md z-50">
          <div className="flex gap-4 items-center">
              <span className="text-neon-cyan opacity-40">SYSLOG:</span>
              <div className="flex gap-2 text-gray-500 overflow-hidden whitespace-nowrap max-w-[200px]">
                  {logs.map((log, i) => (
                      <span key={i} className={i === 0 ? "text-neon-pink opacity-100" : "opacity-30"}>
                          {log} {i < logs.length - 1 && " // "}
                      </span>
                  ))}
              </div>
          </div>
          <div className="hidden md:block opacity-20">PROTO_V2.0.4 // © 2026 NEON-SYSTEMS</div>
      </footer>
    </div>
  );
}

