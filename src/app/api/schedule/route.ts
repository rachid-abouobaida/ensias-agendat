import { NextResponse } from 'next/server';
import { getAllSessions, saveSession, getSettings, getModuleSummaries } from '@/lib/db';
import { Session } from '@/types';

export async function GET() {
  try {
    const sessions = getAllSessions();
    const settings = getSettings();
    const summaries = getModuleSummaries();
    return NextResponse.json({ sessions, settings, summaries });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Session;
    if (!body || !body.semaine || !body.jour || !body.moduleCode) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }
    const updated = saveSession(body);
    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
