import { useState, useEffect, SyntheticEvent } from 'react';
import { getKarmaHistory, getAiLogs, getRanking, KarmaResponse, AiLog, RankingEntry } from './api';
import { Search, Hash, Star, Clock, Trophy, Terminal, Cpu, Users, Award } from 'lucide-react';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KarmaResponse | null>(null);
  const [error, setError] = useState('');
  
  // State del Monitor de IA y Ranking
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [leaderboard, setLeaderboard] = useState<RankingEntry[]>([]);

  useEffect(() => {
    // Polling cada 2 segundos para obtener los logs en tiempo real
    const fetchData = async () => {
      // Fetch Logs
      try {
        const latestLogs = await getAiLogs();
        setLogs(latestLogs);
      } catch (e) {
        console.error("❌ Error fetching logs:", e);
      }

      // Fetch Ranking
      try {
        const topUsers = await getRanking();
        console.log("🏆 Leaderboard data received:", topUsers);
        setLeaderboard(topUsers);
      } catch (e) {
        console.error("❌ Error fetching ranking:", e);
      }
    };
    
    console.log("🚀 FavorChain App v1.1 - Ranking Enabled");
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await getKarmaHistory(userId);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex py-12 px-4 w-full justify-center">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* LADO IZQUIERDO: Consulta de Karma */}
        <div className="space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-2 border border-emerald-500/20">
              <Trophy className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              FavorChain Karma
            </h1>
            <p className="text-slate-400">Rastrea el historial de favores y puntos comunitarios</p>
          </div>

          {/* Global Leaderboard Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-emerald-400 tracking-widest uppercase">
              <Users className="w-4 h-4" /> Top Contributors
            </h2>
            
            <div className="grid grid-cols-1 gap-3">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-500">Cargando ranking...</p>
              ) : (
                leaderboard.slice(0, 5).map((entry, idx) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800/50 rounded-2xl group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-xs font-bold">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {entry.user_name || `User ${entry.user_id.substring(0, 4)}...`}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono tracking-tighter">ID: {entry.user_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm">
                        {entry.karma} <Star className="w-3 h-3 fill-emerald-400" />
                      </div>
                      <div className="w-20 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500" 
                          style={{ width: `${Math.min(100, (entry.karma / (leaderboard[0]?.karma || 1)) * 100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-32 py-4 bg-slate-900 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              placeholder="Tu ID de Telegram (ej. 12345678)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <div className="absolute inset-y-2 right-2 flex items-center">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50 transform hover:scale-105"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center animate-pulse">
              {error}
            </div>
          )}

          {/* Data Display */}
          {data && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out space-y-8 mt-8">
              <div className="bg-slate-900 rounded-3xl p-8 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)] text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Hash className="w-32 h-32 transform rotate-12 text-emerald-500" />
                </div>
                <p className="text-emerald-400 font-medium mb-2 relative z-10 tracking-widest uppercase text-sm">Karma Acumulado</p>
                <div className="text-7xl font-black text-white flex items-center justify-center gap-3 relative z-10">
                  {data.karma} <Star className="w-10 h-10 text-yellow-400 fill-yellow-400" />
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-slate-200">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  Historial de Acciones
                </h2>
                
                {data.favors.length === 0 ? (
                  <div className="text-center p-8 border border-slate-800 rounded-2xl bg-slate-900/50 text-slate-500">
                    Aún no hay favores registrados para ti.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 ml-6 space-y-8 pb-4">
                    {data.favors.map((favor, idx) => (
                      <div key={favor.id || idx} className="relative pl-8">
                        <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full ring-4 ring-slate-950 ${favor.entry_type === 'BRAIN' ? 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-slate-400 font-medium">
                              {formatDate(favor.created_at)}
                            </span>
                            {favor.entry_type === 'BRAIN' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-bold text-xs border border-purple-500/20">
                                🧠 BRAIN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20">
                                +{favor.karma_awarded} KP
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 leading-relaxed text-sm">{favor.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* LADO DERECHO: Live AI Monitor */}
        <div className="bg-black/90 rounded-3xl border border-blue-500/20 overflow-hidden flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.05)] h-[800px]">
          {/* Terminal Header */}
          <div className="bg-slate-900 border-b border-blue-500/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-blue-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-blue-100 tracking-wider">LIVE OPENROUTER MONITOR</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              <span className="text-xs text-blue-400/80 font-mono tracking-widest uppercase">Streaming</span>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6 font-mono text-sm scrollbar-thin scrollbar-thumb-blue-500/20 scrollbar-track-transparent">
            {logs.length === 0 ? (
              <div className="text-center mt-20 text-blue-500/40 flex flex-col items-center gap-4">
                <Cpu className="w-16 h-16 opacity-50" />
                <p>Esperando mensajes en Telegram para analizar...</p>
              </div>
            ) : (
              logs.map((log) => {
                const outData = JSON.parse(log.output);
                const isFavor = outData.type === 'NECESIDAD';

                return (
                  <div key={log.id} className="animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="flex items-center gap-2 mb-2 text-xs opacity-60 text-blue-300">
                      <span>[{formatDate(log.timestamp)}]</span>
                      <span>--</span>
                      <span>{log.model}</span>
                    </div>
                    
                    <div className="border border-blue-500/20 rounded-lg p-4 bg-blue-950/20 space-y-3">
                      <div>
                        <span className="text-blue-500 font-bold mr-2">INPUT_USR:</span>
                        <span className="text-blue-100">{log.input}</span>
                      </div>
                      
                      <div className="flex items-start">
                        <span className="text-green-500 font-bold mr-2">OUTPUT_AI:</span>
                        <div className="bg-black/50 p-2 rounded w-full border border-green-500/10 mt-1">
                          <code className="text-green-400/90 whitespace-pre-wrap text-xs">
                            {JSON.stringify(outData, null, 2)}
                          </code>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-blue-500/10 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Resultado:</span>
                        <span className={`px-2 py-1 flex items-center gap-1 rounded font-bold ${isFavor ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {isFavor ? '✅ FAVOR IGNITION (+10 KP)' : '🧠 BRAIN STORAGE (No KP)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
