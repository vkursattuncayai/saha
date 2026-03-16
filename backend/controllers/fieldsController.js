const supabase = require('../database');

exports.getFields = async (req, res) => {
  try {
    const {
      city, district, min_price, max_price, field_type,
      min_rating = 0, sort = 'rating', page = 1, limit = 9
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('sports_fields')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    if (city) query = query.eq('city', city);
    if (district) query = query.eq('district', district);
    if (min_price) query = query.gte('price_per_hour', Number(min_price));
    if (max_price) query = query.lte('price_per_hour', Number(max_price));
    if (field_type) query = query.eq('field_type', field_type);
    if (Number(min_rating) > 0) query = query.gte('rating', Number(min_rating));

    const sortMap = {
      rating: { column: 'rating', ascending: false },
      price_asc: { column: 'price_per_hour', ascending: true },
      price_desc: { column: 'price_per_hour', ascending: false },
      newest: { column: 'created_at', ascending: false },
      popular: { column: 'reviews_count', ascending: false }
    };
    const s = sortMap[sort] || { column: 'rating', ascending: false };
    query = query.order(s.column, { ascending: s.ascending });

    query = query.range(offset, offset + limitNum - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    res.json({
      data: data || [],
      total: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getFieldById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sports_fields')
      .select('*')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return res.status(404).json({ message: 'Saha bulunamadı.' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Tarih parametresi zorunludur.' });

    const { data, error } = await supabase
      .from('time_slots')
      .select('id, start_time, end_time, is_available')
      .eq('field_id', req.params.id)
      .eq('date', date)
      .order('start_time');

    if (error) throw new Error(error.message);
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
