'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  ShieldCheck,
  AlertTriangle,
  ArrowRightLeft,
  Wallet,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function FinanceLedgerPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankBalance, setBankBalance] = useState(0);
  const [lockedModal, setLockedModal] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sourcing-matrix'); 
      const data = await res.json();
      if (data.success) {
        const activeDeals = data.deals || [];
        setDeals(activeDeals);
        
        let profit = 0;
        let locked = 0;
        
        activeDeals.forEach((d: any) => {
          if (d.status === 'DP_PAID' || d.status === 'COMPLETED') {
            profit += d.grossProfit;
          }
          if (d.status === 'DP_PAID') {
            locked += d.requiredDpAmt; 
          }
        });
        
        setTotalProfit(profit);
        setLockedModal(locked);
        setBankBalance(15000000 + profit + locked);
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const markDpPaid = async (dealId: string) => {
    try {
      alert(`[SIMULASI KEAMANAN] Notifikasi Mandiri Livin' mendeteksi dana masuk. Status Deal diubah menjadi DP_PAID.`);
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status: 'DP_PAID' } : d));
      fetchLedger();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-full uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Audit Keamanan Rawan
            </span>
            <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              Rekening Pribadi AZIZ
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Financial Ledger & Escrow Monitor
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Pantau arus kas masuk (DP 50%) dari pabrik pembeli dan aliran modal ke supplier produsen secara ketat.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchLedger}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition text-sm border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi Rekening</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <Wallet className="w-24 h-24 text-blue-500" />
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Estimasi Saldo Mandiri AZIZ</h3>
          <p className="text-3xl font-bold text-white mt-2">Rp {bankBalance.toLocaleString()}</p>
          <div className="mt-4 flex items-center text-xs text-blue-400 font-medium">
            <ShieldCheck className="w-4 h-4 mr-1" /> Termasuk Dana Mengendap
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <ArrowRightLeft className="w-24 h-24 text-amber-500" />
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Escrow / Modal Ditahan (DP)</h3>
          <p className="text-3xl font-bold text-amber-400 mt-2">Rp {lockedModal.toLocaleString()}</p>
          <div className="mt-4 flex items-center text-xs text-amber-400/80 font-medium">
            <AlertTriangle className="w-4 h-4 mr-1" /> Harus segera disetor ke Supplier
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
            <DollarSign className="w-24 h-24 text-emerald-500" />
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Profit Bersih Broker (8%)</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2">Rp {totalProfit.toLocaleString()}</p>
          <div className="mt-4 flex items-center text-xs text-emerald-400/80 font-medium">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Dana Bersih Milik Anda
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2 text-indigo-400" />
            Audit Arus Kas Transaksi B2B
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">ID Transaksi / Barang</th>
                <th className="p-4 font-medium">Pembeli (Sumber Dana)</th>
                <th className="p-4 font-medium">Supplier (Tujuan Modal)</th>
                <th className="p-4 font-medium">Nilai Transaksi</th>
                <th className="p-4 font-medium">DP Masuk (50%)</th>
                <th className="p-4 font-medium">Status & Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-800/20 transition group">
                  <td className="p-4">
                    <div className="text-sm font-medium text-white">{deal.sourcingItem?.name || 'Barang Industri'}</div>
                    <div className="text-xs text-slate-500 font-mono mt-1">{deal.id.split('-')[0]}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-300">{deal.buyerName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-300">{deal.supplier?.name || 'Supplier'}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-200">Rp {deal.totalSellingVal?.toLocaleString()}</div>
                    <div className="text-xs text-emerald-400 mt-1">Profit: +Rp {deal.grossProfit?.toLocaleString()}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-amber-400">Rp {deal.requiredDpAmt?.toLocaleString()}</div>
                  </td>
                  <td className="p-4">
                    {deal.status === 'QUOTED' ? (
                      <button 
                        onClick={() => markDpPaid(deal.id)}
                        className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-semibold hover:bg-indigo-600 hover:text-white transition"
                      >
                        Verifikasi DP Masuk
                      </button>
                    ) : deal.status === 'DP_PAID' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Menunggu Setor Supplier
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {deal.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {deals.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    Belum ada transaksi terekam di ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
