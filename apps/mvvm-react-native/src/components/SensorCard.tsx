import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

type SensorsCardProps = {
  sensors: any[];
  navigation: any;
};
export const SensorCard = ({ sensors, navigation }: SensorsCardProps) => {
  if (!sensors || sensors.length === 0) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Sensors')}>
      <View style={styles.card}>
        <Text style={styles.title}>Total Sensors</Text>
        <Text>{sensors.length}</Text>
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
