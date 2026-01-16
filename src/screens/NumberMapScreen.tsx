import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { TAG_SUGGESTIONS } from '../data/suggestions';
import { getMappedPercentage, getMappingSuccess, getTagRates, useAppContext } from '../context/AppContext';

const getNumbersByLength = (length: number) => {
  const limit = Math.pow(10, length);
  return Array.from({ length: limit }, (_, index) => index.toString().padStart(length, '0'));
};

const NumberRow = ({ numberValue }: { numberValue: string }) => {
  const { state, addTag } = useAppContext();
  const mapping = state.mappings[numberValue];
  const [inputValue, setInputValue] = useState('');
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  if (!mapping) {
    return null;
  }

  const suggestion = TAG_SUGGESTIONS[suggestionIndex % TAG_SUGGESTIONS.length];
  const maxUsage = Math.max(0, ...mapping.tags.map((tag) => tag.usageCount));

  const handleAddTag = () => {
    const value = inputValue.trim() || suggestion;
    if (!value) {
      return;
    }
    addTag(numberValue, value);
    setInputValue('');
    setSuggestionIndex((index) => index + 1);
  };

  return (
    <View style={styles.numberRow}>
      <View style={styles.numberHeader}>
        <Text style={styles.numberLabel}>{numberValue}</Text>
        <Text style={styles.numberSuccess}>{getMappingSuccess(mapping)}% success</Text>
      </View>
      {mapping.tags.length === 0 ? (
        <Text style={styles.emptyTags}>No tags yet</Text>
      ) : (
        mapping.tags.map((tag) => {
          const rates = getTagRates(tag, maxUsage);
          return (
            <View key={tag.id} style={styles.tagRow}>
              <Text style={styles.tagLabel}>{tag.label}</Text>
              <Text style={styles.tagMeta}>{rates.successRate}% success</Text>
              <Text style={styles.tagMeta}>{rates.usageRate}% usage</Text>
            </View>
          );
        })
      )}
      <View style={styles.inputRow}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Add a tag"
          style={styles.input}
        />
        <Pressable style={styles.addButton} onPress={handleAddTag}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>
      <View style={styles.suggestionRow}>
        <Text style={styles.suggestionLabel}>Suggestion:</Text>
        <Text style={styles.suggestionValue}>{suggestion}</Text>
        <Pressable onPress={() => setSuggestionIndex((index) => index + 1)}>
          <Text style={styles.suggestionButton}>Another</Text>
        </Pressable>
      </View>
    </View>
  );
};

const NumberPanel = ({ length }: { length: number }) => {
  const { state } = useAppContext();
  const numbers = useMemo(() => getNumbersByLength(length), [length]);
  const mappings = numbers.map((value) => state.mappings[value]).filter(Boolean);
  const percentage = getMappedPercentage(mappings);

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{length} digit{length > 1 ? 's' : ''}</Text>
      <Text style={styles.panelSubtitle}>{percentage}% mapped</Text>
      <FlatList
        data={numbers}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <NumberRow numberValue={item} />}
        scrollEnabled={false}
      />
    </View>
  );
};

export const NumberMapScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Number Map</Text>
      <Text style={styles.subtitle}>Build your personal image system.</Text>
      <NumberPanel length={1} />
      <NumberPanel length={2} />
      <NumberPanel length={3} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  panelSubtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
  },
  numberRow: {
    borderTopWidth: 1,
    borderTopColor: '#ececf1',
    paddingTop: 12,
    marginTop: 12,
  },
  numberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  numberLabel: {
    fontSize: 20,
    fontWeight: '600',
  },
  numberSuccess: {
    fontSize: 12,
    color: '#2f855a',
  },
  emptyTags: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f3f4f8',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  tagMeta: {
    fontSize: 11,
    color: '#666',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6d6e4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 8,
    backgroundColor: '#1a365d',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  suggestionLabel: {
    fontSize: 12,
    color: '#555',
    marginRight: 6,
  },
  suggestionValue: {
    fontSize: 12,
    color: '#2b6cb0',
    marginRight: 8,
  },
  suggestionButton: {
    fontSize: 12,
    color: '#2b6cb0',
    fontWeight: '600',
  },
});
