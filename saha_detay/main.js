// Saha Detay JavaScript

var fieldId = null;
var fieldData = null;
var selectedDate = new Date();
var selectedSlot = null;
var isFavorite = false;

selectedDate.setHours(0, 0, 0, 0);

document.addEventListener('DOMContentLoaded', async function () {
  loadAuthModal();
  initDarkMode();
  updateNavForAuthState();

  fieldId = Router.getParam('id');
  if (!fieldId) {
    showToast('Saha ID bulunamadı.', 'error');
    setTimeout(function () { Router.navigate('saha_listeleme'); }, 1500);
    return;
  }

  await loadField();
  loadAvailability();
  bindDateNavigation();
  bindBookNow();

  if (Auth.isLoggedIn()) {
    checkFavoriteStatus();
  }

  bindFavoriteBtn();
});

async function loadField() {
  try {
    fieldData = await api.get('/fields/' + fieldId);

    document.getElementById('field-name').textContent = fieldData.name;
    document.getElementById('field-location').textContent = fieldData.district + ', ' + fieldData.city;
    document.getElementById('field-rating').textContent = fieldData.rating;
    document.getElementById('field-reviews-count').textContent = '(' + fieldData.reviews_count + ' Değerlendirme)';
    document.getElementById('card-price').textContent = '₺' + fieldData.price_per_hour;
    document.getElementById('card-capacity').textContent = fieldData.capacity || '-';

    // Ana görseli güncelle
    if (fieldData.images && fieldData.images[0]) {
      var mainImg = document.querySelector('.md\\:col-span-3 img');
      if (mainImg) mainImg.src = fieldData.images[0];
    }

    // Amenities güncelle
    renderAmenities(fieldData.amenities || []);

    // Yorumları yükle
    loadReviews();
  } catch (err) {
    showToast('Saha bilgileri yüklenemedi: ' + err.message, 'error');
  }
}

function renderAmenities(amenities) {
  var amenityIcons = {
    'Otopark': 'local_parking',
    'Duş': 'shower',
    'Soyunma Odası': 'door_front',
    'Kafe': 'coffee',
    'WiFi': 'wifi',
    'Klima': 'ac_unit',
    'Tribün': 'stadium',
    'Çocuk Parkı': 'child_care'
  };

  var container = document.querySelector('.grid.grid-cols-2.sm\\:grid-cols-3');
  if (!container || !amenities.length) return;

  container.innerHTML = amenities.map(function (a) {
    var icon = amenityIcons[a] || 'check_circle';
    return '<div class="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/10 bg-white dark:bg-background-dark/50">' +
      '<span class="material-symbols-outlined text-primary text-3xl">' + icon + '</span>' +
      '<span class="text-sm font-medium text-center">' + a + '</span>' +
      '</div>';
  }).join('');
}

async function loadAvailability() {
  var grid = document.getElementById('timeslot-grid');
  var dateStr = selectedDate.toISOString().split('T')[0];

  // Tarih label güncelle
  var label = document.getElementById('selected-date-label');
  if (label) label.textContent = formatDate(dateStr);

  if (!grid) return;
  grid.innerHTML = '<div class="col-span-full text-center py-4 text-slate-400">Yükleniyor...</div>';

  try {
    var slots = await api.get('/fields/' + fieldId + '/availability?date=' + dateStr);

    if (!slots || slots.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-4 text-slate-400">Bu tarih için saat bulunamadı.</div>';
      return;
    }

    var morningSlots = slots.filter(function (s) { return parseInt(s.start_time) < 17; });
    var eveningSlots = slots.filter(function (s) { return parseInt(s.start_time) >= 17; });

    var html = '';

    if (morningSlots.length > 0) {
      html += '<div class="col-span-full text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-2">Gündüz Seansları</div>';
      html += morningSlots.map(function (s) { return renderSlotButton(s); }).join('');
    }

    if (eveningSlots.length > 0) {
      html += '<div class="col-span-full text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 mt-4">Akşam Seansları</div>';
      html += eveningSlots.map(function (s) { return renderSlotButton(s); }).join('');
    }

    grid.innerHTML = html;

    // Slot tıklama event'leri
    grid.querySelectorAll('[data-slot-id]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (this.dataset.available === 'false') return;
        var slot = JSON.parse(this.dataset.slot);
        selectSlot(slot, this);
      });
    });
  } catch (err) {
    grid.innerHTML = '<div class="col-span-full text-center py-4 text-red-400">Saatler yüklenirken hata oluştu.</div>';
  }
}

function renderSlotButton(s) {
  if (!s.is_available) {
    return '<button disabled data-slot-id="' + s.id + '" data-available="false" class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed text-center text-sm font-medium line-through">' + s.start_time + '</button>';
  }

  var isSelected = selectedSlot && selectedSlot.id === s.id;
  if (isSelected) {
    return '<button data-slot-id="' + s.id + '" data-available="true" data-slot=\'' + JSON.stringify(s) + '\' class="p-3 rounded-lg bg-primary text-white text-center text-sm font-bold shadow-lg shadow-primary/25 border border-primary">' + s.start_time + '</button>';
  }

  return '<button data-slot-id="' + s.id + '" data-available="true" data-slot=\'' + JSON.stringify(s) + '\' class="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-sm font-medium hover:border-primary hover:text-primary transition-colors">' + s.start_time + '</button>';
}

function selectSlot(slot, btnEl) {
  selectedSlot = slot;

  // Tüm butonları sıfırla
  document.querySelectorAll('[data-slot-id]').forEach(function (b) {
    if (b.dataset.available !== 'false') {
      b.className = 'p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-center text-sm font-medium hover:border-primary hover:text-primary transition-colors';
    }
  });

  // Seçilen butonu vurgula
  btnEl.className = 'p-3 rounded-lg bg-primary text-white text-center text-sm font-bold shadow-lg shadow-primary/25 border border-primary';

  // Sticky card'ı güncelle
  document.getElementById('card-time').textContent = slot.start_time + ' - ' + slot.end_time;
  document.getElementById('card-date').textContent = formatDateShort(selectedDate.toISOString().split('T')[0]);

  // Rezervasyon butonunu aktif et
  var bookBtn = document.getElementById('book-now-btn');
  bookBtn.disabled = false;
  bookBtn.nextElementSibling.textContent = 'İptal politikası geçerlidir';
}

function bindDateNavigation() {
  document.getElementById('prev-date-btn').addEventListener('click', function () {
    var yesterday = new Date(selectedDate);
    yesterday.setDate(selectedDate.getDate() - 1);
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    if (yesterday < today) return;
    selectedDate = yesterday;
    selectedSlot = null;
    document.getElementById('book-now-btn').disabled = true;
    document.getElementById('card-time').textContent = '-';
    loadAvailability();
  });

  document.getElementById('next-date-btn').addEventListener('click', function () {
    selectedDate.setDate(selectedDate.getDate() + 1);
    selectedSlot = null;
    document.getElementById('book-now-btn').disabled = true;
    document.getElementById('card-time').textContent = '-';
    loadAvailability();
  });
}

function bindBookNow() {
  document.getElementById('book-now-btn').addEventListener('click', function () {
    if (!Auth.isLoggedIn()) {
      sessionStorage.setItem('sahabul_redirect', window.location.href);
      openAuthModal('login');
      return;
    }

    if (!selectedSlot) {
      showToast('Lütfen bir saat dilimi seçin.', 'error');
      return;
    }

    sessionStorage.setItem('sahabul_pending', JSON.stringify({
      fieldId: fieldId,
      fieldName: fieldData.name,
      fieldLocation: fieldData.district + ', ' + fieldData.city,
      slotId: selectedSlot.id,
      date: selectedDate.toISOString().split('T')[0],
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      price: fieldData.price_per_hour
    }));

    Router.navigate('rezervasyon');
  });
}

async function checkFavoriteStatus() {
  try {
    var result = await api.get('/favorites/check/' + fieldId);
    isFavorite = result.isFavorite;
    updateFavoriteBtn();
  } catch (e) { }
}

function updateFavoriteBtn() {
  var btn = document.getElementById('favorite-btn');
  if (!btn) return;
  var icon = btn.querySelector('.material-symbols-outlined');
  if (isFavorite) {
    btn.classList.add('bg-red-100', 'text-red-500');
    btn.classList.remove('bg-primary/10', 'text-primary');
    if (icon) icon.textContent = 'favorite';
  } else {
    btn.classList.remove('bg-red-100', 'text-red-500');
    btn.classList.add('bg-primary/10', 'text-primary');
    if (icon) icon.textContent = 'favorite_border';
  }
}

function bindFavoriteBtn() {
  document.getElementById('favorite-btn').addEventListener('click', async function () {
    if (!Auth.isLoggedIn()) {
      openAuthModal('login');
      return;
    }

    try {
      if (isFavorite) {
        await api.del('/favorites/' + fieldId);
        isFavorite = false;
        showToast('Favorilerden kaldırıldı.');
      } else {
        await api.post('/favorites', { field_id: parseInt(fieldId) });
        isFavorite = true;
        showToast('Favorilere eklendi!');
      }
      updateFavoriteBtn();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function loadReviews() {
  var container = document.getElementById('reviews-list');
  if (!container) return;

  try {
    var reviews = await api.get('/reviews/' + fieldId);
    if (!reviews || reviews.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>';
      return;
    }

    container.innerHTML = reviews.slice(0, 5).map(function (r) {
      var initials = r.user_name ? r.user_name.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase() : 'U';
      var stars = '';
      for (var i = 1; i <= 5; i++) {
        stars += '<span class="material-symbols-outlined text-sm ' + (i <= r.rating ? 'text-yellow-500' : 'text-slate-300') + '" style="font-variation-settings:\'FILL\' 1">star</span>';
      }
      return '<div class="p-5 rounded-xl bg-white dark:bg-background-dark/50 border border-primary/5">' +
        '<div class="flex items-center justify-between mb-3">' +
        '<div class="flex items-center gap-3">' +
        '<div class="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">' + initials + '</div>' +
        '<div><p class="font-bold">' + r.user_name + '</p>' +
        '<p class="text-xs text-slate-500">' + (r.created_at ? r.created_at.split('T')[0] : '') + '</p></div>' +
        '</div>' +
        '<div class="flex">' + stars + '</div>' +
        '</div>' +
        '<p class="text-sm text-slate-600 dark:text-slate-400">' + (r.comment || '') + '</p>' +
        '</div>';
    }).join('');
  } catch (e) { }
}

// loadAuthModal artık ui.js'de global olarak tanımlı
