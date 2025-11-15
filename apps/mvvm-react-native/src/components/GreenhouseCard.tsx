import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import type { GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { styles } from '@repo/shared';

interface GreenhouseCardProps {
  greenHouses: GreenhouseData[] | null;
  navigation: any;
}

export const GreenhouseCard: React.FC<GreenhouseCardProps> = ({ greenHouses, navigation }) => {
  if (!greenHouses) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Greenhouses')}>
      <Text style={styles.cardTitle}>Greenhouses</Text>
      <Text style={styles.cardContent}>Total: {greenHouses.length}</Text>
    </TouchableOpacity>
  );
};
