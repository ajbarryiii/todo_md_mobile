export type TodoItem = {
  id: string;
  name: string;
  done: boolean;
  dueDate?: string;
  recurrence?: string;
};

export type ParsedLine =
  | { type: 'todo'; todo: TodoItem }
  | { type: 'other'; raw: string };

export type ParsedFile = {
  todos: TodoItem[];
  lines: ParsedLine[];
};

const TODO_RE =
  /^- \[(?<done>[xX_ ])\] (?<name>.+?)(?:\s\(due: (?<due_date>[^)]+)\))?(?:\s\((?:reccurence|recurrence): (?<reccurence>[^)]+)\))?(?:\s\(id: (?<id>[0-9a-fA-F-]{36})\))?\.?$/;

export function parseTodoLine(line: string): TodoItem | null {
  const trimmed = line.trimStart();
  const match = trimmed.match(TODO_RE);
  if (!match || !match.groups) {
    return null;
  }

  const g = match.groups;
  return {
    id: g.id ?? generateId(),
    name: g.name,
    done: g.done === 'x' || g.done === 'X',
    ...(g.due_date ? { dueDate: g.due_date } : {}),
    ...(g.reccurence ? { recurrence: g.reccurence } : {}),
  };
}

export function parseFile(content: string): ParsedFile {
  const rawLines = content.split('\n');
  const todos: TodoItem[] = [];
  const lines: ParsedLine[] = [];

  for (const raw of rawLines) {
    const todo = parseTodoLine(raw);
    if (todo) {
      todos.push(todo);
      lines.push({ type: 'todo', todo });
    } else {
      lines.push({ type: 'other', raw });
    }
  }

  return { todos, lines };
}

export function serializeTodo(todo: TodoItem): string {
  const check = todo.done ? 'x' : '_';
  let line = `- [${check}] ${todo.name}`;
  if (todo.dueDate) {
    line += ` (due: ${todo.dueDate})`;
  }
  if (todo.recurrence) {
    line += ` (reccurence: ${todo.recurrence})`;
  }
  line += ` (id: ${todo.id})`;
  return line;
}

export function serializeFile(lines: ParsedLine[]): string {
  return lines
    .map(line =>
      line.type === 'todo' ? serializeTodo(line.todo) : line.raw,
    )
    .join('\n');
}

export function generateId(): string {
  const hex = () =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${(
    (Math.random() * 4) | 8
  ).toString(16)}${hex().slice(1)}-${hex()}${hex()}${hex()}`;
}
