import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const tokenFor = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET || 'development_only_change_me',
  { expiresIn: '8h' }
);
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employee || null });

router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email.'),
  body('password').notEmpty().withMessage('Password is required.')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });
    const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { next(e); }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

// Registration is intentionally disabled. Create accounts through the protected/admin workflow
// or the seed script so a public visitor cannot grant themselves admin access.
export default router;
