import { Request, Response, NextFunction } from 'express';
import fileUpload, { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Setup file upload middleware
export const setupFileUpload = (app: any) => {
  // Create upload directory if it doesn't exist
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Use express-fileupload middleware
  app.use(fileUpload({
    createParentPath: true,
    limits: { 
      fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    abortOnLimit: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    safeFileNames: true,
    preserveExtension: true
  }));
};

export const handleFileUpload = (file: UploadedFile) => {
  // Generate unique filename
  const uniquePrefix = crypto.randomBytes(8).toString('hex');
  const fileName = `${uniquePrefix}-${file.name}`;
  const uploadPath = path.join(process.cwd(), 'public', 'uploads', fileName);
  
  // Move the file to the upload directory
  return new Promise<string>((resolve, reject) => {
    file.mv(uploadPath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve(`/uploads/${fileName}`);
    });
  });
};

// Function to handle multiple file uploads
export const handleMultipleFileUploads = async (files: UploadedFile | UploadedFile[]) => {
  if (!files) return [];
  
  if (!Array.isArray(files)) {
    files = [files];
  }
  
  // Filter to only allow images
  const imageFiles = files.filter(file => {
    const mimeType = file.mimetype || '';
    return mimeType.startsWith('image/');
  });
  
  // Limit to maximum 3 images
  const limitedFiles = imageFiles.slice(0, 3);
  
  // Upload each file and collect paths
  const uploadPromises = limitedFiles.map(file => handleFileUpload(file));
  return Promise.all(uploadPromises);
};

// Middleware to check if uploads directory exists
export const ensureUploadsDir = (req: Request, res: Response, next: NextFunction) => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  next();
};