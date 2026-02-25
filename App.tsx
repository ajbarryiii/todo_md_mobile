import './src/global.css';

import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import type { TodoItem, ParsedLine } from './src/lib/markdown';
import { generateId, parseFile, serializeFile } from './src/lib/markdown';
import { readTodoFile, writeTodoFile } from './src/lib/storage';
import TodoItemRow from './src/components/TodoItem';
import AddTodoInput from './src/components/AddTodoInput';

export default function App(): React.JSX.Element {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [lines, setLines] = useState<ParsedLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readTodoFile().then(content => {
      const parsed = parseFile(content);
      setTodos(parsed.todos);
      setLines(parsed.lines);
      setLoaded(true);
    });
  }, []);

  const persist = useCallback(
    (nextLines: ParsedLine[]) => {
      const content = serializeFile(nextLines);
      writeTodoFile(content);
    },
    [],
  );

  const handleToggle = useCallback(
    (id: string) => {
      const nextLines = lines.map(line => {
        if (line.type !== 'todo' || line.todo.id !== id) {
          return line;
        }
        const updated = { ...line.todo, done: !line.todo.done };
        return { type: 'todo' as const, todo: updated };
      });
      const nextTodos = nextLines
        .filter((l): l is Extract<ParsedLine, { type: 'todo' }> => l.type === 'todo')
        .map(l => l.todo);
      setLines(nextLines);
      setTodos(nextTodos);
      persist(nextLines);
    },
    [lines, persist],
  );

  const handleAdd = useCallback(
    (name: string) => {
      const todo: TodoItem = {
        id: generateId(),
        name,
        done: false,
      };
      const newLine: ParsedLine = { type: 'todo', todo };
      const nextLines = [...lines, newLine];
      const nextTodos = [...todos, todo];
      setLines(nextLines);
      setTodos(nextTodos);
      persist(nextLines);
    },
    [lines, todos, persist],
  );

  const activeTodos = todos.filter(t => !t.done);
  const completedTodos = todos.filter(t => t.done);

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950">
        <StatusBar barStyle="light-content" />
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400 text-base">Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar barStyle="light-content" />

      <View className="px-5 pt-4 pb-2">
        <Text className="text-3xl font-bold text-zinc-100">Todos</Text>
        <Text className="text-sm text-zinc-500 mt-1">
          {activeTodos.length} remaining · {completedTodos.length} done
        </Text>
      </View>

      <AddTodoInput onAdd={handleAdd} />

      <FlatList
        data={todos}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TodoItemRow todo={item} onToggle={handleToggle} />
        )}
        className="flex-1"
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-zinc-500 text-base">No todos yet</Text>
            <Text className="text-zinc-600 text-sm mt-1">
              Add one above to get started
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
