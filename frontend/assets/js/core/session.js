const Session = {
  current: null,

  async load() {
    try {
      const response = await API.get('/api/auth/me');
      this.current = response.data || null;
      return this.current;
    } catch (error) {
      this.current = null;
      return null;
    }
  },

  isLoggedIn() {
    return Boolean(this.current);
  },

  isTenant() {
    return this.current?.role === 'tenant';
  },

  isLandlord() {
    return this.current?.role === 'landlord';
  }
};
