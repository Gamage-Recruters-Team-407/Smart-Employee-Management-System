const BASE_URL = 'http://localhost:5000/api';

const API = {
  get: async (url, options = {}) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        ...(!options.responseType && { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${res.status}`);
    }
    
    if (options.responseType === 'blob') {
      const blob = await res.blob();
      return { data: blob };
    }
    
    const data = await res.json();
    return { data };
  },

  post: async (url, body, options = {}) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return { data };
  },

  put: async (url, body, options = {}) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return { data };
  },

  delete: async (url, options = {}) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return { data };
  }
};

export default API;
export { BASE_URL };