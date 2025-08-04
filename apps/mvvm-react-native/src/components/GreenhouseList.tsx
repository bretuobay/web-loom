import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';
import { styles } from '@repo/shared/theme';

export const GreenhouseList = () => {
  const greenHouses = useObservable(greenHouseViewModel.data$);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [cropType, setCropType] = useState('');
  const [editingGreenhouseId, setEditingGreenhouseId] = useState<string | null>(null);

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

  const handleSubmit = () => {
    const data = { name, location, size, cropType };

    if (editingGreenhouseId) {
      greenHouseViewModel.updateCommand.execute({
        id: editingGreenhouseId,
        payload: {
          id: editingGreenhouseId,
          name,
          location,
          size,
          cropType,
        },
      });
      setEditingGreenhouseId(null);
    } else {
      greenHouseViewModel.createCommand.execute(data);
    }

    // Reset form
    setName('');
    setLocation('');
    setSize('');
    setCropType('');
  };

  const handleDelete = (id?: string) => {
    if (!id) {
      console.error('No ID provided for deletion');
      return;
    }
    greenHouseViewModel.deleteCommand.execute(id);
  };

  const handleUpdate = (id?: string) => {
    const greenhouse = greenHouses?.find((gh) => gh.id === id);
    if (!greenhouse) {
      console.error('Greenhouse not found for update:', id);
      return;
    }
    setName(greenhouse.name);
    setLocation(greenhouse.location);
    setSize(greenhouse.size);
    setCropType(greenhouse.cropType || '');
    setEditingGreenhouseId(greenhouse.id || null);
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={[styles.flexApp]}>
        <View style={stylesLocal.flexRow}>
          <View style={styles.formGroup}>
            <TextInput
              style={styles.inputField}
              placeholder="Enter greenhouse name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.inputField}
              placeholder="Location"
              value={location}
              onChangeText={setLocation}
              multiline
            />
            <TextInput style={styles.inputField} placeholder="Size (e.g., 25sqm)" value={size} onChangeText={setSize} />
            <TextInput
              style={styles.inputField}
              placeholder="Enter crop type"
              value={cropType}
              onChangeText={setCropType}
            />
            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
              <Text style={styles.buttonText}>{editingGreenhouseId ? 'Update' : 'Submit'}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={greenHouses}
            keyExtractor={(item) => item.id || ''}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <Text style={{ fontSize: 18 }}>{item.name}</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => handleDelete(item.id)}
                    style={[styles.buttonTiny, styles.buttonTinyDelete]}
                  >
                    <Text style={styles.buttonTinyText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUpdate(item.id)}
                    style={[styles.buttonTiny, styles.buttonTinyEdit]}
                  >
                    <Text style={styles.buttonTinyText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </ScrollView>
  );
};

// styles to flex row and wrap items
const stylesLocal = StyleSheet.create({
  flexRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'space-between',
  },
});
