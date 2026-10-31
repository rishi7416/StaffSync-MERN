import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Announcement from '../models/Announcement.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (_req, res, next) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(100);
    res.json({ announcements });
  } catch (error) { next(error); }
});

router.post('/', allowRoles('admin', 'hr'), [
  body('title').trim().notEmpty().isLength({ max: 140 }).withMessage('Title is required and must be 140 characters or fewer.'),
  body('body').trim().notEmpty().isLength({ max: 5000 }).withMessage('Announcement text is required and must be 5000 characters or fewer.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const announcement = await Announcement.create({
      title: req.body.title,
      body: req.body.body,
      category: req.body.category || 'News',
      pinned: Boolean(req.body.pinned),
      createdBy: req.user._id
    });
    await announcement.populate('createdBy', 'name');
    res.status(201).json({ announcement });
  } catch (error) { next(error); }
});

router.delete('/:id', allowRoles('admin', 'hr'), async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (error) { next(error); }
});

export default router;
