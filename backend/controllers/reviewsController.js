const supabase = require('../database');

exports.getReviews = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, users(name, profile_image)')
      .eq('field_id', req.params.fieldId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    const rows = (data || []).map(r => ({
      ...r,
      user_name: r.users?.name,
      user_image: r.users?.profile_image,
      users: undefined
    }));

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { field_id, rating, comment } = req.body;
    const user_id = req.user.id;

    if (!field_id || !rating) {
      return res.status(400).json({ message: 'Saha ID ve puan zorunludur.' });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('field_id', field_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: 'Bu saha için zaten yorum yapmışsınız.' });
    }

    const { data: newReview, error: insertErr } = await supabase
      .from('reviews')
      .insert({ field_id, user_id, rating, comment: comment || null })
      .select('id')
      .single();

    if (insertErr) throw new Error(insertErr.message);

    // Ortalama puanı güncelle
    const { data: allRatings } = await supabase
      .from('reviews')
      .select('rating')
      .eq('field_id', field_id);

    if (allRatings && allRatings.length > 0) {
      const avg = allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length;
      await supabase
        .from('sports_fields')
        .update({
          rating: Math.round(avg * 10) / 10,
          reviews_count: allRatings.length
        })
        .eq('id', field_id);
    }

    const { data: full } = await supabase
      .from('reviews')
      .select('*, users(name)')
      .eq('id', newReview.id)
      .single();

    res.status(201).json({
      ...full,
      user_name: full?.users?.name,
      users: undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
