import { NextResponse } from 'next/server';
import { deleteTask, saveTask, getAllTasks } from '@/lib/db';
import { Task } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<Task>;

    const allTasks = getAllTasks();
    const existing = allTasks.find((t) => t.id === id);

    if (!existing) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }

    const updated = saveTask({
      ...existing,
      ...body,
      id,
    });

    return NextResponse.json({ success: true, task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTask(id);
    if (!success) {
      return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
