import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThresholdAlert } from '@repo/models';

export const ThresholdAlertCard = ({ thresholdAlert }: { thresholdAlert: ThresholdAlert }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Alert: {thresholdAlert.type}</Text>
      <Text>{thresholdAlert.message}</Text>
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
