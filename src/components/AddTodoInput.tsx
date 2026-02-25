import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

type Props = {
  onAdd: (name: string) => void;
};

export default function AddTodoInput({ onAdd }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed);
    setText('');
  };

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-zinc-800">
      <TextInput
        className="flex-1 text-base text-zinc-100 bg-zinc-900 rounded-lg px-4 py-3 mr-3"
        placeholder="Add a todo…"
        placeholderTextColor="#71717a"
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
      />
      <Pressable
        onPress={handleSubmit}
        className="bg-blue-500 rounded-lg px-5 py-3">
        <Text className="text-white font-semibold text-base">Add</Text>
      </Pressable>
    </View>
  );
}
