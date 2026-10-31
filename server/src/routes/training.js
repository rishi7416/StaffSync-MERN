import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Employee from '../models/Employee.js';
import TrainingProgram from '../models/TrainingProgram.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (['manager', 'employee'].includes(req.user.role)) {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.json({ programs: [] });
      filter.department = employee.department;
    } else if (req.query.department) {
      filter.department = req.query.department;
    }
    if (req.query.status) filter.status = req.query.status;
    const programs = await TrainingProgram.find(filter)
      .populate('createdBy', 'name')
      .sort({ startDate: 1, createdAt: -1 })
      .limit(200);
    res.json({ programs });
  } catch (error) { next(error); }
});

router.post('/', allowRoles('admin', 'hr', 'manager'), [
  body('title').trim().notEmpty().isLength({ max: 140 }).withMessage('Title is required and must be 140 characters or fewer.'),
  body('description').trim().notEmpty().isLength({ max: 3000 }).withMessage('Description is required and must be 3000 characters or fewer.'),
  body('startDate').isISO8601().withMessage('Choose a valid start date.'),
  body('endDate').isISO8601().withMessage('Choose a valid end date.'),
  body('department').trim().notEmpty().withMessage('Department is required.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    if (endDate < startDate) return res.status(400).json({ message: 'End date must be on or after start date.' });
    let department = req.body.department;
    if (req.user.role === 'manager') {
      const manager = await Employee.findOne({ user: req.user._id });
      if (!manager) return res.status(403).json({ message: 'Your manager profile is not linked.' });
      department = manager.department;
    }
    const program = await TrainingProgram.create({
      ...req.body,
      department,
      createdBy: req.user._id
    });
    await program.populate('createdBy', 'name');
    res.status(201).json({ program });
  } catch (error) { next(error); }
});

router.patch('/:id', allowRoles('admin', 'hr', 'manager'), [
  body('startDate').optional().isISO8601().withMessage('Choose a valid start date.'),
  body('endDate').optional().isISO8601().withMessage('Choose a valid end date.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Training program not found.' });
    const allowed = ['title', 'description', 'department', 'provider', 'format', 'location', 'startDate', 'endDate', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (req.user.role === 'manager') {
      const manager = await Employee.findOne({ user: req.user._id });
      if (!manager || manager.department !== program.department || (updates.department && updates.department !== manager.department)) {
        return res.status(403).json({ message: 'You can only manage training programs for your department.' });
      }
    }
    const startDate = updates.startDate ? new Date(updates.startDate) : program.startDate;
    const endDate = updates.endDate ? new Date(updates.endDate) : program.endDate;
    if (endDate < startDate) return res.status(400).json({ message: 'End date must be on or after start date.' });
    const updatedProgram = await TrainingProgram.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('createdBy', 'name');
    res.json({ program: updatedProgram });
  } catch (error) { next(error); }
});

router.delete('/:id', allowRoles('admin', 'hr', 'manager'), async (req, res, next) => {
  try {
    const program = await TrainingProgram.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Training program not found.' });
    if (req.user.role === 'manager') {
      const manager = await Employee.findOne({ user: req.user._id });
      if (!manager || manager.department !== program.department) {
        return res.status(403).json({ message: 'You can only manage training programs for your department.' });
      }
    }
    await program.deleteOne();
    res.json({ message: 'Training program deleted.' });
  } catch (error) { next(error); }
});

export default router;
