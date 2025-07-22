import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sensor } from '@repo/models';

export const SensorCard = ({ sensor }: { sensor: Sensor }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{sensor.name}</Text>
      <Text>{sensor.type}</Text>
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
