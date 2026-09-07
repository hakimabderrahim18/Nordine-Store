import CarouselImage from '../models/CarouselImage.js';

// @desc    Get all carousel images
// @route   GET /api/carousel
// @access  Public
export const getCarouselImages = async (req, res, next) => {
  try {
    const images = await CarouselImage.find({}).sort({ createdAt: -1 });
    res.json({ success: true, images });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new image to the carousel
// @route   POST /api/carousel
// @access  Private/Admin
export const addCarouselImage = async (req, res, next) => {
  try {
    const { title, link } = req.body;
    const image = req.body.image || ''; // Filled by uploadImages middleware

    if (!image) {
      res.status(400);
      throw new Error('Veuillez télécharger une image');
    }

    const newImage = await CarouselImage.create({
      image,
      title,
      link
    });

    res.status(201).json({ success: true, image: newImage });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a carousel image
// @route   DELETE /api/carousel/:id
// @access  Private/Admin
export const deleteCarouselImage = async (req, res, next) => {
  try {
    const carouselImage = await CarouselImage.findById(req.params.id);
    if (!carouselImage) {
      res.status(404);
      throw new Error('Image introuvable');
    }

    await CarouselImage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Image supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};
