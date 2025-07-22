import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { SensorCard } from './SensorCard';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';

export const SensorList = () => {
  const sensors = useObservable(sensorViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensors</Text>
      <FlatList
        data={sensors}
        renderItem={({ item }) => <SensorCard sensor={item} />}
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
