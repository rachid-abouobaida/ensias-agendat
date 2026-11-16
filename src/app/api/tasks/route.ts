import { NextResponse } from 'next/server';
import { getAllTasks, saveTask } from '@/lib/db';
import { Task } from '@/types';

export async function GET() {
  try {
    const tasks = getAllTasks();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Task;
    if (!body || !body.title || !body.moduleCode) {
      return NextResponse.json(
        { error: 'Titre et module sont obligatoires' },
        { status: 400 }
      );
    }
    const saved = saveTask(body);
    return NextResponse.json({ success: true, task: saved });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
