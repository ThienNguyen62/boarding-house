(() => {
  const state = { options: null };
  const $ = (selector) => document.querySelector(selector);
  const emit = () => window.dispatchEvent(new CustomEvent('trosmart:filters-changed'));

  const selectMap = {
    filterDistrict: 'districts',
    filterWard: 'wards',
    modalType: 'types',
    modalMinArea: 'areas',
    modalMaxArea: 'max_areas',
    modalFurnishing: 'furnishings',
    modalGender: 'genders',
    modalAmenity: 'amenities_options',
    modalPrivateToilet: 'boolean_options',
    modalBalcony: 'boolean_options',
    modalParking: 'boolean_options',
    modalSort: 'sorts',
  };

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));

  const fillSelect = (id, items) => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = (items || []).map((item) => `<option value="${escapeHtml(item.value ?? '')}">${escapeHtml(item.label ?? '')}</option>`).join('');
    if ([...select.options].some((option) => option.value === current)) select.value = current;
  };

  const loadOptions = async () => {
    if (!state.options) {
      const response = await API.get('/api/filter-options');
      state.options = response.data || {};
    }
    Object.entries(selectMap).forEach(([id, key]) => fillSelect(id, state.options[key] || []));
    return state.options;
  };

  const priceRanges = [
    { value: '', label: 'Khoảng giá' },
    { value: '0:1000000', label: '< 1 triệu' },
    { value: '1000000:3000000', label: '1 – 3 triệu' },
    { value: '3000000:5000000', label: '3 – 5 triệu' },
    { value: '5000000:10000000', label: '5 – 10 triệu' },
    { value: '10000000:', label: '> 10 triệu' },
  ];

  const radiusOptions = [
    { value: '0.5', label: '500 m' },
    { value: '1', label: '1 km' },
    { value: '2', label: '2 km' },
    { value: '3', label: '3 km' },
    { value: '5', label: '5 km' },
  ];

  const fixedLocations = () => state.options?.fixed_locations || [];

  const selectedNearbyLabel = () => {
    const id = $('#filterSearchPlaceState')?.value || '';
    const radius = $('#filterRadiusState')?.value || '';
    const place = fixedLocations().find((item) => item.id === id);
    if (!place) return 'Tìm kiếm quanh bạn';
    const radiusLabel = radiusOptions.find((item) => item.value === radius)?.label || `${radius} km`;
    return `${place.short_label || place.label} · ${radiusLabel}`;
  };

  const populateSelects = () => {
    fillSelect('filterDistrict', state.options.districts || []);
    fillSelect('filterWard', state.options.wards || []);
  };

  const ensureHiddenState = () => {
    if (!$('#filterTypeState')) document.body.insertAdjacentHTML('beforeend', `<div aria-hidden="true" class="filter-state-holder">
      <input id="filterTypeState"><input id="filterMinAreaState"><input id="filterMaxAreaState">
      <input id="filterFurnishingState"><input id="filterGenderState"><input id="filterAmenityState">
      <input id="filterPrivateToiletState"><input id="filterBalconyState"><input id="filterParkingState">
      <input id="filterSortState" value="newest"><input id="filterMinPrice"><input id="filterMaxPrice"><input id="filterSearchPlaceState"><input id="filterRadiusState">
    </div>`);
    if (!$('#filterSortState').value) $('#filterSortState').value = 'newest';
  };

  const setSelectValue = (id, value) => {
    const el = $('#' + id);
    if (!el) return;
    el.value = value ?? '';
  };

  const syncPriceQuick = () => {
    // Price quick-control is a button; its label is rendered by syncSummary().
  };

  const syncStateFromControls = () => {
    ensureHiddenState();
    const ids = ['modalType','modalMinArea','modalMaxArea','modalFurnishing','modalGender','modalAmenity','modalPrivateToilet','modalBalcony','modalParking','modalSort'];
    ids.forEach((id) => {
      const source = $('#' + id);
      const target = $('#filter' + id.replace(/^modal/, '').replace(/^([A-Z])/, (_, c) => c) + 'State');
      if (source && target) target.value = source.value || '';
    });
  };

  const createPriceModal = () => {
    if ($('#priceFilterModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="priceFilterModal" class="price-filter-overlay" hidden>
        <div class="price-filter-modal" role="dialog" aria-modal="true" aria-labelledby="priceFilterTitle">
          <div class="price-filter-head"><h3 id="priceFilterTitle">Khoảng giá</h3><button type="button" id="closePriceFilter" aria-label="Đóng">×</button></div>
          <div class="price-range-fields">
            <label>Giá thấp nhất<input id="priceMinInput" inputmode="numeric" placeholder="Từ"></label>
            <span>→</span>
            <label>Giá cao nhất<input id="priceMaxInput" inputmode="numeric" placeholder="Đến"></label>
          </div>
          <div class="price-presets" id="pricePresetList"></div>
          <div class="price-filter-actions"><button type="button" class="btn outline" id="resetPriceFilter">Đặt lại</button><button type="button" class="btn primary" id="applyPriceFilter">Áp dụng</button></div>
        </div>
      </div>`);
    const overlay = $('#priceFilterModal');
    const close = () => { overlay.hidden = true; };
    $('#closePriceFilter').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    $('#resetPriceFilter').addEventListener('click', () => { $('#priceMinInput').value=''; $('#priceMaxInput').value=''; });
    $('#applyPriceFilter').addEventListener('click', () => {
      $('#filterMinPrice').value = ($('#priceMinInput').value || '').replace(/[^0-9]/g, '');
      $('#filterMaxPrice').value = ($('#priceMaxInput').value || '').replace(/[^0-9]/g, '');
      syncPriceQuick();
      close();
      syncSummary();
      emit();
    });
  };

  const syncPriceModal = () => {
    createPriceModal();
    $('#priceMinInput').value = $('#filterMinPrice')?.value || '';
    $('#priceMaxInput').value = $('#filterMaxPrice')?.value || '';
    const list = $('#pricePresetList');
    const current = `${$('#filterMinPrice')?.value || ''}:${$('#filterMaxPrice')?.value || ''}`;
    list.innerHTML = priceRanges.filter((x) => x.value).map((item) => `
      <button type="button" class="price-preset ${item.value === current ? 'active' : ''}" data-range="${escapeHtml(item.value)}">
        <span>${escapeHtml(item.label)}</span><i>○</i>
      </button>`).join('');
    list.querySelectorAll('.price-preset').forEach((btn) => btn.addEventListener('click', () => {
      const [min, max] = btn.dataset.range.split(':');
      $('#priceMinInput').value = min || '';
      $('#priceMaxInput').value = max || '';
      list.querySelectorAll('.price-preset').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    }));
  };

  const ensureNearbyModal = () => {
    if ($('#nearbyFilterModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="nearbyFilterModal" class="nearby-filter-overlay" hidden>
        <div class="nearby-filter-modal" role="dialog" aria-modal="true" aria-labelledby="nearbyFilterTitle">
          <div class="nearby-filter-head">
            <div><small>TÌM KIẾM THEO VỊ TRÍ</small><h3 id="nearbyFilterTitle">Tìm kiếm quanh bạn</h3><p>Chọn một địa điểm cố định và bán kính. Điều kiện này sẽ kết hợp <b>AND</b> với toàn bộ bộ lọc khác.</p></div>
            <button type="button" id="closeNearbyFilter" class="advanced-filter-close" aria-label="Đóng">×</button>
          </div>
          <div class="nearby-filter-section">
            <strong>Địa điểm tham chiếu</strong>
            <div class="nearby-place-grid" id="nearbyPlaceList"></div>
          </div>
          <div class="nearby-filter-section">
            <strong>Bán kính tìm kiếm</strong>
            <div class="nearby-radius-grid" id="nearbyRadiusList"></div>
          </div>
          <div class="nearby-filter-summary" id="nearbyFilterSummary"></div>
          <div class="advanced-filter-actions"><button type="button" class="btn outline" id="resetNearbyFilter">Đặt lại</button><div><button type="button" class="btn outline" id="cancelNearbyFilter">Hủy</button><button type="button" class="btn primary" id="applyNearbyFilter">OK · Áp dụng</button></div></div>
        </div>
      </div>`);
    const overlay = $('#nearbyFilterModal');
    const close = () => { overlay.hidden = true; };
    $('#closeNearbyFilter').addEventListener('click', close);
    $('#cancelNearbyFilter').addEventListener('click', close);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    $('#resetNearbyFilter').addEventListener('click', () => {
      overlay.querySelectorAll('[data-place]').forEach((item) => item.classList.remove('active'));
      overlay.querySelectorAll('[data-radius]').forEach((item) => item.classList.remove('active'));
      syncNearbyDialogSummary('', '2');
    });
    $('#applyNearbyFilter').addEventListener('click', () => {
      const placeId = overlay.querySelector('[data-place].active')?.dataset.place || '';
      const radius = overlay.querySelector('[data-radius].active')?.dataset.radius || '2';
      ensureHiddenState();
      $('#filterSearchPlaceState').value = placeId;
      $('#filterRadiusState').value = placeId ? radius : '';
      syncNearbyQuick();
      syncSummary();
      close();
      emit();
    });
  };

  const syncNearbyDialogSummary = (placeId, radius) => {
    const summary = $('#nearbyFilterSummary');
    if (!summary) return;
    const place = fixedLocations().find((item) => item.id === placeId);
    const radiusLabel = radiusOptions.find((item) => item.value === radius)?.label || `${radius} km`;
    summary.innerHTML = place
      ? `<span class="nearby-summary-icon">⌖</span><span><b>${escapeHtml(place.label)}</b><small>Bán kính ${escapeHtml(radiusLabel)} · kết hợp với các bộ lọc khác</small></span>`
      : '<span class="nearby-summary-icon">⌖</span><span><b>Chưa chọn địa điểm</b><small>Chưa áp dụng lọc theo bán kính</small></span>';
  };

  const populateNearbyModal = async () => {
    ensureNearbyModal();
    await loadOptions();
    const placeList = $('#nearbyPlaceList');
    const radiusList = $('#nearbyRadiusList');
    const currentPlace = $('#filterSearchPlaceState')?.value || '';
    const currentRadius = $('#filterRadiusState')?.value || '2';
    placeList.innerHTML = fixedLocations().map((place) => `
      <button type="button" class="nearby-place-option ${place.id === currentPlace ? 'active' : ''}" data-place="${escapeHtml(place.id)}">
        <span class="nearby-place-icon">${escapeHtml(place.icon || '⌖')}</span><span><b>${escapeHtml(place.label)}</b><small>${escapeHtml(place.address || '')}</small></span><i>✓</i>
      </button>`).join('');
    radiusList.innerHTML = radiusOptions.map((item) => `
      <button type="button" class="nearby-radius-option ${item.value === currentRadius ? 'active' : ''}" data-radius="${escapeHtml(item.value)}">${escapeHtml(item.label)}</button>`).join('');
    placeList.querySelectorAll('[data-place]').forEach((item) => item.addEventListener('click', () => {
      placeList.querySelectorAll('[data-place]').forEach((node) => node.classList.remove('active'));
      item.classList.add('active');
      syncNearbyDialogSummary(item.dataset.place, radiusList.querySelector('[data-radius].active')?.dataset.radius || '2');
    }));
    radiusList.querySelectorAll('[data-radius]').forEach((item) => item.addEventListener('click', () => {
      radiusList.querySelectorAll('[data-radius]').forEach((node) => node.classList.remove('active'));
      item.classList.add('active');
      syncNearbyDialogSummary(placeList.querySelector('[data-place].active')?.dataset.place || '', item.dataset.radius);
    }));
    if (currentPlace) syncNearbyDialogSummary(currentPlace, currentRadius); else syncNearbyDialogSummary('', currentRadius);
  };

  const syncNearbyQuick = () => {
    const button = $('#filterNearby');
    if (!button) return;
    const active = Boolean($('#filterSearchPlaceState')?.value);
    button.classList.toggle('has-active', active);
    button.innerHTML = `<span class="nearby-filter-icon">⌖</span><span>${escapeHtml(selectedNearbyLabel())}</span><b>⌄</b>`;
  };

  const ensureAdvancedModal = () => {
    if ($('#advancedFilterModal')) return;
    document.body.insertAdjacentHTML('beforeend', `
      <div id="advancedFilterModal" class="advanced-filter-overlay" hidden>
        <div class="advanced-filter-modal" role="dialog" aria-modal="true" aria-labelledby="advancedFilterTitle">
          <div class="advanced-filter-head">
            <div><small>BỘ LỌC CHI TIẾT</small><h3 id="advancedFilterTitle">Lọc phòng theo nhu cầu</h3><p>Chỉ những tin đáp ứng đồng thời các điều kiện đã chọn mới được hiển thị.</p></div>
            <button type="button" id="closeAdvancedFilter" class="advanced-filter-close" aria-label="Đóng">×</button>
          </div>
          <div class="advanced-filter-grid">
            <label>Tin xác thực<div class="modal-check"><input id="modalVerified" type="checkbox"><span>Chỉ hiển thị tin đã xác thực</span></div></label>
            <label>Quận<select id="modalDistrict"></select></label>
            <label>Phường/khu vực<select id="modalWard"></select></label>
            <label>Khoảng giá<button type="button" id="modalPriceButton" class="modal-value-button">Khoảng giá</button></label>
            <label>Tìm kiếm quanh bạn<select id="modalSearchPlace"></select></label>
            <label>Bán kính tìm kiếm<select id="modalRadius"></select></label>
            <label>Loại phòng<select id="modalType"></select></label>
            <label>Diện tích từ<select id="modalMinArea"></select></label>
            <label>Diện tích đến<select id="modalMaxArea"></select></label>
            <label>Nội thất<select id="modalFurnishing"></select></label>
            <label>Đối tượng<select id="modalGender"></select></label>
            <label>Tiện ích<select id="modalAmenity"></select></label>
            <label>WC riêng<select id="modalPrivateToilet"></select></label>
            <label>Ban công<select id="modalBalcony"></select></label>
            <label>Chỗ để xe<select id="modalParking"></select></label>
            <label>Sắp xếp<select id="modalSort"></select></label>
          </div>
          <div class="advanced-filter-actions"><button type="button" class="btn outline" id="resetAdvancedFilter">Đặt lại</button><div><button type="button" class="btn outline" id="cancelAdvancedFilter">Hủy</button><button type="button" class="btn primary" id="applyAdvancedFilter">OK · Áp dụng</button></div></div>
        </div>
      </div>`);
    const overlay = $('#advancedFilterModal');
    const close = () => { overlay.hidden = true; };
    $('#closeAdvancedFilter').addEventListener('click', close);
    $('#cancelAdvancedFilter').addEventListener('click', close);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) close(); });
    $('#modalPriceButton').addEventListener('click', () => { syncPriceModal(); $('#priceFilterModal').hidden = false; });
    $('#applyAdvancedFilter').addEventListener('click', () => {
      ensureHiddenState();
      $('#filterDistrict').value = $('#modalDistrict').value || '';
      $('#filterWard').value = $('#modalWard').value || '';
      $('#filterVerified').checked = $('#modalVerified').checked;
      $('#filterSearchPlaceState').value = $('#modalSearchPlace').value || '';
      $('#filterRadiusState').value = $('#modalSearchPlace').value ? ($('#modalRadius').value || '2') : '';
      const mapping = {
        modalType:'filterTypeState', modalMinArea:'filterMinAreaState', modalMaxArea:'filterMaxAreaState',
        modalFurnishing:'filterFurnishingState', modalGender:'filterGenderState', modalAmenity:'filterAmenityState',
        modalPrivateToilet:'filterPrivateToiletState', modalBalcony:'filterBalconyState', modalParking:'filterParkingState', modalSort:'filterSortState'
      };
      Object.entries(mapping).forEach(([from, to]) => { $('#' + to).value = $('#' + from).value || ''; });
      close(); syncSummary(); emit();
    });
    $('#resetAdvancedFilter').addEventListener('click', () => resetAll(true));
  };

  const populateAdvancedModal = async () => {
    ensureAdvancedModal();
    await loadOptions();
    const mapping = {
      modalDistrict:'districts', modalWard:'wards', modalRadius:'radius_options', modalType:'types', modalMinArea:'areas', modalMaxArea:'max_areas',
      modalFurnishing:'furnishings', modalGender:'genders', modalAmenity:'amenities_options', modalPrivateToilet:'boolean_options',
      modalBalcony:'boolean_options', modalParking:'boolean_options', modalSort:'sorts'
    };
    Object.entries(mapping).forEach(([id,key]) => fillSelect(id, state.options[key] || []));
    fillSelect('modalSearchPlace', [{ value:'', label:'Không áp dụng' }, ...(state.options.fixed_locations || [])]);
    $('#modalVerified').checked = Boolean($('#filterVerified')?.checked);
    const pairs = [
      ['modalDistrict','#filterDistrict'],['modalWard','#filterWard'],['modalSearchPlace','#filterSearchPlaceState'],['modalRadius','#filterRadiusState'],['modalType','#filterTypeState'],['modalMinArea','#filterMinAreaState'],['modalMaxArea','#filterMaxAreaState'],
      ['modalFurnishing','#filterFurnishingState'],['modalGender','#filterGenderState'],['modalAmenity','#filterAmenityState'],['modalPrivateToilet','#filterPrivateToiletState'],
      ['modalBalcony','#filterBalconyState'],['modalParking','#filterParkingState'],['modalSort','#filterSortState']
    ];
    pairs.forEach(([id,stateSel]) => { const modal = $('#' + id); const stateEl=$(stateSel); if (modal && stateEl) modal.value=stateEl.value || ''; });
    const label = `${$('#filterMinPrice')?.value || ''}:${$('#filterMaxPrice')?.value || ''}`;
    const quick = priceRanges.find((x) => x.value === label);
    $('#modalPriceButton').textContent = quick ? quick.label : (label !== ':' ? `${$('#filterMinPrice')?.value || '0'} – ${$('#filterMaxPrice')?.value || '∞'}` : 'Khoảng giá');
  };

  const resetAll = (keepOverlay=false) => {
    ensureHiddenState();
    ['filterDistrict','filterWard'].forEach((id) => setSelectValue(id,''));
    $('#filterVerified').checked = false;
    ['filterTypeState','filterMinAreaState','filterMaxAreaState','filterFurnishingState','filterGenderState','filterAmenityState','filterPrivateToiletState','filterBalconyState','filterParkingState'].forEach((id) => { const el=$('#'+id); if(el) el.value=''; });
    $('#filterSortState').value='newest'; $('#filterMinPrice').value=''; $('#filterMaxPrice').value=''; $('#filterSearchPlaceState').value=''; $('#filterRadiusState').value='';
    syncPriceQuick(); syncNearbyQuick(); syncSummary();
    if (keepOverlay) populateAdvancedModal(); else emit();
  };

  const syncSummary = () => {
    ensureHiddenState();
    syncPriceQuick();
    const button = $('#advancedFilterButton');
    if (button) {
      const ids=['filterTypeState','filterMinAreaState','filterMaxAreaState','filterFurnishingState','filterGenderState','filterAmenityState','filterPrivateToiletState','filterBalconyState','filterParkingState'];
      const active = ids.filter((id)=>$('#'+id)?.value).length + ($('#filterSortState')?.value && $('#filterSortState').value !== 'newest' ? 1 : 0);
      button.classList.toggle('has-active', active > 0);
      button.innerHTML = active ? `Lọc <span class="filter-active-count">${active}</span>` : 'Lọc';
    }
    syncNearbyQuick();
    const priceBtn = $('#filterPriceRange');
    if (priceBtn) {
      const min=$('#filterMinPrice')?.value||'', max=$('#filterMaxPrice')?.value||'';
      const encoded=`${min}:${max}`;
      const item=priceRanges.find(x=>x.value===encoded);
      priceBtn.innerHTML=`<span>${escapeHtml(item?.label || (min||max ? `${min||'0'} – ${max||'∞'}` : 'Khoảng giá'))}</span><b>⌄</b>`;
    }
  };

  const initMapFilterArrows = () => {
    const viewport=$('#mapFilterViewport'); const bar=$('#compactFilterBar');
    if (!viewport || !bar || viewport.dataset.arrowInit) return;
    viewport.dataset.arrowInit='1';
    const left=$('#mapFilterPrev'), right=$('#mapFilterNext');
    const sync=()=>{ if(left) left.disabled=viewport.scrollLeft<=2; if(right) right.disabled=viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 2; };
    left?.addEventListener('click',()=>viewport.scrollBy({left:-190,behavior:'smooth'}));
    right?.addEventListener('click',()=>viewport.scrollBy({left:190,behavior:'smooth'}));
    viewport.addEventListener('scroll',sync,{passive:true}); window.addEventListener('resize',sync); setTimeout(sync,50);
  };

  const initCompactFilterBar = () => {
    ensureHiddenState(); ensureAdvancedModal(); createPriceModal(); ensureNearbyModal();
    populateSelects(); syncPriceQuick(); syncNearbyQuick(); syncSummary();
    $('#advancedFilterButton')?.addEventListener('click', async ()=>{ await populateAdvancedModal(); $('#advancedFilterModal').hidden=false; });
    $('#filterNearby')?.addEventListener('click', async ()=>{ await populateNearbyModal(); $('#nearbyFilterModal').hidden=false; });
    $('#filterDistrict')?.addEventListener('change', emit);
    $('#filterWard')?.addEventListener('change', emit);
    $('#filterVerified')?.addEventListener('change', emit);
    $('#filterPriceRange')?.addEventListener('click', ()=>{ syncPriceModal(); $('#priceFilterModal').hidden=false; });
    $('#compactFilterReset')?.addEventListener('click', ()=>resetAll(false));
    initMapFilterArrows();
  };

  const values = () => ({
    keyword: ($('#search')?.value || $('#heroSearch')?.value || $('#mapSearch')?.value || $('#mapSearchTop')?.value || '').trim(),
    district: $('#filterDistrict')?.value || '', ward: $('#filterWard')?.value || '',
    minPrice: $('#filterMinPrice')?.value || '', maxPrice: $('#filterMaxPrice')?.value || '',
    type: $('#filterTypeState')?.value || '', minArea: $('#filterMinAreaState')?.value || '', maxArea: $('#filterMaxAreaState')?.value || '',
    furnishing: $('#filterFurnishingState')?.value || '', gender: $('#filterGenderState')?.value || '', privateToilet: $('#filterPrivateToiletState')?.value || '',
    balcony: $('#filterBalconyState')?.value || '', parking: $('#filterParkingState')?.value || '', amenity: $('#filterAmenityState')?.value || '',
    verified: $('#filterVerified')?.checked ? 'true' : '', searchPlace: $('#filterSearchPlaceState')?.value || '', radiusKm: $('#filterRadiusState')?.value || '', sort: $('#filterSortState')?.value || 'newest'
  });

  const toQuery = (valueMap) => { const params=new URLSearchParams(); Object.entries(valueMap||{}).forEach(([key,value])=>{ if(value!==undefined && value!==null && String(value)!=='') params.set(key,value); }); return params; };

  const clearHomeFilters = () => resetAll(false);
  const getFixedLocations = () => fixedLocations();
  window.RoomFilters = { loadOptions, initCompactFilterBar, values, toQuery, clearHomeFilters, syncSummary, getFixedLocations };
})();
