import { Request, Response } from 'express';

// Handle 404 errors
export const notFound = (req: Request, res: Response): void => {
  res.status(404).render('system/error', {
    title: 'Page Not Found',
    code: 404,
    message: 'The page you are looking for does not exist'
  });
};

// Handle 500 errors
export const serverError = (err: Error, req: Request, res: Response): void => {
  console.error('Server error:', err);
  
  res.status(500).render('system/error', {
    title: 'Server Error',
    code: 500,
    message: 'Something went wrong on our end'
  });
};