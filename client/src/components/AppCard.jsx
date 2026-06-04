import React, { useState } from 'react';
import { Globe, Settings, Play, Trash2, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';
import { testConnection } from '../utils/appExecutor';

export function AppCard({ app, onStatusChange, onDelete }) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const isConnected = await testConnection(app);
      onStatusChange(app.id, isConnected ? 'connected' : 'error');
    } catch (e) {
      console.error(e);
      onStatusChange(app.id, 'error');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-400" />;
      case 'untested':
      default:
        return <HelpCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Connected
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Error
          </span>
        );
      case 'untested':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            Untested
          </span>
        );
    }
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Background radial glow */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-opacity duration-300 group-hover:opacity-100 opacity-50" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-indigo-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
              {app.name}
            </h3>
            <p className="text-xs text-zinc-500 max-w-[200px] truncate">{app.baseUrl}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(app.status)}
        </div>
      </div>

      <p className="mt-4 text-sm text-zinc-400 min-h-[40px] line-clamp-2">
        {app.description || 'No description provided.'}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-900 pt-4">
        <div>{getStatusBadge(app.status)}</div>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors disabled:opacity-50"
            title="Test Connection"
          >
            {testing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 text-zinc-400" />
            )}
            Test
          </button>
          <button
            onClick={() => onDelete(app.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-900/30 transition-colors"
            title="Delete App"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
