const supabase = require('../database');

exports.getProfile = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, profile_image, is_admin, created_at')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, profile_image } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (profile_image) updates.profile_image = profile_image;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.id);
      if (error) throw new Error(error.message);
    }

    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, profile_image, is_admin, created_at')
      .eq('id', req.user.id)
      .single();

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const user_id = req.user.id;
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: slots, error } = await supabase
      .from('reservations')
      .select('start_time, end_time')
      .eq('user_id', user_id)
      .eq('status', 'confirmed')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (error) throw new Error(error.message);

    const matchesThisMonth = (slots || []).length;
    let totalMinutes = 0;

    for (const s of (slots || [])) {
      const [sh, sm] = s.start_time.split(':').map(Number);
      const [eh, em] = s.end_time.split(':').map(Number);
      totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
    }

    const hoursThisMonth = Math.round(totalMinutes / 60 * 10) / 10;
    const caloriesEstimate = Math.round(totalMinutes * 7.5);

    res.json({
      matches_this_month: matchesThisMonth,
      hours_this_month: hoursThisMonth,
      calories_estimate: caloriesEstimate,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
