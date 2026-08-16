const API = {
  async request(path, options = {}) {
    const response = await fetch(path, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.message || 'Có lỗi xảy ra');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  },
  get(path) { return this.request(path); },
  post(path, body) { return this.request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }); },
  put(path, body) { return this.request(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }); },
  delete(path) { return this.request(path, { method: 'DELETE' }); }
};
