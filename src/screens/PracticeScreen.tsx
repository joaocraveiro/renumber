import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Difficulty, TestResult, useAppContext } from '../context/AppContext';

const difficultyConfig: Record<Difficulty, { showTime: number; waitTime: number; digits: [number, number] }> = {
  Easy: { showTime: 4, waitTime: 2, digits: [3, 5] },
  Moderate: { showTime: 3, waitTime: 2, digits: [5, 7] },
  Hard: { showTime: 2, waitTime: 1, digits: [7, 9] },
  Expert: { showTime: 1, waitTime: 1, digits: [9, 12] },
};

const randomNumber = (digits: number) => {
  const max = Math.pow(10, digits);
  const value = Math.floor(Math.random() * max);
  return value.toString().padStart(digits, '0');
};

export const PracticeScreen = () => {
  const { state, addTag, recordTest } = useAppContext();
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [phase, setPhase] = useState<'idle' | 'show' | 'wait' | 'input' | 'review'>('idle');
  const [currentNumber, setCurrentNumber] = useState('');
  const [inputs, setInputs] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Record<number, string>>({});
  const [editInputs, setEditInputs] = useState<Record<number, string>>({});
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const mappedDigits = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => index.toString()).filter(
      (digit) => state.mappings[digit]?.tags.length
    );
  }, [state.mappings]);

  const unlocked = mappedDigits.length === 10;

  const testsLast24h = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return state.tests.filter((test) => new Date(test.date).getTime() >= cutoff).length;
  }, [state.tests]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const schedule = (callback: () => void, delayMs: number) => {
    const timer = setTimeout(callback, delayMs);
    timersRef.current.push(timer);
  };

  const startTest = () => {
    const [minDigits, maxDigits] = difficultyConfig[difficulty].digits;
    const digits = Math.floor(Math.random() * (maxDigits - minDigits + 1)) + minDigits;
    const numberValue = randomNumber(digits);
    setCurrentNumber(numberValue);
    setInputs(Array.from({ length: digits }, () => ''));
    setSelectedTags({});
    setEditInputs({});
    setPhase('show');

    schedule(() => {
      setPhase('wait');
      schedule(() => {
        setPhase('input');
      }, difficultyConfig[difficulty].waitTime * 1000);
    }, difficultyConfig[difficulty].showTime * 1000);
  };

  const handleInputChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) {
      return;
    }
    const nextInputs = [...inputs];
    nextInputs[index] = value;
    setInputs(nextInputs);
    if (nextInputs.every((digit) => digit.length === 1)) {
      setPhase('review');
    }
  };

  const handleSelectTag = (index: number, tagId: string) => {
    setSelectedTags((prev) => ({ ...prev, [index]: tagId }));
  };

  const handleSaveMapping = (index: number, label: string) => {
    const numberValue = currentNumber[index];
    if (!label.trim()) {
      return;
    }
    const tagId = addTag(numberValue, label.trim());
    if (tagId) {
      setSelectedTags((prev) => ({ ...prev, [index]: tagId }));
    }
  };

  const handleFinish = () => {
    const successCount = inputs.filter((digit, index) => digit === currentNumber[index]).length;
    const result: TestResult = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      difficulty,
      successRate: Math.round((successCount / currentNumber.length) * 100),
    };
    const usedTags = Object.entries(selectedTags).map(([index, tagId]) => ({
      numberValue: currentNumber[Number(index)],
      tagId,
      correct: inputs[Number(index)] === currentNumber[Number(index)],
    }));
    recordTest(result, usedTags);
    setPhase('idle');
  };

  const isComplete = phase === 'review' && Object.keys(selectedTags).length === currentNumber.length;

  if (!unlocked) {
    return (
      <View style={styles.lockedContainer}>
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.lockedText}>
          Map the 10 single digits first to unlock practice.
        </Text>
        <Text style={styles.lockedProgress}>{mappedDigits.length}/10 digits mapped</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Practice</Text>
      <Text style={styles.subtitle}>{testsLast24h} tests in the last 24h</Text>
      <View style={styles.difficultyRow}>
        {Object.keys(difficultyConfig).map((level) => (
          <Pressable
            key={level}
            onPress={() => setDifficulty(level as Difficulty)}
            style={[styles.difficultyButton, difficulty === level && styles.difficultyActive]}
          >
            <Text
              style={[
                styles.difficultyText,
                difficulty === level && styles.difficultyTextActive,
              ]}
            >
              {level}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.startButton} onPress={startTest}>
        <Text style={styles.startButtonText}>Start new test</Text>
      </Pressable>

      {phase !== 'idle' && (
        <View style={styles.card}>
          <Text style={styles.phaseLabel}>Current test</Text>
          {phase === 'show' && <Text style={styles.bigNumber}>{currentNumber}</Text>}
          {phase === 'wait' && <Text style={styles.waitText}>Hold that number...</Text>}
          {phase === 'input' && (
            <View style={styles.inputRow}>
              {inputs.map((digit, index) => (
                <TextInput
                  key={`${currentNumber}-${index}`}
                  style={styles.digitInput}
                  value={digit}
                  onChangeText={(value) => handleInputChange(value, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>
          )}
          {phase === 'review' && (
            <View>
              <View style={styles.resultRow}>
                {inputs.map((digit, index) => {
                  const correct = digit === currentNumber[index];
                  return (
                    <Text
                      key={`${currentNumber}-result-${index}`}
                      style={[styles.resultDigit, correct ? styles.correct : styles.incorrect]}
                    >
                      {currentNumber[index]}
                    </Text>
                  );
                })}
              </View>
              <Text style={styles.reviewTitle}>Mappings used</Text>
              {inputs.map((digit, index) => {
                const correct = digit === currentNumber[index];
                const numberValue = currentNumber[index];
                const mapping = state.mappings[numberValue];
                return (
                  <View key={`${currentNumber}-mapping-${index}`} style={styles.mappingBlock}>
                    <Text style={styles.mappingHeader}>
                      Digit {index + 1}: {numberValue} ({correct ? 'correct' : 'wrong'})
                    </Text>
                    {correct ? (
                      mapping?.tags.length ? (
                        <View>
                          {mapping.tags.map((tag) => (
                            <Pressable
                              key={tag.id}
                              onPress={() => handleSelectTag(index, tag.id)}
                              style={[
                                styles.tagSelect,
                                selectedTags[index] === tag.id && styles.tagSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.tagSelectText,
                                  selectedTags[index] === tag.id && styles.tagSelectTextActive,
                                ]}
                              >
                                {tag.label}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noMapping}>No mapping yet.</Text>
                      )
                    ) : (
                      <View style={styles.editMappingRow}>
                        <TextInput
                          placeholder="Edit mapping"
                          style={styles.editInput}
                          value={editInputs[index] ?? ''}
                          onChangeText={(value) =>
                            setEditInputs((prev) => ({ ...prev, [index]: value }))
                          }
                          onSubmitEditing={() => handleSaveMapping(index, editInputs[index] ?? '')}
                        />
                        <Pressable
                          onPress={() => handleSaveMapping(index, editInputs[index] ?? '')}
                          style={styles.editButton}
                        >
                          <Text style={styles.editButtonText}>Save</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
              <View style={styles.chosenRow}>
                <Text style={styles.chosenLabel}>Chosen string:</Text>
                <Text style={styles.chosenValue}>
                  {Object.keys(selectedTags)
                    .sort()
                    .map((key) => {
                      const tagId = selectedTags[Number(key)];
                      const numberValue = currentNumber[Number(key)];
                      const tag = state.mappings[numberValue]?.tags.find((item) => item.id === tagId);
                      return tag?.label || '';
                    })
                    .join(' ')}
                </Text>
              </View>
              {isComplete && (
                <Pressable style={styles.finishButton} onPress={handleFinish}>
                  <Text style={styles.finishButtonText}>Finish test</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
    padding: 16,
  },
  lockedContainer: {
    flex: 1,
    backgroundColor: '#f7f7fb',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginTop: 12,
  },
  lockedProgress: {
    marginTop: 12,
    fontSize: 14,
    color: '#2b6cb0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  difficultyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  difficultyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d0d0dd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  difficultyActive: {
    backgroundColor: '#1a365d',
    borderColor: '#1a365d',
  },
  difficultyText: {
    fontSize: 13,
    color: '#333',
  },
  difficultyTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  startButton: {
    marginTop: 12,
    backgroundColor: '#2b6cb0',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  phaseLabel: {
    fontSize: 12,
    color: '#777',
    marginBottom: 12,
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
  waitText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  digitInput: {
    width: 38,
    height: 46,
    borderWidth: 1,
    borderColor: '#d6d6e4',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  resultDigit: {
    fontSize: 24,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  correct: {
    color: '#2f855a',
  },
  incorrect: {
    color: '#c53030',
  },
  reviewTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  mappingBlock: {
    marginTop: 10,
  },
  mappingHeader: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  tagSelect: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d0dd',
    marginBottom: 6,
  },
  tagSelected: {
    backgroundColor: '#2b6cb0',
    borderColor: '#2b6cb0',
  },
  tagSelectText: {
    fontSize: 13,
    color: '#333',
  },
  tagSelectTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  noMapping: {
    fontSize: 12,
    color: '#777',
  },
  editMappingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d6d6e4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editButton: {
    marginLeft: 8,
    backgroundColor: '#1a365d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  chosenRow: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f3f4f8',
    borderRadius: 10,
  },
  chosenLabel: {
    fontSize: 12,
    color: '#666',
  },
  chosenValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  finishButton: {
    marginTop: 12,
    backgroundColor: '#2f855a',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  finishButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
