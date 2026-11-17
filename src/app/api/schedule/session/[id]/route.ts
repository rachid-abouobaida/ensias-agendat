import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';

export function generateStaticParams() {
  return [{ id: 'default' }];
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteSession(id);
    if (!success) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
