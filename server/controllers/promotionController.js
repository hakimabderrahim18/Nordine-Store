import Promotion from '../models/Promotion.js';

// @desc    Get active promotions (public)
// @route   GET /api/promotions
// @access  Public
export const getActivePromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, promotions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all promotions (admin)
// @route   GET /api/promotions/all
// @access  Private/Admin
export const getAllPromotions = async (req, res, next) => {
  try {
    const promotions = await Promotion.find({}).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, promotions });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a promotion
// @route   POST /api/promotions
// @access  Private/Admin
export const createPromotion = async (req, res, next) => {
  try {
    const { title, subtitle, badge, discountText, link, isActive, order } = req.body;
    const image = req.body.image || '';

    if (!image) {
      res.status(400);
      throw new Error('Veuillez télécharger une image pour la promotion');
    }

    const promotion = await Promotion.create({
      image,
      title: title || '',
      subtitle: subtitle || '',
      badge: badge || 'PROMO',
      discountText: discountText || '',
      link: link || '/shop',
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      order: order ? Number(order) : 0
    });

    res.status(201).json({ success: true, promotion });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a promotion
// @route   PUT /api/promotions/:id
// @access  Private/Admin
export const updatePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      res.status(404);
      throw new Error('Promotion introuvable');
    }

    const { title, subtitle, badge, discountText, link, isActive, order } = req.body;

    if (req.body.image) {
      promotion.image = req.body.image;
    }
    if (title !== undefined) promotion.title = title;
    if (subtitle !== undefined) promotion.subtitle = subtitle;
    if (badge !== undefined) promotion.badge = badge;
    if (discountText !== undefined) promotion.discountText = discountText;
    if (link !== undefined) promotion.link = link;
    if (isActive !== undefined) {
      promotion.isActive = isActive === 'true' || isActive === true;
    }
    if (order !== undefined) promotion.order = Number(order);

    await promotion.save();
    res.json({ success: true, promotion });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle promotion active state
// @route   PATCH /api/promotions/:id/toggle
// @access  Private/Admin
export const togglePromotionActive = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      res.status(404);
      throw new Error('Promotion introuvable');
    }

    promotion.isActive = !promotion.isActive;
    await promotion.save();

    res.json({
      success: true,
      isActive: promotion.isActive,
      message: `Promotion ${promotion.isActive ? 'activée (affichée)' : 'désactivée (masquée)'} avec succès`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a promotion
// @route   DELETE /api/promotions/:id
// @access  Private/Admin
export const deletePromotion = async (req, res, next) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      res.status(404);
      throw new Error('Promotion introuvable');
    }

    await Promotion.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Promotion supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};
