import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { GreenhouseViewModel } from '@repo/view-models';
import { useObservable } from '../hooks/useObservable';
import { GreenhouseCard } from './GreenhouseCard';

export const GreenhouseList = () => {
  const greenhouseViewModel = new GreenhouseViewModel();
  const greenhouses = useObservable(greenhouseViewModel.greenhouses$);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Greenhouses</Text>
      <FlatList
        data={greenhouses}
        renderItem={({ item }) => <GreenhouseCard greenhouse={item} />}
        keyExtractor={(item) => item.id.toString()}
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
