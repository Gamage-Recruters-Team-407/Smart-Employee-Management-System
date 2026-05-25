import express from 'express';
import { registerUser, loginUser, googleLogin, forgotPassword, resetPassword} from '../controllers/authController.js';

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);    // Google Sign-In verification
router.post('/forgotpassword', forgotPassword);
router.post('/resetpassword', resetPassword);

export default router;




//router.get('/all', protect, authorizeRoles('Admin', 'HR'), getAllEmployees);  
// example of protected route with role-based access control (Admin and HR can access)