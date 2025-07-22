import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { SensorReadingCard } from './SensorReadingCard';
import { sensorReadingViewModel } from '@repo/view-models/SensorReadingViewModel';

export const SensorReadingList = () => {
  const sensorReadings = useObservable(sensorReadingViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensor Readings</Text>
      <FlatList
        data={sensorReadings}
        renderItem={({ item }) => <SensorReadingCard sensorReading={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
});
