// Shared Enums
export type SensorType = 'temperature' | 'humidity' | 'soilMoisture' | 'lightIntensity';

export type SensorStatus = 'active' | 'inactive';

// Greenhouse
export interface CreateGreenhouseDTO {
  name: string;
  location: string;
  size: string;
  cropType?: string;
}

export interface GreenhouseResponseDTO {
  id: number;
  name: string;
  location: string;
  size: string;
  cropType?: string;
}

// Sensor
export interface CreateSensorDTO {
  type: SensorType;
  status: SensorStatus;
  greenhouseId: number;
}

export interface SensorResponseDTO {
  id: number;
  type: SensorType;
  status: SensorStatus;
  greenhouseId: number;
}

// Sensor Reading
export interface CreateSensorReadingDTO {
  sensorId: number;
  timestamp: string; // ISO 8601
  value: number;
}

export interface SensorReadingResponseDTO {
  id: number;
  sensorId: number;
  timestamp: string; // ISO 8601
  value: number;
}

// Threshold Alert
export interface CreateThresholdAlertDTO {
  sensorType: SensorType;
  minValue: number;
  maxValue: number;
  greenhouseId: number;
}

export interface ThresholdAlertResponseDTO {
  id: number;
  sensorType: SensorType;
  minValue: number;
  maxValue: number;
  greenhouseId: number;
}

// Auth
export interface AuthUserDTO {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokenResponseDTO {
  message: string;
  token: string;
  expiresAt: string;
  user: AuthUserDTO;
}

export interface SignUpDTO {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}
