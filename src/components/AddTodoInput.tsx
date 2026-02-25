import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../lib/theme';

type Props = {
  onAdd: (name: string, dueDate?: string) => void;
};

function formatDueDate(date: Date, includeTime = true): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (!includeTime) {
    return `${year}-${month}-${day}`;
  }
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${mins} ${ampm}`;
}

export default function AddTodoInput({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [pickerStep, setPickerStep] = useState<'closed' | 'date' | 'time'>('closed');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [hasTime, setHasTime] = useState(false);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed, dueDate ? formatDueDate(dueDate, hasTime) : undefined);
    setText('');
    setDueDate(null);
    setHasTime(false);
  };

  const togglePicker = () => {
    if (pickerStep === 'closed') {
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setHasTime(false);
      setPickerStep('date');
    } else {
      setPickerStep('closed');
    }
  };

  const handleDateChange = (_event: unknown, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleTimeChange = (_event: unknown, date?: Date) => {
    if (date) {
      setSelectedTime(date);
      setHasTime(true);
    }
  };

  const handleDone = () => {
    const combined = new Date(selectedDate);
    if (hasTime) {
      combined.setHours(selectedTime.getHours());
      combined.setMinutes(selectedTime.getMinutes());
      combined.setSeconds(0);
      combined.setMilliseconds(0);
    }
    setDueDate(combined);
    setPickerStep('closed');
  };

  const handleCancel = () => {
    setPickerStep('closed');
  };

  const clearDueDate = () => {
    setDueDate(null);
    setHasTime(false);
    setPickerStep('closed');
  };

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.highlightMed }}>
      {pickerStep === 'date' && (
        <View
          className="mx-4 mt-2 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.overlay }}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            onChange={handleDateChange}
            themeVariant="dark"
            accentColor={colors.iris}
            style={{ height: 340 }}
          />
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ borderTopWidth: 1, borderTopColor: colors.highlightMed }}>
            <Pressable onPress={handleCancel}>
              <Text style={{ color: colors.subtle, fontFamily: fonts.regular }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleDone}>
              <Text style={{ color: colors.iris, fontFamily: fonts.semiBold }}>Done</Text>
            </Pressable>
            <Pressable onPress={() => setPickerStep('time')}>
              <Text style={{ color: colors.iris, fontFamily: fonts.semiBold }}>Set Time →</Text>
            </Pressable>
          </View>
        </View>
      )}

      {pickerStep === 'time' && (
        <View
          className="mx-4 mt-2 rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.overlay }}>
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display="spinner"
            onChange={handleTimeChange}
            themeVariant="dark"
            style={{ height: 200 }}
          />
          <View
            className="flex-row items-center justify-between px-4 py-3"
            style={{ borderTopWidth: 1, borderTopColor: colors.highlightMed }}>
            <Pressable onPress={() => setPickerStep('date')}>
              <Text style={{ color: colors.subtle, fontFamily: fonts.regular }}>← Back</Text>
            </Pressable>
            <Pressable onPress={handleDone}>
              <Text style={{ color: colors.iris, fontFamily: fonts.semiBold }}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {dueDate && (
        <View
          className="flex-row items-center rounded-full px-3 py-1.5 mx-4 mt-2 self-start"
          style={{ backgroundColor: colors.surface }}>
          <Text className="text-sm mr-2" style={{ color: colors.text, fontFamily: fonts.regular }}>
            {formatDueDate(dueDate, hasTime)}
          </Text>
          <Pressable onPress={clearDueDate}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </Pressable>
        </View>
      )}

      <View className="flex-row items-center px-4 py-3">
        <TextInput
          className="flex-1 text-base rounded-xl px-4 py-3 mr-2"
          style={{ backgroundColor: colors.overlay, color: colors.text, fontFamily: fonts.regular }}
          placeholder="Add a todo…"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />
        <Pressable
          onPress={togglePicker}
          className="rounded-xl px-3 py-3 mr-2"
          style={{ backgroundColor: colors.surface }}>
          <Ionicons name="calendar-outline" size={20} color={colors.subtle} />
        </Pressable>
        <Pressable onPress={handleSubmit}>
          <LinearGradient
            colors={[colors.iris, colors.foam]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 }}>
            <Text style={{ color: colors.base, fontFamily: fonts.semiBold, fontSize: 16 }}>Add</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
