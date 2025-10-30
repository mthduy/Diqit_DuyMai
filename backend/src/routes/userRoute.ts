import express from 'express';
import multer from 'multer';
import { authMe, test, updateProfile, uploadAvatar } from '../controllers/userController.js';

const router = express.Router();

// use memory storage so uploaded file buffer is available for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/me', authMe);
router.put('/me', updateProfile);
router.post('/me/avatar', upload.single('avatar'), uploadAvatar);
router.get('/test', test);

export default router;
