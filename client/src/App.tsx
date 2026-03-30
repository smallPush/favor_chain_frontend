import { useState, SyntheticEvent } from 'react';
import { getKarmaHistory, KarmaResponse } from './api';
import { Search, Hash, Star, Clock, Trophy } from 'lucide-react';
import './App.css';

function App() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KarmaResponse | null>(null);
  const [error, setError] = useState('');

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
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center py-12 px-4 w-full">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 rounded-full mb-2 border border-emerald-500/20">
            <Trophy className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            FavorChain Karma
          </h1>
          <p className="text-slate-400">Rastrea el historial de favores y puntos comunitarios</p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-32 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
            placeholder="Usuario de Telegram (ej. @tu_usuario o ID)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
          <div className="absolute inset-y-2 right-2 flex items-center">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
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
            {/* Total Karma Card */}
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-center relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Hash className="w-32 h-32 transform rotate-12" />
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
                Historial de Favores
              </h2>
              
              {data.favors.length === 0 ? (
                <div className="text-center p-8 border border-slate-700/50 rounded-2xl bg-slate-800/20 text-slate-500">
                  Aún no hay favores registrados
                </div>
              ) : (
                <div className="relative border-l border-slate-700/50 ml-6 space-y-8 pb-4">
                  {data.favors.map((favor, idx) => (
                    <div key={favor.id || idx} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] ring-4 ring-slate-900" />
                      
                      {/* Card */}
                      <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/60 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm text-slate-400 font-medium">
                            {formatDate(favor.created_at)}
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/10 text-emerald-400 font-semibold text-sm border border-emerald-400/20">
                            +{favor.karma_awarded} KP
                          </span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{favor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
