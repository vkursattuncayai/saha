const supabase = require('../database');

exports.createReservation = async (req, res) => {
  const { field_id, slot_id, date } = req.body;
  const user_id = req.user.id;

  if (!field_id || !slot_id || !date) {
    return res.status(400).json({ message: 'Saha, saat dilimi ve tarih zorunludur.' });
  }

  try {
    // Atomic reservation via PostgreSQL RPC (FOR UPDATE lock inside)
    const { data, error } = await supabase.rpc('create_reservation', {
      p_user_id: user_id,
      p_field_id: Number(field_id),
      p_slot_id: Number(slot_id),
      p_date: date
    });

    if (error) {
      const status = error.message.includes('müsait değil') ? 409 : 500;
      return res.status(status).json({ message: error.message });
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    const user_id = req.user.id;

    let query = supabase
      .from('reservations')
      .select('*, sports_fields(name, city, district, images, price_per_hour)')
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (status) query = query.eq('status', status);

    const today = new Date().toISOString().split('T')[0];
    if (upcoming === 'true') {
      query = query.gte('date', today).neq('status', 'cancelled');
    } else if (upcoming === 'false') {
      query = query.or(`date.lt.${today},status.eq.cancelled`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const rows = (data || []).map(r => ({
      ...r,
      field_name: r.sports_fields?.name,
      city: r.sports_fields?.city,
      district: r.sports_fields?.district,
      images: r.sports_fields?.images,
      price_per_hour: r.sports_fields?.price_per_hour,
      sports_fields: undefined
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const { status } = req.body;
    const user_id = req.user.id;
    const { id } = req.params;

    if (status !== 'cancelled') {
      return res.status(400).json({ message: 'Yalnızca iptal işlemi desteklenmektedir.' });
    }

    const { data: reservation, error: findErr } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (findErr) throw new Error(findErr.message);
    if (!reservation) return res.status(404).json({ message: 'Rezervasyon bulunamadı.' });
    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Bu rezervasyon zaten iptal edilmiş.' });
    }

    const { error: updateErr } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateErr) throw new Error(updateErr.message);

    await supabase
      .from('time_slots')
      .update({ is_available: true, reservation_id: null })
      .eq('reservation_id', id);

    res.json({ message: 'Rezervasyon başarıyla iptal edildi.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
