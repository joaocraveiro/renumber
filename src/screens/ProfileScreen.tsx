import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Difficulty, useAppContext } from '../context/AppContext';

export const ProfileScreen = () => {
  const { state } = useAppContext();

  const totalsByDifficulty = useMemo(() => {
    const summary: Record<Difficulty, { total: number; success: number }> = {
      Easy: { total: 0, success: 0 },
      Moderate: { total: 0, success: 0 },
      Hard: { total: 0, success: 0 },
      Expert: { total: 0, success: 0 },
    };

    state.tests.forEach((test) => {
      summary[test.difficulty].total += 1;
      summary[test.difficulty].success += test.successRate;
    });

    return summary;
  }, [state.tests]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <Text style={styles.metricLabel}>Total tests completed</Text>
        <Text style={styles.metricValue}>{state.tests.length}</Text>
      </View>
      <Text style={styles.sectionTitle}>Success by difficulty</Text>
      {Object.entries(totalsByDifficulty).map(([difficulty, stats]) => {
        const average = stats.total === 0 ? 0 : Math.round(stats.success / stats.total);
        return (
          <View key={difficulty} style={styles.row}>
            <Text style={styles.rowLabel}>{difficulty}</Text>
            <Text style={styles.rowValue}>{average}%</Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
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
  metricLabel: {
    fontSize: 13,
    color: '#666',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 8,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: '#333',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
