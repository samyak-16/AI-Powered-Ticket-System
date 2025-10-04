import express from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
} from '../controllers/user.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authenticateUser, logoutUser);
router.post('/update-user', authenticateUser, updateUser);

export default router;
