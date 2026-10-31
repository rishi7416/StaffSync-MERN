import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Leave from '../models/Leave.js';
import Employee from '../models/Employee.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') { const own = await Employee.findOne({ user: req.user._id }); if (!own) return res.json({ leaves: [] }); filter.employee = own._id; }
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager) return res.json({ leaves: [] }); const team = await Employee.find({ department: manager.department }).select('_id'); filter.employee = { $in: team.map(e => e._id) }; }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.employee && ['admin','hr'].includes(req.user.role)) filter.employee = req.query.employee;
    const leaves = await Leave.find(filter).populate('employee', 'employeeId name department').populate('reviewedBy', 'name').sort({ createdAt: -1 }).limit(500);
    res.json({ leaves });
  } catch (e) { next(e); }
});

router.post('/', [
  body('employee').notEmpty().withMessage('Choose an employee.'),
  body('startDate').isISO8601().withMessage('Choose a valid start date.'),
  body('endDate').isISO8601().withMessage('Choose a valid end date.'),
  body('reason').trim().notEmpty().withMessage('Reason is required.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const employeeId = req.user.role === 'employee' ? (await Employee.findOne({ user: req.user._id }))?._id : req.body.employee;
    if (!['admin','hr','manager','employee'].includes(req.user.role)) return res.status(403).json({ message: 'Not allowed.' });
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager || manager.department !== employee.department) return res.status(403).json({ message: 'You can only manage leave for your department.' }); }
    const leave = await Leave.create({
      employee: employee._id,
      leaveType: req.body.leaveType || 'Casual',
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason
    });
    await leave.populate('employee', 'employeeId name department');
    res.status(201).json({ leave });
  } catch (e) { next(e); }
});

router.patch('/:id/review', allowRoles('admin', 'hr', 'manager'), async (req, res, next) => {
  try {
    if (!['Approved', 'Rejected'].includes(req.body.status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected.' });
    }
    const existing = await Leave.findById(req.params.id).populate('employee');
    if (!existing) return res.status(404).json({ message: 'Leave request not found.' });
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager || manager.department !== existing.employee.department) return res.status(403).json({ message: 'You can only review requests from your department.' }); }
    const leave = await Leave.findByIdAndUpdate(req.params.id, {
      status: req.body.status,
      reviewNote: req.body.reviewNote || '',
      reviewedBy: req.user._id
    }, { new: true, runValidators: true })
      .populate('employee', 'employeeId name department').populate('reviewedBy', 'name');
    if (!leave) return res.status(404).json({ message: 'Leave request not found.' });
    res.json({ leave });
  } catch (e) { next(e); }
});

export default router;
