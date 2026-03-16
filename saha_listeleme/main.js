// Saha Listeleme JavaScript

var currentPage = 1;
var currentRating = 0;
var debounceTimer = null;
var DEFAULT_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWaDjz7xB2txRyfjhcw40KwVC3IfjRxehCmLFLHxBn4aP3jjcScvC2BCDGKL6UZ3FDqWmpiwgeq3SGoOFtdDScCvdlmz7gqyOLLJk4_FxLQv3MY6dsw2cWqppGzcfS82lQPAJhrGOQ2deQa00I6vSx5yPgaGzZayYTH4tgJqB3t-89lsZBH5avvhh12cLZxmPm9RMIZGEJsfmOpVbjfLUSMlyFavg8PaUmjN9Wxaucz3-Z815TlxSlwYyNtPEHVVop9ist0gUfc7U';

document.addEventListener('DOMContentLoaded', async function () {
  loadAuthModal();
  initDarkMode();
  updateNavForAuthState();
  prefillFiltersFromUrl();
  bindFilterEvents();
  loadFields();
});

function prefillFiltersFromUrl() {
  var city = Router.getParam('city');
  var district = Router.getParam('district');

  if (city) {
    var citySelect = document.getElementById('filter-city');
    if (citySelect) citySelect.value = city;
  }
  if (district) {
    var districtSelect = document.getElementById('filter-district');
    if (districtSelect) districtSelect.value = district;
  }
}

function bindFilterEvents() {
  ['filter-city', 'filter-district', 'sort-select'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', debounceLoad);
  });

  ['filter-type-acik', 'filter-type-kapali'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('change', debounceLoad);
  });

  var priceSlider = document.getElementById('filter-max-price');
  var priceDisplay = document.getElementById('price-display');
  if (priceSlider) {
    priceSlider.addEventListener('input', function () {
      if (priceDisplay) priceDisplay.textContent = '₺' + this.value + (this.value == 1000 ? '+' : '');
      debounceLoad();
    });
  }

  // Rating butonları
  [['filter-rating-4', 4], ['filter-rating-45', 4.5]].forEach(function (pair) {
    var btn = document.getElementById(pair[0]);
    if (btn) btn.addEventListener('click', function () {
      var val = pair[1];
      if (currentRating === val) {
        currentRating = 0;
        btn.classList.remove('bg-primary', 'text-white');
        btn.classList.add('bg-primary/10', 'text-primary');
      } else {
        currentRating = val;
        // Tüm rating butonlarını sıfırla
        document.querySelectorAll('[data-rating]').forEach(function (b) {
          b.classList.remove('bg-primary', 'text-white');
          b.classList.add('bg-primary/10', 'text-primary');
        });
        btn.classList.add('bg-primary', 'text-white');
        btn.classList.remove('bg-primary/10', 'text-primary');
      }
      currentPage = 1;
      loadFields();
    });
  });

  var clearBtn = document.getElementById('filter-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      document.getElementById('filter-city').value = '';
      document.getElementById('filter-district').value = '';
      document.getElementById('filter-max-price').value = 1000;
      document.getElementById('price-display').textContent = '₺1000+';
      document.getElementById('filter-type-acik').checked = false;
      document.getElementById('filter-type-kapali').checked = false;
      currentRating = 0;
      document.querySelectorAll('[data-rating]').forEach(function (b) {
        b.classList.remove('bg-primary', 'text-white');
        b.classList.add('bg-primary/10', 'text-primary');
      });
      currentPage = 1;
      loadFields();
    });
  }
}

function debounceLoad() {
  currentPage = 1;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadFields, 300);
}

function buildParams() {
  var params = { page: currentPage, limit: 9 };

  var city = document.getElementById('filter-city').value;
  var district = document.getElementById('filter-district').value;
  var maxPrice = document.getElementById('filter-max-price').value;
  var sortVal = document.getElementById('sort-select').value;
  var acik = document.getElementById('filter-type-acik').checked;
  var kapali = document.getElementById('filter-type-kapali').checked;

  if (city) params.city = city;
  if (district) params.district = district;
  if (maxPrice < 1000) params.max_price = maxPrice;
  if (acik && !kapali) params.field_type = 'Açık Saha';
  if (kapali && !acik) params.field_type = 'Kapalı Saha';
  if (currentRating > 0) params.min_rating = currentRating;
  if (sortVal) params.sort = sortVal;

  return params;
}

async function loadFields() {
  var grid = document.getElementById('fields-grid');
  var countEl = document.getElementById('fields-count');

  if (grid) {
    grid.innerHTML = '<div class="col-span-3 text-center py-12 text-slate-400"><span class="material-symbols-outlined text-4xl animate-spin">sports_soccer</span><p class="mt-2">Yükleniyor...</p></div>';
  }

  try {
    var params = buildParams();
    var result = await api.get('/fields?' + new URLSearchParams(params).toString());

    if (countEl) {
      countEl.textContent = result.total + ' saha bulundu.';
    }

    if (!result.data || result.data.length === 0) {
      grid.innerHTML = '<div class="col-span-3 text-center py-16 text-slate-400"><span class="material-symbols-outlined text-5xl">search_off</span><p class="mt-3 text-lg font-medium">Bu kriterlere uygun saha bulunamadı.</p><p class="text-sm">Filtreleri değiştirmeyi deneyin.</p></div>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = result.data.map(function (f) {
      var image = (f.images && f.images[0]) ? f.images[0] : DEFAULT_IMAGE;
      var typeBg = f.field_type === 'Kapalı Saha' ? 'bg-slate-800' : 'bg-primary';
      return '<div class="group relative flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-primary/10 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer" onclick="Router.navigate(\'saha_detay\', {id:' + f.id + '})">' +
        '<div class="relative aspect-[4/3] overflow-hidden rounded-t-2xl">' +
        '<div class="absolute top-3 left-3 z-10 rounded-lg ' + typeBg + ' px-3 py-1 text-xs font-bold text-white">' + f.field_type + '</div>' +
        '<div class="absolute top-3 right-3 z-10 rounded-lg bg-black/50 backdrop-blur-md px-2 py-1 text-xs font-bold text-white flex items-center gap-1">' +
        '<span class="material-symbols-outlined text-yellow-400 text-sm" style="font-variation-settings:\'FILL\' 1">star</span> ' + f.rating +
        '</div>' +
        '<img class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" src="' + image + '" onerror="this.src=\'' + DEFAULT_IMAGE + '\'" alt="' + f.name + '">' +
        '</div>' +
        '<div class="p-5 flex flex-col flex-1">' +
        '<div class="mb-2">' +
        '<h3 class="text-lg font-bold group-hover:text-primary transition-colors">' + f.name + '</h3>' +
        '<p class="text-sm text-slate-500 flex items-center gap-1"><span class="material-symbols-outlined text-base">location_on</span>' + f.district + ', ' + f.city + '</p>' +
        '</div>' +
        '<div class="mt-auto pt-4 border-t border-primary/5 flex items-center justify-between">' +
        '<div><span class="text-xs text-slate-400 font-medium">Saatlik Başlayan</span><p class="text-xl font-extrabold text-primary">₺' + f.price_per_hour + '</p></div>' +
        '<button class="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20" onclick="event.stopPropagation(); Router.navigate(\'saha_detay\', {id:' + f.id + '})">Rezervasyon Yap</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    renderPagination(result.page, result.totalPages);
  } catch (err) {
    if (grid) grid.innerHTML = '<div class="col-span-3 text-center py-12 text-red-400"><p>Sahalar yüklenirken hata oluştu: ' + err.message + '</p></div>';
    console.error(err);
  }
}

function renderPagination(currentPg, totalPages) {
  var container = document.getElementById('pagination');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  var html = '';

  html += '<button onclick="changePage(' + (currentPg - 1) + ')" class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-white dark:bg-slate-900 hover:bg-primary/10 transition-colors' + (currentPg === 1 ? ' opacity-50 cursor-not-allowed' : '') + '" ' + (currentPg === 1 ? 'disabled' : '') + '><span class="material-symbols-outlined">chevron_left</span></button>';

  for (var i = 1; i <= totalPages; i++) {
    if (i === currentPg) {
      html += '<button class="h-10 w-10 rounded-lg bg-primary text-sm font-bold text-white">' + i + '</button>';
    } else if (i === 1 || i === totalPages || Math.abs(i - currentPg) <= 1) {
      html += '<button onclick="changePage(' + i + ')" class="h-10 w-10 rounded-lg border border-primary/10 bg-white dark:bg-slate-900 text-sm font-bold hover:bg-primary/10 transition-colors">' + i + '</button>';
    } else if (Math.abs(i - currentPg) === 2) {
      html += '<span class="px-2 text-slate-400">...</span>';
    }
  }

  html += '<button onclick="changePage(' + (currentPg + 1) + ')" class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/10 bg-white dark:bg-slate-900 hover:bg-primary/10 transition-colors' + (currentPg === totalPages ? ' opacity-50 cursor-not-allowed' : '') + '" ' + (currentPg === totalPages ? 'disabled' : '') + '><span class="material-symbols-outlined">chevron_right</span></button>';

  container.innerHTML = html;
}

function changePage(page) {
  if (page < 1) return;
  currentPage = page;
  loadFields();
  window.scrollTo(0, 0);
}

// loadAuthModal artık ui.js'de global olarak tanımlı
