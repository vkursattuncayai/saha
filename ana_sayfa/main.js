// Ana Sayfa JavaScript

var FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80';

var ALL_CITIES = ['Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin','Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta','İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kilis','Kırıkkale','Kırklareli','Kırşehir','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin','Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun','Şanlıurfa','Siirt','Sinop','Sivas','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak','Van','Yalova','Yozgat','Zonguldak'];

function normalizeTr(str) {
  return (str || '').toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/İ/g,'i').replace(/Ğ/g,'g').replace(/Ü/g,'u')
    .replace(/Ş/g,'s').replace(/Ö/g,'o').replace(/Ç/g,'c');
}

function initSmartSearch() {
  var input = document.getElementById('hero-location');
  var box = document.getElementById('hero-suggestions');
  if (!input || !box) return;

  input.addEventListener('input', function () {
    var val = this.value.trim();
    if (!val) { box.classList.add('hidden'); return; }
    var norm = normalizeTr(val);
    var matches = ALL_CITIES.filter(function (c) {
      return normalizeTr(c).indexOf(norm) === 0;
    });
    // also include contains-matches if not enough starts-with
    if (matches.length < 3) {
      ALL_CITIES.forEach(function (c) {
        if (matches.indexOf(c) === -1 && normalizeTr(c).indexOf(norm) !== -1) matches.push(c);
      });
    }
    matches = matches.slice(0, 6);
    if (!matches.length) { box.classList.add('hidden'); return; }
    box.innerHTML = matches.map(function (c) {
      return '<button type="button" class="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2">' +
        '<span class="material-symbols-outlined text-primary text-sm">location_on</span>' + c + '</button>';
    }).join('');
    box.classList.remove('hidden');
    box.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = this.textContent.trim();
        box.classList.add('hidden');
      });
    });
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !box.contains(e.target)) box.classList.add('hidden');
  });
}

document.addEventListener('DOMContentLoaded', async function () {
  // Auth modal yükle
  loadAuthModal();

  // Dark mode başlat
  initDarkMode();

  // Nav durumunu güncelle
  updateNavForAuthState();
  initMobileMenu();

  // Bugünün tarihini varsayılan olarak ayarla
  var dateInput = document.getElementById('hero-date');
  if (dateInput) {
    var today = new Date();
    dateInput.value = today.toISOString().split('T')[0];
    dateInput.min = today.toISOString().split('T')[0];
  }

  // Arama butonu
  var searchBtn = document.getElementById('hero-search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', function () {
      var city = (document.getElementById('hero-location').value || '').trim();
      var date = document.getElementById('hero-date').value || '';
      var time = document.getElementById('hero-time').value || '';
      var params = {};
      if (city) params.city = city;
      if (date) params.date = date;
      if (time) params.time = time;
      Router.navigate('saha_listeleme', params);
    });
  }

  // Akıllı şehir araması
  initSmartSearch();

  // Enter tuşu ile arama
  var locationInput = document.getElementById('hero-location');
  if (locationInput) {
    locationInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('hero-search-btn').click();
    });
  }

  // Nav "Saha Bul" butonu
  var ctaBtn = document.querySelector('[onclick="Router.navigate(\'saha_listeleme\')"]');

  // CTA rezervasyon butonu
  document.querySelectorAll('button').forEach(function (btn) {
    if (btn.textContent.trim() === 'Şimdi Rezervasyon Yap') {
      btn.addEventListener('click', function () {
        Router.navigate('saha_listeleme');
      });
    }
  });

  // Rezervasyonlarım linki
  var panelLink2 = document.getElementById('nav-panel-link-2');
  if (panelLink2) {
    panelLink2.addEventListener('click', function (e) {
      e.preventDefault();
      if (!Auth.isLoggedIn()) {
        openAuthModal('login');
      } else {
        Router.navigate('kullan_c_paneli');
      }
    });
  }

  // Popüler sahaları yükle
  loadPopularFields();
});

async function loadPopularFields() {
  var grid = document.getElementById('popular-fields-grid');
  if (!grid) return;

  try {
    var result = await api.get('/fields?sort=rating&limit=6');
    var fields = result.data;

    if (!fields || fields.length === 0) return;

    grid.innerHTML = fields.map(function (f) {
      var image = (f.images && f.images[0]) ? f.images[0] : FALLBACK_IMAGE;
      var amenities = (f.amenities || []).slice(0, 3);
      return '<div class="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 cursor-pointer" onclick="Router.navigate(\'saha_detay\', {id:' + f.id + '})">' +
        '<div class="relative h-56 w-full overflow-hidden">' +
        '<img alt="' + f.name + '" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" src="' + image + '" onerror="this.src=\'' + FALLBACK_IMAGE + '\'">' +
        '<div class="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">' + f.rating + ' ★</div>' +
        '</div>' +
        '<div class="p-5">' +
        '<div class="mb-2 flex items-center justify-between">' +
        '<h4 class="text-xl font-bold">' + f.name + '</h4>' +
        '<span class="text-lg font-bold text-primary">₺' + f.price_per_hour + '<span class="text-xs font-normal text-slate-500">/saat</span></span>' +
        '</div>' +
        '<div class="mb-4 flex items-center gap-1 text-sm text-slate-500">' +
        '<span class="material-symbols-outlined text-sm">location_on</span>' + f.district + ', ' + f.city +
        '</div>' +
        '<div class="flex flex-wrap gap-2">' +
        amenities.map(function (a) { return '<span class="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">' + a + '</span>'; }).join('') +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');
  } catch (err) {
    // Hata durumunda statik içerik kalır
    console.error('Popüler sahalar yüklenemedi:', err.message);
  }
}

// loadAuthModal artık ui.js'de global olarak tanımlı
