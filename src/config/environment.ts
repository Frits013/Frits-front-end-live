
type Environment = 'development' | 'staging';

const CURRENT_ENV: Environment = 'development'; // Change this line to switch environments

interface EnvironmentConfig {
  apiBaseUrl: string;
  authEndpoint: string;
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    apiBaseUrl: 'https://demo-fastapi-app.onrender.com',
    authEndpoint: 'https://demo-fastapi-app.onrender.com/auth/token',
  },
  staging: {
    apiBaseUrl: 'http://localhost:8000',
    authEndpoint: 'http://localhost:8000/auth/token',
  },
};

export const config = environments[CURRENT_ENV];
