import React, { useState, useEffect } from 'react';
import { Shield, Hash, Lock, CheckCircle2, RefreshCw, Key, AlertTriangle } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getEventBadge = (eventType: string) => {
    switch (eventType) {
      case 'consent_approved':
        return <span className="bg-[#e8ffd0] text-[#28634f] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">APPROVED</span>;
      case 'consent_revoked':
      case 'key_destroyed':
        return <span className="bg-[#fff0ec] text-[#d95d45] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">REVOKED / KEY SHREDDED</span>;
      case 'duplicate_test_nudge':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">DUPLICATE NUDGE</span>;
      case 'data_accessed':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">DATA ACCESSED</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">{eventType.replace('_', ' ')}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8f6] py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="bg-[#123d3b] text-white p-7 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#bff46d] text-[#123d3b]">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold">Tamper-Proof Audit Trail</h2>
                <span className="bg-white/10 text-[#bff46d] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Append-Only Hash Chain
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">Every scan, consent request, approval, access, and key destruction event is cryptographically hashed.</p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Audit Chain
          </button>
        </div>

        {/* Audit Log Entries List */}
        <div className="bg-white p-6 rounded-3xl border border-[#dfe8e4] shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-[#eef3f1] pb-3 text-xs text-[#647774]">
            <span className="font-extrabold text-[#102b2c]">Cryptographic Verification: SHA-256 Prev-Hash Chaining</span>
            <span>Total Events Logged: {logs.length}</span>
          </div>

          {loading ? (
            <p className="text-xs text-[#8a9997] py-4 text-center">Loading audit log events...</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl bg-[#f8faf9] border border-[#e4ece8] space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-[#177e71]">#{log.id}</span>
                      {getEventBadge(log.event_type)}
                      <span className="font-extrabold text-[#102b2c]">{log.event_type.toUpperCase()}</span>
                    </div>
                    <span className="text-[#8a9997] text-[11px] font-semibold">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 text-[11px] text-[#526765] space-y-1 font-mono">
                    <p>Details: {JSON.stringify(log.detail)}</p>
                    <p className="text-[10px] text-gray-500 truncate">
                      Prev Hash: <span className="text-gray-700">{log.prev_hash}</span>
                    </p>
                    <p className="text-[10px] text-[#177e71] truncate font-bold">
                      Entry Hash: <span>{log.entry_hash}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
