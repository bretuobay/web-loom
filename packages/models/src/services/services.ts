type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
}

interface ApiRegistry {
  greenhouse: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    get: (id: number) => ApiEndpoint;
    delete: (id: number) => ApiEndpoint;
    readings: (id: number) => ApiEndpoint;
  };
  sensor: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    get: (id: number) => ApiEndpoint;
    delete: (id: number) => ApiEndpoint;
    history: (id: number, range?: string) => ApiEndpoint;
  };
  reading: {
    list: ApiEndpoint;
    create: ApiEndpoint;
  };
  alert: {
    list: ApiEndpoint;
    create: ApiEndpoint;
    delete: (id: number) => ApiEndpoint;
  };
  auth: {
    signup: ApiEndpoint;
    signin: ApiEndpoint;
    me: ApiEndpoint;
    changePassword: ApiEndpoint;
    signout: ApiEndpoint;
  };
}

export const apiRegistry: ApiRegistry = {
  greenhouse: {
    list: { method: 'GET', path: '/api/greenhouses' },
    create: { method: 'POST', path: '/api/greenhouses' },
    get: (id) => ({ method: 'GET', path: `/api/greenhouses/${id}` }),
    delete: (id) => ({ method: 'DELETE', path: `/api/greenhouses/${id}` }),
    readings: (id) => ({
      method: 'GET',
      path: `/api/greenhouses/${id}/readings`,
    }),
  },

  sensor: {
    list: { method: 'GET', path: '/api/sensors' },
    create: { method: 'POST', path: '/api/sensors' },
    get: (id) => ({ method: 'GET', path: `/api/sensors/${id}` }),
    delete: (id) => ({ method: 'DELETE', path: `/api/sensors/${id}` }),
    history: (id, range = '24h') => ({
      method: 'GET',
      path: `/api/sensors/${id}/history?range=${range}`,
    }),
  },

  reading: {
    list: { method: 'GET', path: '/api/readings' },
    create: { method: 'POST', path: '/api/readings' },
  },

  alert: {
    list: { method: 'GET', path: '/api/alerts' },
    create: { method: 'POST', path: '/api/alerts' },
    delete: (id) => ({ method: 'DELETE', path: `/api/alerts/${id}` }),
  },
  auth: {
    signup: { method: 'POST', path: '/api/auth/signup' },
    signin: { method: 'POST', path: '/api/auth/signin' },
    me: { method: 'GET', path: '/api/auth/me' },
    changePassword: { method: 'POST', path: '/api/auth/change-password' },
    signout: { method: 'POST', path: '/api/auth/signout' },
  },
};
