const supabase = require('../database');

exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const [
      { count: activeFields },
      { count: totalUsers },
      { count: totalReservations },
      { data: payments },
      { count: monthReservations }
    ] = await Promise.all([
      supabase.from('sports_fields').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_admin', false),
      supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('payments').select('amount').eq('status', 'success'),
      supabase.from('reservations').select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed').gte('date', startOfMonth).lte('date', endOfMonth)
    ]);

    const totalRevenue = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    res.json({
      active_fields: activeFields || 0,
      total_users: totalUsers || 0,
      total_reservations: totalReservations || 0,
      total_revenue: totalRevenue,
      reservations_this_month: monthReservations || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFields = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sports_fields')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createField = async (req, res) => {
  try {
    const { name, city, district, address, price_per_hour, field_type, capacity, description, amenities, images } = req.body;
    if (!name || !city || !district || !address || !price_per_hour || !field_type) {
      return res.status(400).json({ message: 'Ad, şehir, ilçe, adres, fiyat ve saha tipi zorunludur.' });
    }

    const { data, error } = await supabase
      .from('sports_fields')
      .insert({
        name, city, district, address,
        price_per_hour: Number(price_per_hour),
        field_type,
        capacity: capacity || null,
        description: description || null,
        amenities: amenities || [],
        images: images || []
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateField = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, price_per_hour, name, description } = req.body;

    const updates = {};
    if (is_active !== undefined) updates.is_active = is_active;
    if (price_per_hour !== undefined) updates.price_per_hour = price_per_hour;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Güncellenecek alan yok.' });
    }

    const { data, error } = await supabase
      .from('sports_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ message: 'Saha bulunamadı.' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, sports_fields(name), users(name, email)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    const rows = (data || []).map(r => ({
      ...r,
      field_name: r.sports_fields?.name,
      user_name: r.users?.name,
      user_email: r.users?.email,
      sports_fields: undefined,
      users: undefined
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, is_admin, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
