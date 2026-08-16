/* TrọSmart Map - Leaflet + Flask API */
(() => {
  const $ = (selector) => document.querySelector(selector);
  const money = (n) => new Intl.NumberFormat('vi-VN').format(Number(n || 0)) + ' đ';
  const escapeHTML = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  let rooms = [];
  let currentRooms = [];
  let leafletMap = null;
  let leafletMarkers = [];

  const apiRooms = async () => {
    const params = new URLSearchParams();
    const query = ($('#mapSearch')?.value.trim() || $('#mapSearchTop')?.value.trim() || '');
    if (query) params.set('keyword', query);
    if ($('#mapDistrict')?.value) params.set('district', $('#mapDistrict').value);
    if ($('#mapPrice')?.value) params.set('maxPrice', $('#mapPrice').value);
    if ($('#mapType')?.value) params.set('type', $('#mapType').value);
    if ($('#mapArea')?.value) params.set('minArea', $('#mapArea').value);
    const response = await fetch(`/api/rooms?${params.toString()}`);
    if (!response.ok) throw new Error('Không thể tải dữ liệu phòng từ Flask');
    return (await response.json()).data || [];
  };

  const initLeaflet = () => {
    if (leafletMap || !window.L) return;
    const canvas = $('#canvas');
    if (!canvas) return;
    leafletMap = L.map(canvas, { zoomControl: false }).setView([21.0285, 105.8542], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
  };

  const renderRoomList = () => {
    const list = $('#mapList');
    if (!list) return;
    list.innerHTML = currentRooms.map((room, index) => `
      <article class="map-item" data-id="${escapeHTML(room.id)}">
        <div class="map-item-number">${index + 1}</div>
        <div class="map-item-content">
          <strong>${escapeHTML(room.title)}</strong>
          <small>${escapeHTML(room.district || '')} · ${Number(room.area || 0)}m² · ${escapeHTML(room.type || '')} · ★ ${room.rating || 0}</small>
          <div class="map-item-bottom">
            <b>${money(room.price)} <span>/tháng</span></b>
            ${room.verified ? '<span class="map-verified">✓ Xác thực</span>' : ''}
          </div>
        </div>
      </article>`).join('');
    list.querySelectorAll('.map-item').forEach((item) => {
      item.addEventListener('click', () => focusRoom(item.dataset.id, true));
    });
  };

  const renderMarkers = () => {
    initLeaflet();
    if (!leafletMap) return;
    leafletMarkers.forEach(({ marker }) => marker.remove());
    leafletMarkers = [];

    const bounds = [];
    currentRooms.forEach((room) => {
      const lat = Number(room.latitude);
      const lng = Number(room.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const marker = L.marker([lat, lng]).addTo(leafletMap);
      const image = room.image ? `<img src="${escapeHTML(room.image)}" alt="" style="width:180px;height:100px;object-fit:cover;border-radius:8px;margin-bottom:6px">` : '';
      marker.bindPopup(`
        ${image}
        <strong>${escapeHTML(room.title)}</strong><br>
        <b>${money(room.price)} / tháng</b><br>
        ${escapeHTML(room.address || '')}<br>
        <a href="room.html?id=${encodeURIComponent(room.id)}">Xem chi tiết →</a>
      `);
      marker.on('click', () => focusRoom(room.id, false));
      leafletMarkers.push({ id: room.id, marker });
      bounds.push([lat, lng]);
    });

    if (bounds.length && !leafletMap.__hasFitted) {
      leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      leafletMap.__hasFitted = true;
    }
  };

  const focusRoom = (id, openPopup = true) => {
    const room = currentRooms.find((item) => item.id === id);
    if (!room) return;
    document.querySelectorAll('.map-item').forEach((item) => item.classList.toggle('active', item.dataset.id === id));
    const markerEntry = leafletMarkers.find((entry) => entry.id === id);
    if (!markerEntry || !leafletMap) return;
    const lat = Number(room.latitude);
    const lng = Number(room.longitude);
    leafletMap.setView([lat, lng], Math.max(leafletMap.getZoom(), 14), { animate: true });
    if (openPopup) markerEntry.marker.openPopup();
  };

  const updateEmptyState = () => {
    const empty = $('#mapEmpty');
    if (empty) empty.hidden = currentRooms.length !== 0;
  };

  const render = () => {
    currentRooms = [...rooms];
    $('#mapResultCount').textContent = `${currentRooms.length} phòng`;
    const filters = [];
    if ($('#mapDistrict')?.value) filters.push($('#mapDistrict').value);
    if ($('#mapPrice')?.value) filters.push(`≤ ${new Intl.NumberFormat('vi-VN').format($('#mapPrice').value)}đ`);
    if ($('#mapType')?.value) filters.push($('#mapType').value);
    if ($('#mapArea')?.value) filters.push(`≥ ${$('#mapArea').value}m²`);
    if ($('#mapActiveFilter')) $('#mapActiveFilter').textContent = filters.length ? filters.join(' · ') : 'Tất cả';
    renderRoomList();
    renderMarkers();
    updateEmptyState();
  };

  const loadRooms = async () => {
    try {
      rooms = await apiRooms();
      render();
      setTimeout(() => leafletMap?.invalidateSize(), 100);
    } catch (error) {
      console.error(error);
      $('#mapList').innerHTML = '<div class="map-error">Không thể tải dữ liệu phòng trọ. Hãy kiểm tra Flask đang chạy.</div>';
    }
  };

  const resetFilters = () => {
    ['mapSearch', 'mapSearchTop', 'mapDistrict', 'mapPrice', 'mapType', 'mapArea'].forEach((id) => {
      const element = $('#' + id);
      if (element) element.value = '';
    });
    loadRooms();
  };

  const syncSearch = (source, target) => {
    if (!source || !target) return;
    source.addEventListener('input', () => {
      target.value = source.value;
      loadRooms();
    });
  };

  const setupEvents = () => {
    initLeaflet();
    syncSearch($('#mapSearch'), $('#mapSearchTop'));
    syncSearch($('#mapSearchTop'), $('#mapSearch'));
    ['#mapDistrict', '#mapPrice', '#mapType', '#mapArea'].forEach((selector) => $(selector)?.addEventListener('change', loadRooms));
    $('#clearMapSearch')?.addEventListener('click', resetFilters);
    $('#resetMapFilters')?.addEventListener('click', resetFilters);
    $('#mapEmptyReset')?.addEventListener('click', resetFilters);
    $('#mapZoomIn')?.addEventListener('click', () => leafletMap?.zoomIn());
    $('#mapZoomOut')?.addEventListener('click', () => leafletMap?.zoomOut());
  };

  RoomFilters.loadOptions({
    mapDistrict: 'districts',
    mapPrice: 'map_prices',
    mapType: 'types',
    mapArea: 'map_areas'
  }).then(() => {
    setupEvents();
    loadRooms();
  }).catch((error) => {
    console.error(error);
    setupEvents();
    loadRooms();
  });
})();
