/* TrọSmart Map - Leaflet + full listing cards */
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
  let fixedPlaceMarkers = [];
  let radiusCircle = null;

  const apiRooms = async () => {
    const values = RoomFilters.values('#map');
    // RoomFilters reads map fields from DOM; search bars are handled explicitly below.
    values.keyword = ($('#mapSearch')?.value.trim() || $('#mapSearchTop')?.value.trim() || '');
    const params = RoomFilters.toQuery(values);
    const response = await fetch(`/api/rooms?${params.toString()}`);
    if (!response.ok) throw new Error('Không thể tải dữ liệu phòng từ Flask');
    return (await response.json()).data || [];
  };

  const initLeaflet = () => {
    if (leafletMap || !window.L) return;
    const canvas = $('#canvas');
    if (!canvas) return;
    leafletMap = L.map(canvas, { zoomControl: false }).setView([21.0036, 105.8481], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
    renderFixedPlaceMarkers();
  };

  const renderRoomList = () => {
    const list = $('#mapList');
    if (!list) return;
    list.innerHTML = currentRooms.length ? currentRooms.map((room) => {
      const landlord = room.landlord || {};
      const verified = Boolean(room.verified || room.listing_verification?.verified);
      return `
      <article class="card map-full-card" data-id="${escapeHTML(room.id)}">
        <div class="photo" style="background-image:url('${escapeHTML(room.image || '')}')">
          <span class="verified ${verified ? 'listing-verified' : 'listing-unverified'}">${verified ? '✓ Tin đăng đã xác thực' : 'Chưa xác thực'}</span>
          <button class="save map-card-save" type="button" aria-label="Lưu tin">♡</button>
        </div>
        <div class="body">
          <div class="price">${money(room.price)} <i>/ tháng</i></div>
          <div class="title">${escapeHTML(room.title)}</div>
          <div class="meta2">${Number(room.area || 0)}m² · ${escapeHTML(room.type || 'Phòng trọ')} · ★ ${room.rating || 0} · 💬 ${room.comments_count || 0}</div>
          <div class="address">⌖ ${escapeHTML(room.address || '')}</div>
          <div class="tags">${(room.amenities || []).slice(0, 4).map((x) => `<span class="tag">${escapeHTML(x)}</span>`).join('')}</div>
          <div class="card-foot">
            <span class="mini"><img src="${escapeHTML(landlord.avatar || '')}" alt="">${escapeHTML(landlord.name || 'Chủ trọ')}${landlord.verified ? ' <em class="verified-user-badge">✓ Tài khoản</em>' : ''}</span>
            <a href="room.html?id=${encodeURIComponent(room.id)}">Chi tiết →</a>
          </div>
        </div>
      </article>`;
    }).join('') : '<div class="map-empty-list">Không tìm thấy phòng phù hợp với các điều kiện hiện tại.</div>';

    list.querySelectorAll('.map-item, .map-full-card').forEach((item) => {
      item.addEventListener('click', (event) => {
        if (event.target.closest('a,button')) return;
        focusRoom(item.dataset.id, true);
      });
    });
  };

  const renderFixedPlaceMarkers = () => {
    if (!leafletMap || !window.L) return;
    fixedPlaceMarkers.forEach(({ marker }) => marker.remove());
    fixedPlaceMarkers = [];
    const places = RoomFilters.getFixedLocations?.() || [];
    const selectedId = RoomFilters.values('#map').searchPlace || '';
    places.forEach((place) => {
      const lat = Number(place.latitude);
      const lng = Number(place.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const selected = place.id === selectedId;
      const icon = L.divIcon({
        className: `fixed-place-marker-wrap ${selected ? 'is-selected' : ''}`,
        html: `<div class="fixed-place-marker"><span>${escapeHTML(place.icon || '🎓')}</span></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -34]
      });
      const marker = L.marker([lat, lng], { icon, zIndexOffset: 900 }).addTo(leafletMap);
      marker.bindTooltip(escapeHTML(place.short_label || place.label || ''), { direction: 'top', offset: [0, -28], opacity: 0.96 });
      marker.bindPopup(`<strong>${escapeHTML(place.label || '')}</strong><br>${escapeHTML(place.address || '')}`);
      fixedPlaceMarkers.push({ id: place.id, marker });
    });
  };

  const renderNearbyRadius = () => {
    if (!leafletMap) return;
    if (radiusCircle) { radiusCircle.remove(); radiusCircle = null; }
    const values = RoomFilters.values('#map');
    if (!values.searchPlace) return;
    const place = (RoomFilters.getFixedLocations?.() || []).find((item) => item.id === values.searchPlace);
    if (!place) return;
    const radiusMeters = Number(values.radiusKm || 2) * 1000;
    radiusCircle = L.circle([Number(place.latitude), Number(place.longitude)], {
      radius: radiusMeters,
      color: '#635bff',
      weight: 2,
      opacity: 0.75,
      fillColor: '#635bff',
      fillOpacity: 0.08,
      interactive: false
    }).addTo(leafletMap);
  };

  const renderMarkers = () => {
    initLeaflet();
    if (!leafletMap) return;
    renderFixedPlaceMarkers();
    renderNearbyRadius();
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

    const values = RoomFilters.values('#map');
    if (values.searchPlace) {
      const place = (RoomFilters.getFixedLocations?.() || []).find((item) => item.id === values.searchPlace);
      if (place) {
        const radius = Number(values.radiusKm || 2);
        const zoom = radius <= 0.5 ? 15 : radius <= 1 ? 14 : radius <= 2 ? 13 : radius <= 3 ? 12.5 : 12;
        leafletMap.setView([Number(place.latitude), Number(place.longitude)], zoom, { animate: true });
      }
    } else if (bounds.length && !leafletMap.__hasFitted) {
      leafletMap.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      leafletMap.__hasFitted = true;
    }
  };

  const focusRoom = (id, openPopup = true) => {
    const room = currentRooms.find((item) => item.id === id);
    if (!room) return;
    document.querySelectorAll('.map-full-card').forEach((item) => item.classList.toggle('active', item.dataset.id === id));
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

  const updateFilterLabel = () => {
    const active = [];
    const district = $('#filterDistrict')?.value;
    const ward = $('#filterWard')?.value;
    const price = $('#filterPriceRange')?.selectedOptions?.[0]?.textContent;
    const verified = $('#filterVerified')?.checked;
    const values = RoomFilters.values('#map');
    const place = (RoomFilters.getFixedLocations?.() || []).find((item) => item.id === values.searchPlace);
    if (district) active.push(district);
    if (ward) active.push(ward);
    if (price && price !== 'Khoảng giá') active.push(price);
    if (verified) active.push('Tin xác thực');
    if (place) active.push(`${place.short_label || place.label} · ${values.radiusKm || 2} km`);
    if ($('#mapActiveFilter')) $('#mapActiveFilter').textContent = active.length ? active.slice(0, 3).join(' · ') + (active.length > 3 ? ` +${active.length - 3}` : '') : 'Tất cả';
  };

  const render = () => {
    currentRooms = [...rooms];
    $('#mapResultCount').textContent = `${currentRooms.length} phòng`;
    updateFilterLabel();
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
    RoomFilters.clearHomeFilters();
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
    window.addEventListener('trosmart:filters-changed', () => { leafletMap && (leafletMap.__hasFitted = false); updateFilterLabel(); loadRooms(); });
    $('#clearMapSearch')?.addEventListener('click', resetFilters);
    $('#resetMapFilters')?.addEventListener('click', resetFilters);
    $('#mapEmptyReset')?.addEventListener('click', resetFilters);
    $('#mapZoomIn')?.addEventListener('click', () => leafletMap?.zoomIn());
    $('#mapZoomOut')?.addEventListener('click', () => leafletMap?.zoomOut());
  };

  RoomFilters.loadOptions().then(() => {
    RoomFilters.initCompactFilterBar();
    setupEvents();
    loadRooms();
  }).catch((error) => {
    console.error(error);
    normalizeMapFilterValues();
    setupEvents();
    loadRooms();
  });
})();
