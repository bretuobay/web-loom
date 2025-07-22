import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { GreenhouseCard } from './GreenhouseCard';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';

export const GreenhouseList = () => {
  const greenhouses = useObservable(greenHouseViewModel.data$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Greenhouses</Text>
      <FlatList
        data={greenhouses}
        renderItem={({ item }) => <GreenhouseCard greenhouse={item} />}
        keyExtractor={(item) => item?.id?.toString() ?? 'unknown'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
});
