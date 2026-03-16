// Kullanıcı Paneli JavaScript

var currentTab = 'upcoming';
var DEFAULT_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWaDjz7xB2txRyfjhcw40KwVC3IfjRxehCmLFLHxBn4aP3jjcScvC2BCDGKL6UZ3FDqWmpiwgeq3SGoOFtdDScCvdlmz7gqyOLLJk4_FxLQv3MY6dsw2cWqppGzcfS82lQPAJhrGOQ2deQa00I6vSx5yPgaGzZayYTH4tgJqB3t-89lsZBH5avvhh12cLZxmPm9RMIZGEJsfmOpVbjfLUSMlyFavg8PaUmjN9Wxaucz3-Z815TlxSlwYyNtPEHVVop9ist0gUfc7U';

document.addEventListener('DOMContentLoaded', async function () {
  initDarkMode();

  // Auth guard
  if (!Auth.isLoggedIn()) {
    Router.navigate('ana_sayfa');
    return;
  }

  // Nav
  var user = Auth.getUser();
  if (user) {
    var nameEl = document.getElementById('nav-user-name');
    if (nameEl) nameEl.textContent = user.name;
    var titleEl = document.getElementById('welcome-title');
    if (titleEl) titleEl.textContent = 'Merhaba, ' + user.name.split(' ')[0] + '! 👋';
  }

  var logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      Auth.logout();
    });
  }

  // Tab navigation
  ['tab-upcoming', 'tab-past', 'tab-favorites'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var tab = this.dataset.tab;
        switchTab(tab);
      });
    }
  });

  // Yeni rezervasyon butonu
  var newResBtn = document.querySelector('button.bg-primary');
  if (newResBtn && newResBtn.textContent.indexOf('Yeni Rezervasyon') !== -1) {
    newResBtn.addEventListener('click', function () {
      Router.navigate('saha_listeleme');
    });
  }

  // Başlangıç verisini yükle
  loadDashboard();
});

async function loadDashboard() {
  // İstatistikler
  try {
    var stats = await api.get('/user/statistics');
    var matchesEl = document.getElementById('stat-matches');
    var hoursEl = document.getElementById('stat-hours');
    var calEl = document.getElementById('stat-calories');
    if (matchesEl) matchesEl.textContent = stats.matches_this_month;
    if (hoursEl) hoursEl.textContent = stats.hours_this_month + ' Saat';
    if (calEl) calEl.textContent = stats.calories_estimate.toLocaleString('tr-TR') + ' Kcal';
  } catch (e) { }

  // İlk tab
  loadTab('upcoming');
}

function switchTab(tab) {
  currentTab = tab;

  // Tüm tab stillerini sıfırla
  ['tab-upcoming', 'tab-past', 'tab-favorites'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.className = 'flex flex-col items-center border-b-4 border-transparent pb-3 text-slate-500 hover:text-primary transition-all cursor-pointer';
    }
  });

  // Aktif tab'ı vurgula
  var active = document.getElementById('tab-' + tab);
  if (active) {
    active.className = 'flex flex-col items-center border-b-4 border-primary pb-3 transition-all cursor-pointer';
    var span = active.querySelector('span');
    if (span) span.className = 'text-slate-900 dark:text-slate-100 text-sm font-bold whitespace-nowrap';
  }

  loadTab(tab);
}

async function loadTab(tab) {
  var content = document.getElementById('tab-content');
  if (!content) return;

  content.innerHTML = '<div class="col-span-2 text-center py-12 text-slate-400"><span class="material-symbols-outlined text-4xl">sports_soccer</span><p class="mt-2">Yükleniyor...</p></div>';

  try {
    if (tab === 'upcoming') {
      var reservations = await api.get('/reservations?status=confirmed&upcoming=true');
      if (!reservations || reservations.length === 0) {
        content.innerHTML = '<div class="col-span-2 text-center py-16 text-slate-400"><span class="material-symbols-outlined text-5xl">event_busy</span><p class="mt-3 text-lg font-medium">Yaklaşan rezervasyonunuz yok.</p><button onclick="Router.navigate(\'saha_listeleme\')" class="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:opacity-90 transition-all">Hemen Saha Bul</button></div>';
        return;
      }
      content.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';
      content.innerHTML = reservations.map(function (r) { return renderReservationCard(r, true); }).join('');

    } else if (tab === 'past') {
      var past = await api.get('/reservations?upcoming=false');
      if (!past || past.length === 0) {
        content.innerHTML = '<div class="col-span-2 text-center py-16 text-slate-400"><span class="material-symbols-outlined text-5xl">history</span><p class="mt-3 text-lg font-medium">Geçmiş maçınız bulunamadı.</p></div>';
        return;
      }
      content.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6';
      content.innerHTML = past.map(function (r) { return renderReservationCard(r, false); }).join('');

    } else if (tab === 'favorites') {
      var favorites = await api.get('/favorites');
      if (!favorites || favorites.length === 0) {
        content.innerHTML = '<div class="col-span-2 text-center py-16 text-slate-400"><span class="material-symbols-outlined text-5xl">favorite_border</span><p class="mt-3 text-lg font-medium">Henüz favori sahanız yok.</p></div>';
        return;
      }
      content.className = 'grid grid-cols-2 md:grid-cols-4 gap-4';
      content.innerHTML = favorites.map(function (f) { return renderFavoriteCard(f); }).join('');
    }

    // Event delegation: İptal butonu
    content.addEventListener('click', handleTabClick);
  } catch (err) {
    content.innerHTML = '<div class="col-span-2 text-center py-12 text-red-400"><p>' + err.message + '</p></div>';
  }
}

function handleTabClick(e) {
  var cancelBtn = e.target.closest('[data-action="cancel"]');
  if (cancelBtn) {
    var resId = cancelBtn.closest('[data-reservation-id]').dataset.reservationId;
    cancelReservation(resId);
  }

  var detailBtn = e.target.closest('[data-action="detail"]');
  if (detailBtn) {
    var fieldId = detailBtn.closest('[data-field-id]').dataset.fieldId;
    Router.navigate('saha_detay', { id: fieldId });
  }

  var removeFavBtn = e.target.closest('[data-action="remove-favorite"]');
  if (removeFavBtn) {
    var fId = removeFavBtn.dataset.fieldId;
    removeFavorite(fId);
  }
}

async function cancelReservation(id) {
  if (!confirm('Bu rezervasyonu iptal etmek istediğinizden emin misiniz?')) return;

  try {
    await api.patch('/reservations/' + id, { status: 'cancelled' });
    showToast('Rezervasyon iptal edildi.');
    loadTab('upcoming');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function removeFavorite(fieldId) {
  try {
    await api.del('/favorites/' + fieldId);
    showToast('Favorilerden kaldırıldı.');
    loadTab('favorites');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderReservationCard(r, showCancel) {
  var image = (r.images && r.images[0]) ? r.images[0] : DEFAULT_IMAGE;
  var isCancelled = r.status === 'cancelled';
  var statusColor = isCancelled ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary';
  var statusText = isCancelled ? 'İptal' : 'Onaylandı';

  return '<div class="bg-white dark:bg-slate-800/50 rounded-xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow group" data-reservation-id="' + r.id + '" data-field-id="' + r.field_id + '">' +
    '<div class="flex flex-col sm:flex-row h-full">' +
    '<div class="w-full sm:w-48 h-48 sm:h-auto overflow-hidden">' +
    '<img src="' + image + '" onerror="this.src=\'' + DEFAULT_IMAGE + '\'" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="' + r.field_name + '">' +
    '</div>' +
    '<div class="flex-1 p-5 flex flex-col justify-between">' +
    '<div>' +
    '<div class="flex justify-between items-start mb-2">' +
    '<h3 class="font-bold text-lg">' + r.field_name + '</h3>' +
    '<span class="' + statusColor + ' text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">' + statusText + '</span>' +
    '</div>' +
    '<div class="space-y-2 mb-4">' +
    '<div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">' +
    '<span class="material-symbols-outlined text-sm text-primary">calendar_today</span>' +
    formatDateShort(r.date) + ', ' + r.start_time + ' - ' + r.end_time +
    '</div>' +
    '<div class="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">' +
    '<span class="material-symbols-outlined text-sm text-primary">location_on</span>' +
    r.district + ', ' + r.city +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="flex gap-2">' +
    '<button data-action="detail" class="flex-1 py-2 px-3 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">Detaylar</button>' +
    (showCancel && !isCancelled ? '<button data-action="cancel" class="flex-1 py-2 px-3 border border-red-500/20 text-red-500 rounded-lg text-sm font-bold hover:bg-red-500 hover:text-white transition-all">İptal Et</button>' : '') +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function renderFavoriteCard(f) {
  var image = (f.images && f.images[0]) ? f.images[0] : DEFAULT_IMAGE;
  return '<div class="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-primary/10 flex flex-col gap-3 cursor-pointer" onclick="Router.navigate(\'saha_detay\', {id:' + f.id + '})">' +
    '<div class="aspect-video rounded-lg overflow-hidden relative">' +
    '<img src="' + image + '" onerror="this.src=\'' + DEFAULT_IMAGE + '\'" class="w-full h-full object-cover" alt="' + f.name + '">' +
    '<button data-action="remove-favorite" data-field-id="' + f.id + '" class="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 text-red-500 p-1 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all" onclick="event.stopPropagation()">' +
    '<span class="material-symbols-outlined text-sm" style="font-variation-settings:\'FILL\' 1">favorite</span>' +
    '</button>' +
    '</div>' +
    '<div>' +
    '<p class="font-bold text-sm truncate">' + f.name + '</p>' +
    '<p class="text-slate-500 text-xs">' + f.district + '</p>' +
    '</div>' +
    '</div>';
}
