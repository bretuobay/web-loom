import React from 'react';
import { View, Text, FlatList, ScrollView } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { sensorViewModel } from '@repo/view-models/SensorViewModel';
import { styles } from '@repo/shared/theme';

export const SensorList = () => {
  const sensors = useObservable(sensorViewModel.data$);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={[styles.flexApp]}>
        <Text style={styles.headerItem}>Sensors</Text>
        <FlatList
          data={sensors}
          renderItem={({ item }) => <SensorCard sensor={item} />}
          keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
        />
      </View>
    </ScrollView>
  );
};

// component to render individual sensor
const SensorCard = ({ sensor }: { sensor: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Location: {sensor.greenhouse.name}</Text>
      <Text style={styles.cardContent}>Type: {sensor.type}</Text>
      <Text style={styles.cardContent}>Status: {sensor.status}</Text>
    </View>
  );
};
