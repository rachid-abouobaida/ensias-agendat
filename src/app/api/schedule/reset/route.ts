import { NextResponse } from 'next/server';
import { resetDatabaseFromCsv } from '@/lib/db';

export async function POST() {
  try {
    const db = resetDatabaseFromCsv();
    return NextResponse.json({
      success: true,
      message: 'Base de données réinitialisée avec succès depuis le CSV original',
      sessionsCount: db.sessions.length,
    });
  } catch (error) {
    console.error('Error resetting schedule:', error);
    return NextResponse.json({ error: 'Failed to reset schedule' }, { status: 500 });
  }
}
