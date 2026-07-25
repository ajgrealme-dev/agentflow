import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export const hrTools = {
  /**
   * Mengekstrak informasi penting dari berkas CV pelamar (Resume Parser) dan membandingkannya
   * dengan kebutuhan posisi (job spec) untuk menghitung skor kecocokan kandidat.
   */
  parseResume: async (
    resumeText: string,
    targetPosition?: string,
    requiredSkillsJson?: string,
    minExperienceYears?: number
  ) => {
    console.log(`[HR Tool] Melakukan parsing resume kandidat...`);
    
    // 1. Pemilah sederhana berbasis ekspresi reguler (Regex Parsing)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+62|0)[0-9\-]{9,15}/;

    const emailMatch = resumeText.match(emailRegex);
    const phoneMatch = resumeText.match(phoneRegex);

    const email = emailMatch ? emailMatch[0] : 'Tidak terdeteksi';
    const phone = phoneMatch ? phoneMatch[0] : 'Tidak terdeteksi';

    // Cari nama pelamar (biasanya di baris pertama)
    const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
    const candidateName = lines[0] || 'Kandidat N/A';

    // 2. Daftar keahlian yang terdeteksi
    const skillsList = [
      'React', 'Node.js', 'PostgreSQL', 'Python', 'Tailwind', 'Git', 
      'Accounting', 'Prisma', 'Sales', 'Office', 'Excel', 'Docker',
      'Kubernetes', 'Cybersecurity', 'Figma', 'UI/UX', 'SEO', 'Copywriting'
    ];
    const detectedSkills = skillsList.filter(skill => 
      resumeText.toLowerCase().includes(skill.toLowerCase())
    );

    // Cari tahun pengalaman
    let experienceYears = 1;
    const expMatch = resumeText.match(/(\d+)\s*(tahun|thn|years)\s*(pengalaman|kerja|exp)/i);
    if (expMatch) {
      experienceYears = parseInt(expMatch[1]);
    }

    // 3. Kalkulasi Skor Keselarasan (Compatibility Matching)
    let requiredSkills: string[] = [];
    if (requiredSkillsJson) {
      try {
        requiredSkills = typeof requiredSkillsJson === 'string' ? JSON.parse(requiredSkillsJson) : requiredSkillsJson;
      } catch {
        requiredSkills = requiredSkillsJson.split(',').map(s => s.trim());
      }
    }

    let matchScore = 50; // Skor dasar default jika tidak ada pembanding
    if (requiredSkills.length > 0) {
      const matched = requiredSkills.filter(reqSkill =>
        detectedSkills.some(detSkill => detSkill.toLowerCase() === reqSkill.toLowerCase())
      );
      const skillScore = (matched.length / requiredSkills.length) * 100;
      
      const reqYears = minExperienceYears || 0;
      const expScore = experienceYears >= reqYears ? 100 : (experienceYears / reqYears) * 100;
      
      // Pembobotan: 60% Keahlian, 40% Pengalaman Kerja
      matchScore = Math.round((skillScore * 0.6) + (expScore * 0.4));
    }

    const recommendation = matchScore >= 70 ? '🟢 REKOMENDASI INTERVIEW' : '🔴 TIDAK DISARANKAN';

    // 4. Ekspor Laporan Kerja ke Obsidian Vault (Second Brain)
    try {
      const vaultPath = path.resolve(process.cwd(), 'obsidian-vault');
      const candidatesDir = path.join(vaultPath, 'HR', 'Candidates');
      if (!fs.existsSync(candidatesDir)) {
        fs.mkdirSync(candidatesDir, { recursive: true });
      }

      // Bersihkan nama file agar tidak melanggar keamanan sistem file
      const safeName = candidateName.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
      const filePath = path.join(candidatesDir, `${safeName}.md`);

      // Proteksi Directory Traversal
      const relativePath = path.relative(candidatesDir, filePath);
      if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
        console.warn('[HR Tool Warning] Directory traversal terdeteksi. Ekspor Obsidian dibatalkan.');
      } else {
        const mdContent = `# 📄 Profil Ringkasan Kandidat: ${candidateName}
Tanggal Audit: ${new Date().toLocaleDateString('id-ID')}

## 👤 Informasi Kontak
- **Email:** ${email}
- **No. Telepon:** ${phone}

## 📊 Matriks Keselarasan (Compatibility Metrics)
- **Target Peran/Jabatan:** ${targetPosition || 'Umum'}
- **Skor Keselarasan Total:** **${matchScore}%**
- **Tahun Pengalaman:** ${experienceYears} tahun (Syarat minimum: ${minExperienceYears || 0} tahun)
- **Keahlian Terdeteksi:** ${detectedSkills.join(', ') || 'Tidak ada'}
- **Keahlian yang Dibutuhkan:** ${requiredSkills.join(', ') || 'N/A'}

## 💬 Rekomendasi AI & Status Evaluasi
- **Rekomendasi:** ${recommendation}
- **Catatan:** Kandidat menunjukkan persentase kecocokan ${matchScore}% terhadap persyaratan yang diajukan oleh manager.

---
*Laporan ini dibuat otomatis oleh AI Recruitment Specialist dan diarsipkan di Obsidian Second Brain.*`;

        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`[HR Tool] Laporan kandidat berhasil diekspor ke Obsidian Vault: ${safeName}.md`);
      }
    } catch (vaultErr) {
      console.error('[HR Tool Obsidian Export Error]', vaultErr);
    }

    return {
      success: true,
      candidateName,
      contact: { email, phone },
      skills: detectedSkills,
      experienceYears,
      matchScore,
      recommendation,
      message: `Resume ${candidateName} berhasil di-parse secara otonom. Hasil keselarasan: ${matchScore}%. Rekomendasi: ${recommendation}`
    };
  },

  /**
   * Menjadwalkan slot waktu wawancara untuk kandidat.
   */
  scheduleInterview: async (candidateName: string, time: string) => {
    console.log(`[HR Tool] Menjadwalkan wawancara untuk ${candidateName} pada ${time}`);

    const company = await db.company.findFirst();
    const companyId = company ? company.id : '';

    if (companyId) {
      await db.auditLog.create({
        data: {
          companyId,
          action: 'Jadwalkan Wawancara AI',
          targetId: candidateName,
          details: `Menjadwalkan wawancara otonom untuk pelamar ${candidateName} pada jadwal ${time}`
        }
      });
    }

    const meetCode = `meet.google.com/abc-${Math.floor(100 + Math.random() * 900)}-xyz`;

    return {
      success: true,
      candidateName,
      interviewTime: time,
      googleMeetLink: `https://${meetCode}`,
      message: `Jadwal wawancara dengan ${candidateName} telah tercatat di sistem ERP untuk waktu ${time}. Undangan Google Meet: https://${meetCode}`
    };
  }
};
