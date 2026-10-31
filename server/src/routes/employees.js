import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { search = '', department = '', status = '' } = req.query;
    const filter = {};
    if (req.user.role === 'employee') {
      const own = await Employee.findOne({ user: req.user._id });
      if (!own) return res.json({ employees: [] });
      filter._id = own._id;
    } else if (req.user.role === 'manager') {
      const manager = await Employee.findOne({ user: req.user._id });
      if (!manager) return res.json({ employees: [] });
      filter.department = manager.department;
    }
    if (department && !['manager','employee'].includes(req.user.role)) filter.department = department;
    if (status) filter.status = status;
    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { employeeId: { $regex: escaped, $options: 'i' } },
        { department: { $regex: escaped, $options: 'i' } }
      ];
    }
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({ employees });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (req.user.role === 'employee' && String(employee?.user) !== String(req.user._id)) return res.status(403).json({ message: 'You can only view your own profile.' });
    if (req.user.role === 'manager') { const manager = await Employee.findOne({ user: req.user._id }); if (!manager || manager.department !== employee?.department) return res.status(403).json({ message: 'You can only view employees in your department.' }); }
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (employee.user) await User.findByIdAndUpdate(employee.user, { name: employee.name, email: employee.email });
    res.json({ employee });
  } catch (e) { next(e); }
});

router.post('/', allowRoles('admin', 'hr'), [
  body('employeeId').trim().notEmpty().withMessage('Employee ID is required.'),
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').isEmail().withMessage('A valid email is required.'),
  body('department').trim().notEmpty().withMessage('Department is required.'),
  body('position').trim().notEmpty().withMessage('Position is required.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const { accountPassword, accountRole, ...employeeData } = req.body;
    if (await Employee.findOne({ employeeId: employeeData.employeeId })) return res.status(409).json({ message: 'Employee ID already exists.' });
    let account = null;
    if (accountPassword) {
      if (String(accountPassword).length < 8) return res.status(400).json({ message: 'Login password must be at least 8 characters.' });
      if (!['employee', 'manager', 'hr'].includes(accountRole || 'employee')) return res.status(400).json({ message: 'Invalid account role.' });
      if (await User.findOne({ email: employeeData.email.toLowerCase() })) return res.status(409).json({ message: 'A login account already uses this email.' });
      account = await User.create({ name: employeeData.name, email: employeeData.email, password: accountPassword, role: accountRole || 'employee' });
      employeeData.user = account._id;
    } else { account = await User.findOne({ email: employeeData.email.toLowerCase() }); if (account) employeeData.user = account._id; }
    const employee = await Employee.create(employeeData);
    if (account) { account.employee = employee._id; await account.save(); }
    res.status(201).json({ employee, accountCreated: Boolean(account) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Employee ID or email already exists.' });
    next(e);
  }
});

router.put('/:id', allowRoles('admin', 'hr'), async (req, res, next) => {
  try {
    const allowed = ['employeeId','name','email','phone','department','position','employmentType','salary','joiningDate','status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const existingEmployee = await Employee.findById(req.params.id);
    if (!existingEmployee) return res.status(404).json({ message: 'Employee not found.' });
    let account = existingEmployee.user
      ? await User.findById(existingEmployee.user).select('+password')
      : await User.findOne({ email: (updates.email || existingEmployee.email).toLowerCase() }).select('+password');
    const accountRole = req.body.accountRole || account?.role || 'employee';
    if (req.body.accountPassword && String(req.body.accountPassword).length < 8) return res.status(400).json({ message: 'Login password must be at least 8 characters.' });
    if (req.body.accountPassword && !['employee','manager','hr'].includes(accountRole)) return res.status(400).json({ message: 'Invalid account role.' });
    const email = (updates.email || existingEmployee.email).toLowerCase();
    const emailConflict = await User.findOne({ email, ...(account ? { _id: { $ne: account._id } } : {}) });
    if (emailConflict) return res.status(409).json({ message: 'A login account already uses this email.' });
    const employee = await Employee.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    if (req.body.accountPassword) {
      if (!account) account = new User({ name: employee.name, email: employee.email, password: req.body.accountPassword, role: accountRole });
      else { account.name = employee.name; account.email = employee.email; account.password = req.body.accountPassword; account.role = accountRole; }
      account.employee = employee._id;
      await account.save();
      employee.user = account._id;
      await employee.save();
    } else if (account) {
      account.name = employee.name; account.email = employee.email; account.employee = employee._id;
      await account.save();
      if (!employee.user) { employee.user = account._id; await employee.save(); }
    }
    res.json({ employee, accountLinked: Boolean(employee.user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'Employee ID or email already exists.' });
    next(e);
  }
});

router.delete('/:id', allowRoles('admin'), async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found.' });
    res.json({ message: 'Employee deleted.' });
  } catch (e) { next(e); }
});

export default router;
