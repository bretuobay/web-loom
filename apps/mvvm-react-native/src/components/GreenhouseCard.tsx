import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const GreenhouseCard = ({ greenhouse }: { greenhouse: any }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{greenhouse.name}</Text>
      <Text>{greenhouse.location}</Text>
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
