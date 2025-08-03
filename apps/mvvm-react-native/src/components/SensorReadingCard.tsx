import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const SensorReadingCard = ({ sensorReadings, navigation }: { sensorReadings: any[]; navigation: any }) => {
  if (!sensorReadings || sensorReadings.length === 0) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('SensorReadings')}>
      <View style={styles.card}>
        {/* just total stats */}
        <Text style={styles.title}>Total Sensor Readings: {sensorReadings.length}</Text>
      </View>
    </TouchableOpacity>
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
