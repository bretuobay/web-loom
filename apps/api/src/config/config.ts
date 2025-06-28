import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3700,
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;
