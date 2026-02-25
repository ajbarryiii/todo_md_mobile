import RNFS from 'react-native-fs';

const TODO_FILE = `${RNFS.DocumentDirectoryPath}/todo.md`;

export async function readTodoFile(): Promise<string> {
  const exists = await RNFS.exists(TODO_FILE);
  if (!exists) {
    return '';
  }
  return RNFS.readFile(TODO_FILE, 'utf8');
}

export async function writeTodoFile(content: string): Promise<void> {
  await RNFS.writeFile(TODO_FILE, content, 'utf8');
}

export function getTodoFilePath(): string {
  return TODO_FILE;
}
