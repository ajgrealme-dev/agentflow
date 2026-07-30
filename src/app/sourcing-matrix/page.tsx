'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  RotateCw,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';

export default function SourcingMatrixPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State untuk Tambah Item Baru
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Packaging & Kemasan');
  const [baseCost, setBaseCost] = useState('');
  const [marginPct, setMarginPct] = useState('25');
  const [supplierName, setSupplierName] = useState('');
  const [supplierCity, setSupplierCity] = useState('Tangerang');

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sourcing-matrix');
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
        setDeals(data.deals || []);
      }
    } catch (err) {
      console.error('Error fetching sourcing matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const handleCreateQuickItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !baseCost || !supplierName) return;

    try {
      // 1. Create Supplier First
      const supRes = await fetch('/api/sourcing-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_SUPPLIER',
          supplierName,
          category,
          city: supplierCity,
        }),
      });
      const supData = await supRes.json();

      if (supData.success) {
        // 2. Create Sourcing Item
        await fetch('/api/sourcing-matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE_ITEM',
            supplierId: supData.supplier.id,
            itemName,
            category,
            baseCostPrice: baseCost,
            targetMarginPct: marginPct,
          }),
        });

        setItemName('');
        setBaseCost('');
        setSupplierName('');
        fetchMatrix();
      }
    } catch (err) {
      console.error('Error creating sourcing item:', err);
    }
  };

  const calculatedCost = parseFloat(baseCost || '0');
  const calculatedMargin = parseFloat(marginPct || '25');
  const calculatedSelling = calculatedCost * (1 + calculatedMargin / 100);
  const estimatedProfitPerUnit = calculatedSelling - calculatedCost;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              B2B Brokerage Engine
            </span>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              Modal Rp 0 (DP System)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Sourcing Matrix & Profit Broker AI
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Kelola katalog supplier pabrik, margin keuntungan rahasia, dan kalkulasi uang DP otomatis tanpa modal sendiri.
          </p>
        </div>

        <button 
          onClick={fetchMatrix}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-900/30"
        >
          <RotateCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Quick Add Sourcing Item */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <span>Tambah Barang Sourcing Matrix</span>
          </h2>

          <form onSubmit={handleCreateQuickItem} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nama Pabrik Supplier / Produsen</label>
              <input
                type="text"
                placeholder="Contoh: PT Polychem Kemasan Utama"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nama Barang Industri</label>
              <input
                type="text"
                placeholder="Contoh: Stretch Film 500mm 17mic (Roll)"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kategori Barang</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Packaging & Kemasan">Packaging & Kemasan</option>
                  <option value="APD & K3 Industri">APD & K3 Industri</option>
                  <option value="Sparepart & Mesin">Sparepart & Mesin</option>
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Limbah Industrial">Limbah Industrial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Kota Supplier</label>
                <input
                  type="text"
                  placeholder="Tangerang"
                  value={supplierCity}
                  onChange={(e) => setSupplierCity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Harga Modal HPP (Rp)</label>
                <input
                  type="number"
                  placeholder="10000"
                  value={baseCost}
                  onChange={(e) => setBaseCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Target Margin Broker (%)</label>
                <input
                  type="number"
                  placeholder="25"
                  value={marginPct}
                  onChange={(e) => setMarginPct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Live Profit Preview */}
            {calculatedCost > 0 && (
              <div className="p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Harga Penawaran ke Pembeli:</span>
                  <span className="font-bold text-emerald-400">Rp {calculatedSelling.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Profit Bersih Broker per Unit:</span>
                  <span className="font-bold text-emerald-300">+Rp {estimatedProfitPerUnit.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-900/40"
            >
              Simpan ke Sourcing Matrix
            </button>
          </form>
        </div>

        {/* Matrix Display Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              <span>Daftar Sourcing Matrix & Margin Rahasia</span>
            </h2>

            {suppliers.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Belum ada barang di Sourcing Matrix. Tambahkan barang pertama Anda di sebelah kiri!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Barang</th>
                      <th className="py-3 px-4">Supplier</th>
                      <th className="py-3 px-4 text-right">Modal (HPP)</th>
                      <th className="py-3 px-4 text-right">Penawaran Pembeli</th>
                      <th className="py-3 px-4 text-right">Profit Makelar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {suppliers.flatMap(s => s.sourcingItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-medium text-white">
                          {item.name}
                          <div className="text-xs text-slate-500">{item.category} • MOQ: {item.minOrderQty} {item.unit}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {s.name}
                          <div className="text-xs text-emerald-400/80">{s.city || 'Tangerang'}</div>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400 font-mono">
                          Rp {item.baseCostPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">
                          Rp {item.sellingPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-emerald-300 font-mono font-bold bg-emerald-950/20">
                          +Rp {(item.sellingPrice - item.baseCostPrice).toLocaleString()}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Scheme Info Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start space-x-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Skema Keamanan Modal Rp 0 (DP Guarantee)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap penawaran yang dicetak AgentFlow secara otomatis mencantumkan syarat **DP 30%**. Uang DP yang ditransfer oleh pabrik pembeli secara matematis selalu cukup untuk membayar lunas modal supplier, sehingga Anda tidak perlu mengeluarkan uang pribadi sepeser pun.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
