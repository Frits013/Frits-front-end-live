
type Environment = 'development' | 'staging';

const CURRENT_ENV: Environment = 'development'; // Change this line to switch environments

interface EnvironmentConfig {
  apiBaseUrl: string;
  authEndpoint: string;
}

const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    apiBaseUrl: 'https://eqjsrvbisiuysboukgnt.supabase.co/functions/v1',
    authEndpoint: 'https://eqjsrvbisiuysboukgnt.supabase.co/functions/v1/chat/auth/token',
  },
  staging: {
    apiBaseUrl: 'https://preview--frits-conversation-portal.lovable.app',
    authEndpoint: 'https://preview--frits-conversation-portal.lovable.app/auth/token',
  },
};

export const config = environments[CURRENT_ENV];
