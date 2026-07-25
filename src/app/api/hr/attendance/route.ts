import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Haversine formula to compute distance in meters between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

// GET: Fetch attendance logs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const userId = searchParams.get('userId');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    const whereClause: any = { companyId };
    if (userId) whereClause.userId = userId;

    const attendanceRecords = await db.absensi.findMany({
      where: whereClause,
      include: {
        user: {
          select: { name: true, divisi: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, records: attendanceRecords });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST: Log attendance (Check-in) with geofencing validation
export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Invalid JSON request body' }, { status: 400 });
    }
    const { companyId, userId, latitude, longitude } = body;

    // Check if companyId and userId are of type string
    if (typeof companyId !== 'string' || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'companyId and userId must be strings' }, { status: 400 });
    }

    // Reject if latitude and longitude are not numbers (e.g. null, boolean, or objects)
    if (typeof latitude !== 'number' && typeof latitude !== 'string') {
      return NextResponse.json({ success: false, error: 'latitude must be a number or string' }, { status: 400 });
    }
    if (typeof longitude !== 'number' && typeof longitude !== 'string') {
      return NextResponse.json({ success: false, error: 'longitude must be a number or string' }, { status: 400 });
    }

    const latNum = parseFloat(latitude as any);
    const lonNum = parseFloat(longitude as any);

    if (isNaN(latNum) || isNaN(lonNum) || latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) {
      return NextResponse.json({ success: false, error: 'Invalid latitude or longitude value' }, { status: 400 });
    }

    // Verify company and fetch office location/radius
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { officeLatitude: true, officeLongitude: true, officeRadius: true }
    });

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // Verify user exists and belongs to the company
    const user = await db.user.findFirst({
      where: { id: userId, companyId }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found in this company' }, { status: 404 });
    }

    let statusKehadiran = 'Ditolak';

    // Perform geofencing calculation if office coordinates are configured
    if (company.officeLatitude !== null && company.officeLongitude !== null) {
      const distance = calculateDistance(
        latNum,
        lonNum,
        company.officeLatitude,
        company.officeLongitude
      );
      const allowedRadius = company.officeRadius ?? 50.0;
      if (distance <= allowedRadius) {
        statusKehadiran = 'Hadir';
      }
    } else {
      // Default fallback if no coordinates configured on company (for backward compatibility / safety)
      statusKehadiran = 'Hadir';
    }

    const record = await db.absensi.create({
      data: {
        companyId,
        userId,
        latitude: latNum,
        longitude: lonNum,
        statusKehadiran
      },
      include: {
        user: { select: { name: true, divisi: true } }
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
