import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, TouchableOpacity } from 'react-native';
import { useObservable } from '../hooks/useObservable';
import { greenHouseViewModel } from '@repo/view-models/GreenHouseViewModel';

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
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <TextInput style={styles.inputField} placeholder="Enter greenhouse name" value={name} onChangeText={setName} />
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
        <Button title={editingGreenhouseId ? 'Update' : 'Submit'} onPress={handleSubmit} />
      </View>

      <FlatList
        data={greenHouses}
        keyExtractor={(item) => item.id || ''}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={{ fontSize: 18 }}>{item.name}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.button, styles.deleteButton]}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleUpdate(item.id)} style={[styles.button, styles.editButton]}>
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f2f5',
  },
  formContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    marginVertical: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
