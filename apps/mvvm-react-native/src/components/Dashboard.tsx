import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel, type GreenhouseData } from '@repo/view-models/GreenHouseViewModel';
import { GreenhouseCard } from './GreenhouseCard';

const Dashboard = ({ navigation }: { navigation: any }) => {
  const greenHouses = useObservable(greenHouseViewModel.data$, [] as GreenhouseData[]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await greenHouseViewModel.fetchCommand.execute();
      } catch (error) {
        console.error('Error fetching greenhouses:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <GreenhouseCard greenHouses={greenHouses} navigation={navigation} />
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

export default Dashboard;
