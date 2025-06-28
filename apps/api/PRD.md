Here’s a concise Product Requirements Document (PRD) for your IIoT greenhouse monitoring app, designed to support DDD, be scoped appropriately for a book project, and implementable using Express + TypeScript + SQLite + Zod + Sequelize (ORM).

🌿 Product Requirements Document (PRD)

Product Name:

AgroSense

1. Purpose

AgroSense is a lightweight IIoT application for greenhouse farmers to remotely monitor environmental conditions such as temperature, humidity, soil moisture, and light intensity across their greenhouses. The system collects data from sensors in near real-time and visualizes trends via charts and dashboards.

2. Target Users

Small to medium-scale greenhouse farmers

Farm managers and technicians

Agricultural researchers or advisors

3. Goals

Provide a clear dashboard showing real-time sensor data

Notify users of threshold violations (e.g., too hot or too dry)

Track and analyze historical trends

Allow basic management of greenhouses and sensors

4. Key Features (MVP Scope)

A. Greenhouse Management

Add/edit/delete greenhouses

Each greenhouse has:

Name, Location, Size, Crop Type (optional)

B. Sensor Management

Sensors are registered to specific greenhouses

Sensor types:

Temperature

Humidity

Soil Moisture

Light Intensity

Each sensor has:

ID, Type, Status (active/inactive), Greenhouse ID

C. Sensor Data Ingestion

Simulated backend endpoint for posting sensor readings

Each reading includes:

Sensor ID, timestamp, value

D. Dashboard

Real-time view of latest sensor values per greenhouse

Charts showing historical trends (last 24h, 7d)

Table of sensor readings

E. Alerts

Threshold config per sensor type (global or per greenhouse)

Notify (via dashboard only, MVP) when thresholds exceeded

5. Domain Model & Bounded Contexts

Bounded Contexts:

Context

Aggregate Roots

Purpose

Greenhouse

Greenhouse

Manages metadata about greenhouses

Sensor Management

Sensor

Tracks sensor assignments and types

Monitoring

SensorReading

Handles ingestion and query of readings

Alerting

ThresholdAlert

Handles notification rules

Entities & Value Objects (Sample)

Entity: Greenhouse

Properties: id, name, location, size, cropType

Entity: Sensor

Properties: id, type, status, greenhouseId

Value Object: SensorType (e.g., Temperature, Humidity)

Entity: SensorReading

Properties: id, sensorId, timestamp, value

Value Object: Measurement (value + unit)

Entity: ThresholdAlert

Properties: id, sensorType, minValue, maxValue, greenhouseId

Value Object: Range (minValue, maxValue)

6. Technology Stack

Layer

Tech

Backend

Express + TypeScript

Validation

Zod

Database

SQLite

ORM

Sequelize (TypeScript support)

Frontend

To be defined per framework (React/Vue/Svelte) with MVVM structure

7. API Design (Sample)

POST /api/readings

Ingest sensor data

{
sensorId: string;
timestamp: string; // ISO 8601
value: number;
}

GET /api/greenhouses

List all greenhouses

GET /api/greenhouses/:id/readings

Get latest readings grouped by sensor

GET /api/sensors/:id/history?range=24h

Fetch historical data for charting

8. Future Considerations (Not MVP)

User authentication & roles

Real-time WebSocket updates

Mobile app

Export reports (PDF/CSV)

Integration with actual sensor gateways (MQTT, LoRaWAN)

9. Design Justification for Book

MVVM Fit: Each screen (dashboard, greenhouse details, alert list) maps well to a View + ViewModel

DDD Fit: Clear bounded contexts, rich domain logic (e.g., threshold checks, data aggregations)

API Fit: Clean RESTful endpoints with natural aggregates

Complexity: Enough for charts, tables, real-time updates, without overwhelming readers

Would you like me to generate the backend folder structure, Sequelize schema, or a sample feature module to help with the book implementation?
