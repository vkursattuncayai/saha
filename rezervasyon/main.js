// Rezervasyon / Ödeme Sayfası JavaScript

var pending = null;

document.addEventListener('DOMContentLoaded', function () {
  initDarkMode();
  updateNavForAuthState();
  initMobileMenu();

  // Auth guard
  if (!Auth.isLoggedIn()) {
    sessionStorage.setItem('sahabul_redirect', window.location.href);
    Router.navigate('ana_sayfa');
    return;
  }

  // Bekleyen rezervasyon verisi
  var raw = sessionStorage.getItem('sahabul_pending');
  if (!raw) {
    showToast('Rezervasyon bilgisi bulunamadı. Saha seçimine yönlendiriliyorsunuz.', 'error');
    setTimeout(function () { Router.navigate('saha_listeleme'); }, 2000);
    return;
  }

  pending = JSON.parse(raw);
  populateSummary();
  bindCardInputFormatting();
  bindFormSubmit();
});

function populateSummary() {
  document.getElementById('res-field-name').textContent = pending.fieldName || '-';
  document.getElementById('res-field-location').textContent = pending.fieldLocation || '-';
  document.getElementById('res-date').textContent = formatDateShort(pending.date);
  document.getElementById('res-time').textContent = pending.startTime + ' - ' + pending.endTime;

  var price = pending.price || 0;
  var serviceFee = Math.round(price * 0.037); // ~%3.7 hizmet bedeli
  var total = price + serviceFee;

  document.getElementById('res-base-price').textContent = price.toLocaleString('tr-TR') + ',00 TL';
  document.getElementById('res-service-fee').textContent = serviceFee.toLocaleString('tr-TR') + ',00 TL';
  document.getElementById('res-total').textContent = total.toLocaleString('tr-TR') + ',00 TL';
}

function bindCardInputFormatting() {
  // Kart numarası: XXXX XXXX XXXX XXXX
  var cardInput = document.getElementById('card-number');
  if (cardInput) {
    cardInput.addEventListener('input', function (e) {
      var val = this.value.replace(/\D/g, '').substring(0, 16);
      this.value = val.replace(/(.{4})/g, '$1 ').trim();
    });
  }

  // Son kullanma: MM / YY
  var expiryInput = document.getElementById('card-expiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', function () {
      var val = this.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 3) {
        this.value = val.substring(0, 2) + ' / ' + val.substring(2);
      } else {
        this.value = val;
      }
    });
  }

  // CVV: Sadece rakam, max 3
  var cvvInput = document.getElementById('card-cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '').substring(0, 3);
    });
  }
}

function validateForm() {
  var name = document.getElementById('cardholder-name').value.trim();
  var card = document.getElementById('card-number').value.replace(/\s/g, '');
  var expiry = document.getElementById('card-expiry').value.replace(/\s/g, '');
  var cvv = document.getElementById('card-cvv').value;
  var terms = document.getElementById('terms-checkbox').checked;

  if (!name) { showToast('Kart üzerindeki ismi giriniz.', 'error'); return false; }
  if (card.length !== 16 || !/^\d+$/.test(card)) { showToast('Geçerli bir kart numarası giriniz.', 'error'); return false; }
  if (!expiry || expiry.replace('/', '').length < 4) { showToast('Son kullanma tarihini giriniz.', 'error'); return false; }
  if (cvv.length !== 3) { showToast('CVV 3 haneli olmalıdır.', 'error'); return false; }
  if (!terms) { showToast('Sözleşmeyi onaylamanız gerekiyor.', 'error'); return false; }

  return true;
}

function bindFormSubmit() {
  document.getElementById('payment-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    var submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">autorenew</span> İşleniyor...';

    try {
      // Adım 1: Rezervasyon oluştur
      var reservation = await api.post('/reservations', {
        field_id: parseInt(pending.fieldId),
        slot_id: parseInt(pending.slotId),
        date: pending.date
      });

      // Adım 2: Ödeme işle
      var cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
      await api.post('/payments', {
        reservation_id: reservation.id,
        card_holder: document.getElementById('cardholder-name').value.trim(),
        card_number: cardNumber,
        expiry: document.getElementById('card-expiry').value,
        cvv: document.getElementById('card-cvv').value
      });

      // Başarı
      sessionStorage.removeItem('sahabul_pending');
      showToast('Rezervasyonunuz başarıyla oluşturuldu!');

      submitBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Onaylandı!';
      submitBtn.className = submitBtn.className.replace('bg-primary', 'bg-green-500');

      setTimeout(function () {
        Router.navigate('kullan_c_paneli');
      }, 1500);

    } catch (err) {
      showToast(err.message || 'Ödeme işlemi başarısız oldu.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Rezervasyonu Onayla <span class="material-symbols-outlined">arrow_forward</span>';
    }
  });
}
