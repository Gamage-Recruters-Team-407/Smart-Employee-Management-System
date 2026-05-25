import express from 'express';
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

export default router;




//router.get('/all', protect, authorizeRoles('Admin', 'HR'), getAllEmployees);  
// example of protected route with role-based access control (Admin and HR can access)
