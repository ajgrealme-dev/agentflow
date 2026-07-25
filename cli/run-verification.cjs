async function main() {
  console.log("Menghubungi API Verifikasi Perkakas AI di http://localhost:3000/api/test-tools...");
  try {
    const res = await fetch("http://localhost:3000/api/test-tools");
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API returned status ${res.status}: ${text}`);
    }
    
    const data = await res.json();
    console.log("\n==========================================");
    console.log("🟢 HASIL VERIFIKASI SELESAI!");
    console.log("==========================================");
    console.log("Pesan:", data.message);
    console.log("\n1. Hasil Purchasing Tool (RFQ PDF):");
    console.log(JSON.stringify(data.results.purchasing, null, 2));
    
    console.log("\n2. Hasil HR Tool (CV Parsing & Obsidian):");
    console.log(JSON.stringify(data.results.hr, null, 2));
    
    console.log("\n3. Hasil Marketing Tool (Multi-Channel Copy & Obsidian):");
    console.log(JSON.stringify(data.results.marketing, null, 2));
    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ Terjadi kesalahan dalam verifikasi:", err.message);
  }
}

main();
