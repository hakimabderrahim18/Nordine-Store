import Notification from '../models/Notification.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
  try {
    let query = { user: req.user._id };

    // Admins also see system alerts (notifications with null user)
    if (req.user.role === 'admin') {
      query = {
        $or: [
          { user: req.user._id },
          { user: null }
        ]
      };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }

    // Verify ownership (if user specific)
    if (notification.user && notification.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this notification');
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear notifications (Mark all as read)
// @route   PUT /api/notifications/read-all
// @access  Private
export const readAllNotifications = async (req, res, next) => {
  try {
    let query = { user: req.user._id };

    if (req.user.role === 'admin') {
      query = {
        $or: [
          { user: req.user._id },
          { user: null }
        ]
      };
    }

    await Notification.updateMany(query, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all user notifications
// @route   DELETE /api/notifications
// @access  Private
export const deleteNotifications = async (req, res, next) => {
  try {
    let query = { user: req.user._id };

    if (req.user.role === 'admin') {
      query = {
        $or: [
          { user: req.user._id },
          { user: null }
        ]
      };
    }

    await Notification.deleteMany(query);
    res.json({ success: true, message: 'All notifications deleted successfully' });
  } catch (error) {
    next(error);
  }
};
