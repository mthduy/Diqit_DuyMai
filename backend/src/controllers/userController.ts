import type { Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';


// configure cloudinary using env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
  secure: true,
});


// multer's @types provide Request.file typing; no custom declaration needed here

export const authMe = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.log('Error in authMe:', error);
    return res.status(500).json({
      message: 'Server error',
    });
  }
};

export const test = async (req: Request, res: Response) => {
  return res.sendStatus(204);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allowedFields: Partial<Record<string, any>> = {};
    const { displayName, email, phone, avatarUrl } = req.body;

    if (typeof displayName === 'string')
      allowedFields.displayName = displayName;
    if (typeof email === 'string') allowedFields.email = email;
    if (typeof phone === 'string') allowedFields.phone = phone;
    if (typeof avatarUrl === 'string') allowedFields.avatarUrl = avatarUrl;

    const updatedUser = await (user as any).constructor
      .findByIdAndUpdate(user._id, { $set: allowedFields }, { new: true })
      .select('-hashedPassword');

    return res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Server error' });

  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    // ensure Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary env vars missing');
      return res.status(500).json({ message: 'Cloudinary not configured on server' });
    }
    const user = req.user;
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!req.file || !req.file.buffer)
      return res.status(400).json({ message: 'No file uploaded' });

    const buffer = req.file.buffer;

    // delete previous avatar on Cloudinary if exists
    try {
      if ((user as any).avatarId) {
        await cloudinary.uploader.destroy((user as any).avatarId).catch(() => {});
      }
    } catch (e) {
      console.error('Error deleting previous avatar:', e);
    }

    const uploadResult: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'avatars', resource_type: 'image' }, (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });

    const avatarUrl = uploadResult.secure_url;
    const avatarId = uploadResult.public_id;

    const updatedUser = await (user as any).constructor.findByIdAndUpdate(
      user._id,
      { $set: { avatarUrl, avatarId } },
      { new: true }
    ).select('-hashedPassword');

    return res.status(200).json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error uploading avatar:', error && (error.stack || error));
    // include error message to help debugging (remove in production)
    return res.status(500).json({ message: 'Server error', detail: error?.message || String(error) });
  }
};
