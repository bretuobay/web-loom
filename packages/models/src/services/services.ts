type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface ApiEndpoint {
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
};
