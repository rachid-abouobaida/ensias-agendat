import { NextResponse } from 'next/server';
import { getAllSessions, exportSessionsToCsv } from '@/lib/db';

export async function GET() {
  try {
    const sessions = getAllSessions();
    const csv = exportSessionsToCsv(sessions);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="emploi_du_temps_SDSI_S1_S14.csv"',
      },
    });
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
