import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { GreenhouseData } from '@repo/view-models/GreenHouseViewModel';

interface GreenhouseCardProps {
  greenHouses: GreenhouseData[] | null;
  navigation: any;
}

export const GreenhouseCard: React.FC<GreenhouseCardProps> = ({ greenHouses, navigation }) => {
  if (!greenHouses) return null;
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Greenhouses')}>
      <Text style={styles.title}>Greenhouses</Text>
      <Text>Total: {greenHouses.length}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
});
