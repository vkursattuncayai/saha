// Admin Paneli JavaScript

var currentTab = 'dashboard';
var allReservations = [];

document.addEventListener('DOMContentLoaded', async function () {
  initDarkMode();
  initMobileMenu();

  // Auth + admin guard
  if (!Auth.isLoggedIn()) {
    Router.navigate('ana_sayfa');
    return;
  }
  var user = Auth.getUser();
  if (!user || !user.is_admin) {
    showToast('Bu sayfaya erişim yetkiniz yok.', 'error');
    setTimeout(function () { Router.navigate('ana_sayfa'); }, 1500);
    return;
  }

  // Admin adını göster
  var nameEl = document.getElementById('admin-name');
  if (nameEl) nameEl.textContent = user.name;

  // Çıkış butonları
  ['sidebar-logout-btn', 'mobile-logout-btn'].forEach(function (id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function () { Auth.logout(); });
  });

  // Sidebar nav
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchTab(this.dataset.tab);
      closeMobileSidebar();
    });
  });

  // Mobile sidebar
  var menuBtn = document.getElementById('mobile-menu-btn');
  var overlay = document.getElementById('mobile-sidebar-overlay');
  var mobileSidebar = document.getElementById('mobile-sidebar');
  var closeBtn = document.getElementById('close-mobile-menu');

  if (menuBtn) menuBtn.addEventListener('click', function () {
    mobileSidebar.classList.remove('hidden');
    mobileSidebar.classList.add('flex', 'flex-col');
    overlay.classList.remove('hidden');
  });
  if (overlay) overlay.addEventListener('click', closeMobileSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeMobileSidebar);

  // Rezervasyon filtresi
  var resFilter = document.getElementById('res-status-filter');
  if (resFilter) resFilter.addEventListener('change', renderReservationsTable);

  // Saha ekleme formu
  var addBtn = document.getElementById('add-field-btn');
  var cancelBtn = document.getElementById('cancel-field-btn');
  var saveBtn = document.getElementById('save-field-btn');
  var form = document.getElementById('add-field-form');

  if (addBtn) addBtn.addEventListener('click', function () {
    form.classList.toggle('hidden');
  });
  if (cancelBtn) cancelBtn.addEventListener('click', function () {
    form.classList.add('hidden');
    clearFieldForm();
  });
  if (saveBtn) saveBtn.addEventListener('click', saveNewField);

  // İlk tab yükle
  switchTab('dashboard');
});

function closeMobileSidebar() {
  var sidebar = document.getElementById('mobile-sidebar');
  var overlay = document.getElementById('mobile-sidebar-overlay');
  if (sidebar) { sidebar.classList.add('hidden'); sidebar.classList.remove('flex', 'flex-col'); }
  if (overlay) overlay.classList.add('hidden');
}

function switchTab(tab) {
  currentTab = tab;

  // Tüm tab içeriklerini gizle
  ['dashboard', 'fields', 'reservations', 'users'].forEach(function (t) {
    var el = document.getElementById('tab-' + t);
    if (el) el.classList.add('hidden');
  });

  // Aktif tab'ı göster
  var active = document.getElementById('tab-' + tab);
  if (active) active.classList.remove('hidden');

  // Nav butonlarını güncelle
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(function (btn) {
    if (btn.dataset.tab === tab) {
      btn.classList.add('bg-primary/10', 'text-primary');
      btn.classList.remove('text-slate-600', 'dark:text-slate-400');
    } else {
      btn.classList.remove('bg-primary/10', 'text-primary');
      btn.classList.add('text-slate-600', 'dark:text-slate-400');
    }
  });

  // Başlıklar
  var titles = {
    dashboard: ['Dashboard', 'Genel istatistikler'],
    fields: ['Sahalar', 'Tüm spor sahalarını yönet'],
    reservations: ['Rezervasyonlar', 'Tüm rezervasyonları görüntüle'],
    users: ['Kullanıcılar', 'Kayıtlı kullanıcılar']
  };
  var titleEl = document.getElementById('page-title');
  var subEl = document.getElementById('page-subtitle');
  if (titleEl && titles[tab]) titleEl.textContent = titles[tab][0];
  if (subEl && titles[tab]) subEl.textContent = titles[tab][1];

  // İçeriği yükle
  if (tab === 'dashboard') loadDashboard();
  else if (tab === 'fields') loadFields();
  else if (tab === 'reservations') loadReservations();
  else if (tab === 'users') loadUsers();
}

async function loadDashboard() {
  try {
    var stats = await api.get('/admin/dashboard');
    setEl('stat-fields', stats.active_fields);
    setEl('stat-users', stats.total_users);
    setEl('stat-reservations', stats.total_reservations);
    setEl('stat-revenue', '₺' + stats.total_revenue.toLocaleString('tr-TR'));
  } catch (err) {
    showToast('Dashboard verisi yüklenemedi: ' + err.message, 'error');
  }
}

async function loadFields() {
  var container = document.getElementById('fields-table');
  container.innerHTML = '<div class="text-center py-10 text-slate-400">Yükleniyor...</div>';

  try {
    var fields = await api.get('/admin/fields');
    var label = document.getElementById('fields-count-label');
    if (label) label.textContent = fields.length + ' saha';

    if (!fields.length) {
      container.innerHTML = '<div class="text-center py-10 text-slate-400">Henüz saha yok.</div>';
      return;
    }

    container.innerHTML = '<table class="w-full text-sm">' +
      '<thead class="border-b border-primary/10"><tr class="text-left">' +
      '<th class="px-4 py-3 font-bold text-slate-500">Saha</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500 hidden md:table-cell">Şehir</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500 hidden sm:table-cell">Fiyat</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500">Durum</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500">İşlemler</th>' +
      '</tr></thead>' +
      '<tbody>' +
      fields.map(function (f) {
        var statusBadge = f.is_active
          ? '<span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Aktif</span>'
          : '<span class="bg-red-100 text-red-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Pasif</span>';
        return '<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">' +
          '<td class="px-4 py-3"><p class="font-semibold">' + f.name + '</p><p class="text-xs text-slate-500">' + f.field_type + '</p></td>' +
          '<td class="px-4 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">' + f.district + ', ' + f.city + '</td>' +
          '<td class="px-4 py-3 font-bold text-primary hidden sm:table-cell">₺' + f.price_per_hour + '</td>' +
          '<td class="px-4 py-3">' + statusBadge + '</td>' +
          '<td class="px-4 py-3">' +
          '<button onclick="toggleFieldActive(' + f.id + ',' + f.is_active + ')" class="text-xs px-3 py-1.5 rounded-lg border ' +
          (f.is_active ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-primary/20 text-primary hover:bg-primary/10') +
          ' font-medium transition-all">' +
          (f.is_active ? 'Pasife Al' : 'Aktive Et') + '</button>' +
          '</td></tr>';
      }).join('') +
      '</tbody></table>';
  } catch (err) {
    container.innerHTML = '<div class="text-center py-10 text-red-400">' + err.message + '</div>';
  }
}

async function toggleFieldActive(id, currentlyActive) {
  try {
    await api.patch('/admin/fields/' + id, { is_active: !currentlyActive });
    showToast('Saha durumu güncellendi.');
    loadFields();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadReservations() {
  var container = document.getElementById('reservations-table');
  container.innerHTML = '<div class="text-center py-10 text-slate-400">Yükleniyor...</div>';

  try {
    allReservations = await api.get('/admin/reservations');
    renderReservationsTable();
  } catch (err) {
    container.innerHTML = '<div class="text-center py-10 text-red-400">' + err.message + '</div>';
  }
}

function renderReservationsTable() {
  var container = document.getElementById('reservations-table');
  var filterVal = document.getElementById('res-status-filter') ? document.getElementById('res-status-filter').value : '';

  var filtered = filterVal
    ? allReservations.filter(function (r) { return r.status === filterVal; })
    : allReservations;

  var label = document.getElementById('res-count-label');
  if (label) label.textContent = filtered.length + ' rezervasyon';

  if (!filtered.length) {
    container.innerHTML = '<div class="text-center py-10 text-slate-400">Rezervasyon bulunamadı.</div>';
    return;
  }

  container.innerHTML = '<table class="w-full text-sm">' +
    '<thead class="border-b border-primary/10"><tr class="text-left">' +
    '<th class="px-4 py-3 font-bold text-slate-500">Kullanıcı</th>' +
    '<th class="px-4 py-3 font-bold text-slate-500 hidden md:table-cell">Saha</th>' +
    '<th class="px-4 py-3 font-bold text-slate-500 hidden sm:table-cell">Tarih & Saat</th>' +
    '<th class="px-4 py-3 font-bold text-slate-500">Tutar</th>' +
    '<th class="px-4 py-3 font-bold text-slate-500">Durum</th>' +
    '</tr></thead>' +
    '<tbody>' +
    filtered.map(function (r) {
      var statusBadge = r.status === 'confirmed'
        ? '<span class="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Onaylı</span>'
        : '<span class="bg-red-100 text-red-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">İptal</span>';
      var dateStr = r.date ? (typeof r.date === 'string' ? r.date.split('T')[0] : r.date) : '-';
      return '<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">' +
        '<td class="px-4 py-3"><p class="font-semibold">' + (r.user_name || '-') + '</p><p class="text-xs text-slate-500">' + (r.user_email || '') + '</p></td>' +
        '<td class="px-4 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">' + (r.field_name || '-') + '</td>' +
        '<td class="px-4 py-3 hidden sm:table-cell"><p class="font-medium">' + dateStr + '</p><p class="text-xs text-slate-500">' + r.start_time + ' - ' + r.end_time + '</p></td>' +
        '<td class="px-4 py-3 font-bold text-slate-700 dark:text-slate-300">₺' + Number(r.total_price).toLocaleString('tr-TR') + '</td>' +
        '<td class="px-4 py-3">' + statusBadge + '</td>' +
        '</tr>';
    }).join('') +
    '</tbody></table>';
}

async function loadUsers() {
  var container = document.getElementById('users-table');
  container.innerHTML = '<div class="text-center py-10 text-slate-400">Yükleniyor...</div>';

  try {
    var users = await api.get('/admin/users');
    var label = document.getElementById('users-count-label');
    if (label) label.textContent = users.length + ' kullanıcı';

    if (!users.length) {
      container.innerHTML = '<div class="text-center py-10 text-slate-400">Kullanıcı bulunamadı.</div>';
      return;
    }

    container.innerHTML = '<table class="w-full text-sm">' +
      '<thead class="border-b border-primary/10"><tr class="text-left">' +
      '<th class="px-4 py-3 font-bold text-slate-500">İsim</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500 hidden sm:table-cell">E-posta</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500 hidden md:table-cell">Telefon</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500">Rol</th>' +
      '<th class="px-4 py-3 font-bold text-slate-500 hidden lg:table-cell">Kayıt Tarihi</th>' +
      '</tr></thead>' +
      '<tbody>' +
      users.map(function (u) {
        var roleBadge = u.is_admin
          ? '<span class="bg-amber-100 text-amber-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Admin</span>'
          : '<span class="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg uppercase">Üye</span>';
        var created = u.created_at ? new Date(u.created_at).toLocaleDateString('tr-TR') : '-';
        return '<tr class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">' +
          '<td class="px-4 py-3"><div class="flex items-center gap-2">' +
          '<div class="size-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-xs">' +
          u.name.split(' ').map(function (w) { return w[0]; }).join('').substring(0, 2).toUpperCase() + '</div>' +
          '<p class="font-semibold">' + u.name + '</p></div></td>' +
          '<td class="px-4 py-3 text-slate-600 dark:text-slate-400 hidden sm:table-cell">' + u.email + '</td>' +
          '<td class="px-4 py-3 text-slate-600 dark:text-slate-400 hidden md:table-cell">' + (u.phone || '-') + '</td>' +
          '<td class="px-4 py-3">' + roleBadge + '</td>' +
          '<td class="px-4 py-3 text-slate-500 hidden lg:table-cell">' + created + '</td>' +
          '</tr>';
      }).join('') +
      '</tbody></table>';
  } catch (err) {
    container.innerHTML = '<div class="text-center py-10 text-red-400">' + err.message + '</div>';
  }
}

async function saveNewField() {
  var name = document.getElementById('new-field-name').value.trim();
  var city = document.getElementById('new-field-city').value.trim();
  var district = document.getElementById('new-field-district').value.trim();
  var address = document.getElementById('new-field-address').value.trim();
  var price = document.getElementById('new-field-price').value;
  var type = document.getElementById('new-field-type').value;
  var capacity = document.getElementById('new-field-capacity').value.trim();
  var amenitiesStr = document.getElementById('new-field-amenities').value;
  var description = document.getElementById('new-field-description').value.trim();

  if (!name || !city || !district || !address || !price || !type) {
    showToast('Lütfen zorunlu alanları doldurun.', 'error');
    return;
  }

  var amenities = amenitiesStr ? amenitiesStr.split(',').map(function (a) { return a.trim(); }).filter(Boolean) : [];

  try {
    var btn = document.getElementById('save-field-btn');
    btn.disabled = true;
    btn.textContent = 'Kaydediliyor...';

    await api.post('/admin/fields', {
      name, city, district, address,
      price_per_hour: Number(price),
      field_type: type,
      capacity: capacity || null,
      description: description || null,
      amenities
    });

    showToast('Saha başarıyla eklendi!');
    document.getElementById('add-field-form').classList.add('hidden');
    clearFieldForm();
    loadFields();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    var btn = document.getElementById('save-field-btn');
    btn.disabled = false;
    btn.textContent = 'Kaydet';
  }
}

function clearFieldForm() {
  ['new-field-name', 'new-field-city', 'new-field-district', 'new-field-address',
   'new-field-price', 'new-field-capacity', 'new-field-amenities', 'new-field-description'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  var typeEl = document.getElementById('new-field-type');
  if (typeEl) typeEl.value = '';
}

function setEl(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}
