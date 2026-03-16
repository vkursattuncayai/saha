const supabase = require('../database');

exports.getFavorites = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('id, sports_fields(*)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data || []).map(f => ({
      ...f.sports_fields,
      favorite_id: f.id
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { field_id } = req.body;
    if (!field_id) return res.status(400).json({ message: 'Saha ID zorunludur.' });

    const { data: field } = await supabase
      .from('sports_fields')
      .select('id')
      .eq('id', field_id)
      .maybeSingle();

    if (!field) return res.status(404).json({ message: 'Saha bulunamadı.' });

    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('field_id', field_id)
      .maybeSingle();

    if (existing) return res.status(409).json({ message: 'Bu saha zaten favorilerinizde.' });

    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: req.user.id, field_id })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    res.status(201).json({ id: data.id, field_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('field_id', req.params.fieldId)
      .maybeSingle();

    if (!existing) return res.status(404).json({ message: 'Favori bulunamadı.' });

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('field_id', req.params.fieldId);

    if (error) throw new Error(error.message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('field_id', req.params.fieldId)
      .maybeSingle();

    res.json({ isFavorite: !!data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
