import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { TodoItem } from '../lib/markdown';
import { colors, fonts } from '../lib/theme';

type Props = {
  todo: TodoItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TodoItemRow({ todo, onToggle, onDelete }: Props) {
  const handleLongPress = () => {
    Alert.alert('Delete Todo', `Delete "${todo.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(todo.id) },
    ]);
  };

  return (
    <Pressable onLongPress={handleLongPress}>
      <View
        className="flex-row items-center px-4 py-3.5 mx-4 mb-2 rounded-xl"
        style={{ backgroundColor: colors.surface }}>
        <Pressable
          onPress={() => onToggle(todo.id)}
          hitSlop={8}>
          {todo.done ? (
            <View
              className="w-6 h-6 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.iris }}>
              <Ionicons name="checkmark" size={14} color={colors.base} />
            </View>
          ) : (
            <View
              className="w-6 h-6 rounded-full"
              style={{ borderWidth: 2, borderColor: colors.highlightHigh }} />
          )}
        </Pressable>
        <View className="ml-3 flex-1" style={{ flexShrink: 1 }}>
          <Text
            className={todo.done ? 'text-sm line-through' : 'text-sm'}
            style={{ color: todo.done ? colors.muted : colors.text, fontFamily: fonts.regular }}>
            {todo.name}
          </Text>
          {(todo.dueDate || todo.recurrence) && (
            <View className="flex-row items-center mt-1" style={{ flexWrap: 'wrap' }}>
              {todo.dueDate && (
                <View className="flex-row items-center mr-2">
                  <Ionicons name="calendar-outline" size={11} color={colors.foam} />
                  <Text style={{ color: colors.foam, fontFamily: fonts.regular, fontSize: 11, marginLeft: 3 }}>{todo.dueDate}</Text>
                </View>
              )}
              {todo.recurrence && (
                <View className="flex-row items-center">
                  <Ionicons name="repeat-outline" size={11} color={colors.iris} />
                  <Text style={{ color: colors.iris, fontFamily: fonts.regular, fontSize: 11, marginLeft: 3 }}>{todo.recurrence}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
