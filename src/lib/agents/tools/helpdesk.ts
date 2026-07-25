import { db } from "@/lib/db";

// Generator sandi acak aman untuk reset password
function generateSecurePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

export const helpdeskTools = {
  /**
   * Mereset sandi karyawan di sistem.
   * Mensimulasikan integrasi Active Directory / LDAP dengan database lokal.
   */
  resetEmployeePassword: async (employeeEmail: string) => {
    console.log(`[Helpdesk Tool] Memulai reset password untuk ${employeeEmail}`);

    const user = await db.user.findUnique({
      where: { email: employeeEmail }
    });

    if (!user) {
      return { success: false, error: `Karyawan dengan email ${employeeEmail} tidak ditemukan.` };
    }

    const tempPassword = generateSecurePassword();
    
    // Di lingkungan nyata, kita akan mengupdate password hash di LDAP/DB,
    // dan mengirimkan sandi mentah via WA/SMS secara privat.
    console.log(`[Helpdesk Tool] Sandi baru untuk ${user.name}: ${tempPassword}`);

    return {
      success: true,
      message: `Berhasil mereset kata sandi untuk ${user.name}. Sandi sementara telah dikirimkan ke nomor HP terdaftar: ${user.phone || "Tidak ada HP"}`
    };
  },

  /**
   * Membuat tiket penugasan servis perangkat fisik ke teknisi manusia (L2 Support).
   */
  dispatchHardwareRepairTicket: async (email: string, hardwareName: string, deskLocation: string) => {
    console.log(`[Helpdesk Tool] Membuat tiket hardware repair: ${hardwareName} untuk ${email}`);

    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: `Karyawan ${email} tidak ditemukan.` };
    }

    // Simulasi pembuatan tiket di database audit log / task log
    const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      success: true,
      ticketId,
      message: `Tiket penugasan ${ticketId} untuk perbaikan ${hardwareName} milik ${user.name} di kubikel ${deskLocation} telah diterbitkan dan dikirim ke Telegram IT Support Level 2 (Human).`
    };
  }
};
