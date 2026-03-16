const supabase = require('../database');
const crypto = require('crypto');

exports.createPayment = async (req, res) => {
  try {
    const { reservation_id, card_holder, card_number, expiry, cvv } = req.body;
    const user_id = req.user.id;

    if (!reservation_id || !card_holder || !card_number || !expiry || !cvv) {
      return res.status(400).json({ message: 'Tüm ödeme alanları zorunludur.' });
    }

    const { data: reservation, error: findErr } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservation_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!reservation) return res.status(404).json({ message: 'Rezervasyon bulunamadı.' });

    const cleanCard = card_number.replace(/\s/g, '');
    if (cleanCard.length !== 16 || !/^\d+$/.test(cleanCard)) {
      return res.status(400).json({ message: 'Geçersiz kart numarası.' });
    }

    const transaction_id = 'TXN' + crypto.randomBytes(8).toString('hex').toUpperCase();

    const { data, error } = await supabase
      .from('payments')
      .insert({
        reservation_id,
        amount: reservation.total_price,
        payment_method: 'credit_card',
        status: 'success',
        transaction_id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    res.status(201).json({ ...data, message: 'Ödeme başarıyla tamamlandı.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPayment = async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('payments')
      .select('*, reservations!inner(user_id)')
      .eq('id', req.params.id)
      .eq('reservations.user_id', req.user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!payment) return res.status(404).json({ message: 'Ödeme bulunamadı.' });

    const { reservations, ...safePayment } = payment;
    res.json(safePayment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
