import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SensorViewModel } from '@repo/view-models';
import { useObservable } from '../hooks/useObservable';
import { SensorCard } from './SensorCard';

export const SensorList = () => {
  const sensorViewModel = new SensorViewModel();
  const sensors = useObservable(sensorViewModel.sensors$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sensors</Text>
      <FlatList
        data={sensors}
        renderItem={({ item }) => <SensorCard sensor={item} />}
        keyExtractor={(item) => item.id.toString()}
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
