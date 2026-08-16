(() => {
  const state = { options: null };
  const $ = (selector) => document.querySelector(selector);

  const selectMap = {
    district: 'districts',
    price: 'prices',
    type: 'types',
    area: 'areas'
  };

  const fillSelect = (id, items) => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = items.map((item) => `<option value="${String(item.value ?? '').replace(/"/g, '&quot;')}">${item.label}</option>`).join('');
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  };

  const loadOptions = async (mapping = selectMap) => {
    if (!state.options) {
      const response = await API.get('/api/filter-options');
      state.options = response.data || {};
    }
    Object.entries(mapping).forEach(([id, key]) => fillSelect(id, state.options[key] || []));
    return state.options;
  };

  const values = (prefix = '') => ({
    keyword: ($(prefix ? `${prefix}search` : '#search')?.value || $('#heroSearch')?.value || '').trim(),
    district: $(`${prefix}#district`)?.value || '',
    maxPrice: $(`${prefix}#price`)?.value || '',
    type: $(`${prefix}#type`)?.value || '',
    minArea: $(`${prefix}#area`)?.value || ''
  });

  const toQuery = (valueMap) => {
    const params = new URLSearchParams();
    Object.entries(valueMap || {}).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params;
  };

  const clearHomeFilters = () => {
    ['search', 'heroSearch', 'district', 'price', 'type', 'area'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.value = '';
    });
  };

  window.RoomFilters = { loadOptions, values, toQuery, clearHomeFilters };
})();
