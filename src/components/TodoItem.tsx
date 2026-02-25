import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TodoItem } from '../lib/markdown';

type Props = {
  todo: TodoItem;
  onToggle: (id: string) => void;
};

export default function TodoItemRow({ todo, onToggle }: Props) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
        <Pressable onPress={() => onToggle(todo.id)}>
          {todo.done ? (
            <View className="w-6 h-6 rounded-full bg-blue-500 items-center justify-center">
              <Text className="text-white text-xs font-bold">✓</Text>
            </View>
          ) : (
            <View className="w-6 h-6 rounded-full border-2 border-zinc-500" />
          )}
        </Pressable>
        <Text
          className={
            todo.done
              ? 'ml-3 text-base text-zinc-500 flex-1 line-through'
              : 'ml-3 text-base text-zinc-100 flex-1'
          }>
          {todo.name}
        </Text>
      </View>
      {(todo.dueDate || todo.recurrence) && (
        <View className="flex-row items-center px-4 pb-2">
          {todo.dueDate && (
            <Text className="text-xs text-zinc-400 ml-9 mt-0.5">
              📅 {todo.dueDate}
            </Text>
          )}
          {todo.recurrence && (
            <Text className="text-xs text-blue-400 ml-2">↻ {todo.recurrence}</Text>
          )}
        </View>
      )}
    </View>
  );
}
