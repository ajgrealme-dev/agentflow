'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Sparkles, 
  ShoppingBag, 
  RotateCw,
  CheckCircle,
  ShieldCheck,
  Printer,
  FileText,
  X
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

  // Modal State untuk Cetak Quotation PDF
  const [selectedItemForQuotation, setSelectedItemForQuotation] = useState<any>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerCity, setBuyerCity] = useState('Cikande, Serang');
  const [quantity, setQuantity] = useState('500');
  const [bankAccount, setBankAccount] = useState('BCA 1234567890 a.n NAMA ANDA');
  const [showQuotationPreview, setShowQuotationPreview] = useState(false);

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

  // Quotation calculations
  const quoteQty = parseInt(quantity || '1');
  const quoteSellingPrice = selectedItemForQuotation?.sellingPrice || 0;
  const quoteBaseCost = selectedItemForQuotation?.baseCostPrice || 0;
  const quoteTotalVal = quoteQty * quoteSellingPrice;
  const quoteTotalCost = quoteQty * quoteBaseCost;
  const quoteProfit = quoteTotalVal - quoteTotalCost;
  const quoteDpVal = quoteTotalVal * 0.5; // 50% DP Scheme

  const handlePrintQuotation = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Header (Hidden when printing) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-xl print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              B2B Brokerage Engine
            </span>
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-full uppercase tracking-wider">
              Modal Rp 0 (Skema DP 50%)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white mt-2">
            Sourcing Matrix & Auto-Quotation Generator
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Kelola katalog supplier pabrik, margin keuntungan rahasia, dan cetak Surat Penawaran Harga (PDF) otomatis.
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

      {/* Main Content (Hidden when printing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
        {/* Form Tambah Item */}
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
              <span>Daftar Sourcing Matrix & Generator Penawaran</span>
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
                      <th className="py-3 px-4 text-right">Modal (HPP)</th>
                      <th className="py-3 px-4 text-right">Harga Penawaran</th>
                      <th className="py-3 px-4 text-right">Profit Makelar</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {suppliers.flatMap(s => s.sourcingItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-medium text-white">
                          {item.name}
                          <div className="text-xs text-slate-500">{s.name} ({s.city})</div>
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
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedItemForQuotation({ ...item, supplierName: s.name });
                              setShowQuotationPreview(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 text-blue-300 hover:text-white text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1 mx-auto"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Cetak Penawaran</span>
                          </button>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-start space-x-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Skema Keamanan Modal Rp 0 (DP 50% Guarantee)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap Surat Penawaran (Quotation) yang dicetak mencantumkan syarat **DP 50% ke Rekening Bank Pribadi Anda**. Uang DP 50% ini secara matematis selalu cukup untuk melunasi 100% modal awal ke supplier, sehingga Anda tidak mengeluarkan modal sepeser pun.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Preview Surat Penawaran (PDF Printable) */}
      {showQuotationPreview && selectedItemForQuotation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:static">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl p-8 shadow-2xl space-y-6 overflow-y-auto max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
            {/* Modal Controls (Hidden when printing) */}
            <div className="flex justify-between items-center border-b pb-4 print:hidden">
              <span className="font-bold text-slate-700 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>Preview Surat Penawaran Resmi (Quotation PDF)</span>
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePrintQuotation}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center space-x-2 text-sm shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF / Print</span>
                </button>
                <button
                  onClick={() => setShowQuotationPreview(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Configuration Form (Hidden when printing) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs print:hidden">
              <div>
                <label className="font-bold text-slate-600 block mb-1">Nama Pabrik Pembeli Target</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Contoh: PT Nikomas Gemilang"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Jumlah Pesanan (Quantity)</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 block mb-1">Rekening Bank Transfer DP</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* PRINTABLE DOKUMEN RESMI B2B QUOTATION */}
            <div className="border border-slate-200 p-8 rounded-xl space-y-6 font-sans text-slate-800 print:border-none print:p-0">
              <div className="flex justify-between items-start border-b border-slate-300 pb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-wide uppercase">SURAT PENAWARAN HARGA</h2>
                  <p className="text-xs text-slate-500 font-mono">No. Ref: QT/{new Date().getFullYear()}/001</p>
                  <p className="text-xs text-slate-500">Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-lg">MITRA SUPPLY INDUSTRI</div>
                  <div className="text-xs text-slate-600">Penyedia Perlengkapan & Material Industri</div>
                  <div className="text-xs text-slate-500">Serang, Banten • WA: 0812-XXXX-XXXX</div>
                </div>
              </div>

              <div className="text-sm">
                <div className="text-xs text-slate-500 uppercase font-semibold">Kepada Yth:</div>
                <div className="font-bold text-slate-900 text-base">{buyerName || 'Tim Procurement / Purchasing Pabrik'}</div>
                <div className="text-xs text-slate-600">{buyerCity}</div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Dengan hormat, bersama surat ini kami bermaksud menyampaikan penawaran harga resmi untuk kebutuhan material industri perusahaan Anda dengan rincian sebagai berikut:
              </p>

              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-3 border-r border-slate-300">Deskripsi Barang</th>
                    <th className="p-3 text-center border-r border-slate-300">Jumlah</th>
                    <th className="p-3 text-right border-r border-slate-300">Harga Satuan (Rp)</th>
                    <th className="p-3 text-right">Total Harga (Rp)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="p-3 border-r border-slate-200 font-medium">
                      {selectedItemForQuotation.name}
                      <div className="text-[10px] text-slate-500">Kategori: {selectedItemForQuotation.category}</div>
                    </td>
                    <td className="p-3 text-center border-r border-slate-200">{quoteQty} {selectedItemForQuotation.unit}</td>
                    <td className="p-3 text-right border-r border-slate-200 font-mono">Rp {quoteSellingPrice.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold font-mono">Rp {quoteTotalVal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Ketentuan Pembayaran */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                <div className="font-bold text-slate-900 uppercase">Syarat & Ketentuan Pembayaran:</div>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  <li><strong>Down Payment (DP 50%):</strong> Sebesar <strong className="text-emerald-700 font-mono">Rp {quoteDpVal.toLocaleString()}</strong> saat Purchase Order (PO) diterbitkan.</li>
                  <li><strong>Pelunasan (Sisa 50%):</strong> Dibayarkan setelah barang sampai di lokasi pabrik (Cash Against Delivery / CAD).</li>
                  <li><strong>Pengiriman:</strong> Ready Stock / 24 Jam setelah DP dikonfirmasi.</li>
                  <li><strong>Rekening Pembayaran DP:</strong> <span className="font-mono font-bold text-slate-900">{bankAccount}</span></li>
                </ul>
              </div>

              {/* Profit Indicator untuk Makelar (Hidden when printing) */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex justify-between items-center text-xs print:hidden">
                <span className="text-emerald-800 font-medium">Estimasi Profit Bersih Anda dari Transaksi Ini:</span>
                <span className="font-bold text-emerald-700 text-sm font-mono">+Rp {quoteProfit.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-end pt-8 text-xs">
                <div className="text-slate-500">
                  <p>* Surat penawaran ini berlaku selama 14 hari sejak tanggal diterbitkan.</p>
                </div>
                <div className="text-center font-medium">
                  <p>Hormat kami,</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline text-slate-900">MITRA SUPPLY INDUSTRI</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
