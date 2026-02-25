import { File, Paths } from 'expo-file-system';

const todoFile = new File(Paths.document, 'todo.md');

export async function readTodoFile(): Promise<string> {
  if (!todoFile.exists) {
    return '';
  }
  return await todoFile.text();
}

export async function writeTodoFile(content: string): Promise<void> {
  todoFile.write(content);
}

export function getTodoFilePath(): string {
  return todoFile.uri;
}
