import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GreenhouseList } from './src/components/GreenhouseList';
import { SensorList } from './src/components/SensorList';
import { SensorReadingList } from './src/components/SensorReadingList';
import { ThresholdAlertList } from './src/components/ThresholdAlertList';
import Dashboard from './src/components/Dashboard';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Dashboard">
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Greenhouses" component={GreenhouseList} />
        <Stack.Screen name="Sensors" component={SensorList} />
        <Stack.Screen name="SensorReadings" component={SensorReadingList} />
        <Stack.Screen name="ThresholdAlerts" component={ThresholdAlertList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
