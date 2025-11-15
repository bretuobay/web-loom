import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { styles } from '@repo/shared';

type SensorsCardProps = {
  sensors: any[];
  navigation: any;
};
export const SensorCard = ({ sensors, navigation }: SensorsCardProps) => {
  if (!sensors || sensors.length === 0) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Sensors')}>
      <Text style={styles.cardTitle}>Total Sensors</Text>
      <Text style={styles.cardContent}>{sensors.length}</Text>
    </TouchableOpacity>
  );
};
