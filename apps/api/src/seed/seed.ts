import { sequelize } from '../models';
import { Greenhouse } from '../models/Greenhouse';
import { Sensor } from '../models/Sensor';
import { SensorReading } from '../models/SensorReading';
import { ThresholdAlert } from '../models/ThresholdAlert';

async function seedGreenhouses(): Promise<Greenhouse[]> {
  console.log('Seeding greenhouses...');
  const greenhouseData = [
    {
      name: 'Alpha Greenhouse',
      location: 'North Field',
      size: '100sqm',
      cropType: 'Tomatoes',
    },
    {
      name: 'Beta Greenhouse',
      location: 'South Field',
      size: '150sqm',
      cropType: 'Cucumbers',
    },
    {
      name: 'Gamma Greenhouse',
      location: 'West Field',
      size: '120sqm',
      cropType: 'Peppers',
    },
  ];
  const createdGreenhouses = await Greenhouse.bulkCreate(greenhouseData);
  console.log(`Greenhouses seeded: ${createdGreenhouses.length}`);
  return createdGreenhouses;
}

async function seedSensors(greenhouses: Greenhouse[]): Promise<Sensor[]> {
  console.log('Seeding sensors...');
  const sensorData: Partial<Sensor>[] = [];

  if (!greenhouses || greenhouses.length === 0) {
    console.log('No greenhouses provided to seed sensors for. Skipping sensor seeding.');
    return [];
  }

  greenhouses.forEach((gh) => {
    sensorData.push(
      { greenhouseId: gh.id, type: 'temperature', status: 'active' },
      { greenhouseId: gh.id, type: 'humidity', status: 'active' },
      { greenhouseId: gh.id, type: 'soilMoisture', status: 'inactive' },
      { greenhouseId: gh.id, type: 'lightIntensity', status: 'active' },
    );
  });

  // Example for Beta greenhouse having one more specific sensor
  const betaGH = greenhouses.find((gh) => gh.name === 'Beta Greenhouse');
  if (betaGH) {
    sensorData.push({
      greenhouseId: betaGH.id,
      type: 'temperature',
      status: 'active',
    });
  }

  const createdSensors = await Sensor.bulkCreate(sensorData);
  console.log(`Sensors seeded: ${createdSensors.length}`);
  return createdSensors;
}

async function seedSensorReadings(sensors: Sensor[]): Promise<void> {
  console.log('Seeding sensor readings...');
  const readingData: Partial<SensorReading>[] = [];

  if (!sensors || sensors.length === 0) {
    console.log('No sensors provided to seed readings for. Skipping sensor reading seeding.');
    return;
  }

  sensors.forEach((sensor) => {
    // Create 5 readings for each sensor
    for (let i = 0; i < 5; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i * 6); // Readings every 6 hours for the past day
      let value: number;
      switch (sensor.type) {
        case 'temperature':
          value = 20 + Math.random() * 10; // Temp between 20-30
          break;
        case 'humidity':
          value = 50 + Math.random() * 20; // Humidity between 50-70%
          break;
        case 'soilMoisture':
          value = 30 + Math.random() * 40; // Soil moisture between 30-70%
          break;
        case 'lightIntensity':
          value = 5000 + Math.random() * 5000; // Light intensity between 5000-10000 lux
          break;
        default:
          value = Math.random() * 100;
      }
      readingData.push({
        sensorId: sensor.id,
        timestamp,
        value: parseFloat(value.toFixed(2)), // Ensure two decimal places
      });
    }
  });
  await SensorReading.bulkCreate(readingData);
  console.log(`Sensor readings seeded: ${readingData.length}`);
}

async function seedThresholdAlerts(greenhouses: Greenhouse[]): Promise<void> {
  console.log('Seeding threshold alerts...');
  const alertData: Partial<ThresholdAlert>[] = [];

  if (!greenhouses || greenhouses.length === 0) {
    console.log('No greenhouses provided to seed alerts for. Skipping threshold alert seeding.');
    return;
  }

  const alphaGH = greenhouses.find((gh) => gh.name === 'Alpha Greenhouse');
  if (alphaGH) {
    alertData.push(
      {
        greenhouseId: alphaGH.id,
        sensorType: 'temperature',
        minValue: 18,
        maxValue: 28,
      },
      {
        greenhouseId: alphaGH.id,
        sensorType: 'humidity',
        minValue: 60,
        maxValue: 75,
      },
    );
  }

  const betaGH = greenhouses.find((gh) => gh.name === 'Beta Greenhouse');
  if (betaGH) {
    alertData.push({
      greenhouseId: betaGH.id,
      sensorType: 'soilMoisture',
      minValue: 35,
      maxValue: 65,
    });
  }

  if (alertData.length > 0) {
    await ThresholdAlert.bulkCreate(alertData);
  }
  console.log(`Threshold alerts seeded: ${alertData.length}`);
}

async function main() {
  console.log('Starting database seeding process...');
  try {
    await sequelize.sync({ force: true });
    console.log('Database synchronized successfully.');

    const createdGreenhouses = await seedGreenhouses();
    const createdSensors = await seedSensors(createdGreenhouses);
    await seedSensorReadings(createdSensors);
    await seedThresholdAlerts(createdGreenhouses); // Alerts are per greenhouse

    console.log('Database seeding completed successfully.');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exitCode = 1; // Indicate failure
  } finally {
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Database connection closed.');
  }
}

main();
