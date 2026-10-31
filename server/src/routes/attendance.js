import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'employee') { const own = await Employee.findOne({ user: req.user._id }); if (!own) return res.json({ records: [] }); filter.employee = own._id; }
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager) return res.json({ records: [] }); const team = await Employee.find({ department: manager.department }).select('_id'); filter.employee = { $in: team.map(e => e._id) }; }
    if (req.query.date) filter.date = req.query.date;
    if (req.query.employee && ['admin','hr'].includes(req.user.role)) filter.employee = req.query.employee;
    const records = await Attendance.find(filter).populate('employee', 'employeeId name department').sort({ date: -1, createdAt: -1 }).limit(500);
    res.json({ records });
  } catch (e) { next(e); }
});


router.post('/me/check-in', allowRoles('employee'), async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Your employee profile is not linked. Contact HR.' });
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    let record = await Attendance.findOne({ employee: employee._id, date });
    if (record?.checkIn) return res.status(409).json({ message: 'You have already checked in today.' });
    if (!record) record = new Attendance({ employee: employee._id, date, status: 'Present' });
    record.checkIn = time;
    await record.save();
    await record.populate('employee', 'employeeId name department');
    res.status(201).json({ record });
  } catch (e) { next(e); }
});

router.post('/me/check-out', allowRoles('employee'), async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Your employee profile is not linked. Contact HR.' });
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const record = await Attendance.findOne({ employee: employee._id, date });
    if (!record?.checkIn) return res.status(400).json({ message: 'Check in before checking out.' });
    if (record.checkOut) return res.status(409).json({ message: 'You have already checked out today.' });
    record.checkOut = time;
    await record.save();
    await record.populate('employee', 'employeeId name department');
    res.json({ record });
  } catch (e) { next(e); }
});

router.post('/', allowRoles('admin', 'hr', 'manager'), [
  body('employee').notEmpty().withMessage('Choose an employee.'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must use YYYY-MM-DD.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const employee = await Employee.findById(req.body.employee);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager || manager.department !== employee.department) return res.status(403).json({ message: 'You can only manage attendance for your department.' }); }
    const record = await Attendance.create({
      employee: req.body.employee,
      date: req.body.date,
      checkIn: req.body.checkIn || '',
      checkOut: req.body.checkOut || '',
      status: req.body.status || 'Present',
      note: req.body.note || ''
    });
    await record.populate('employee', 'employeeId name department');
    res.status(201).json({ record });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Attendance already exists for this employee and date.' });
    next(e);
  }
});

router.patch('/:id', allowRoles('admin', 'hr', 'manager'), async (req, res, next) => {
  try {
    const existing = await Attendance.findById(req.params.id).populate('employee');
    if (!existing) return res.status(404).json({ message: 'Attendance record not found.' });
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager || manager.department !== existing.employee.department) return res.status(403).json({ message: 'You can only manage attendance for your department.' }); }
    const allowed = ['checkIn','checkOut','status','note'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const record = await Attendance.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('employee', 'employeeId name department');
    if (!record) return res.status(404).json({ message: 'Attendance record not found.' });
    res.json({ record });
  } catch (e) { next(e); }
});

export default router;
