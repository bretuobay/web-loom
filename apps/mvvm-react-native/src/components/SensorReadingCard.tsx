import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SensorReading } from '@repo/models';

export const SensorReadingCard = ({ sensorReading }: { sensorReading: SensorReading }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Reading: {sensorReading.value}</Text>
      <Text>{new Date(sensorReading.timestamp).toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 15,
    marginVertical: 5,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
