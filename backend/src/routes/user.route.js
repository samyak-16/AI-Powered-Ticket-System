import express from 'express';
import {
  getAllUsersDetails,
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
router.get('/users', authenticateUser, getAllUsersDetails);

export default router;
