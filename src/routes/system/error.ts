import express from 'express';

const router = express.Router();

// Error routes
router.get('/error/:code', (req, res) => {
  const code = parseInt(req.params.code) || 500;
  let message = 'An error occurred';
  
  switch (code) {
    case 404:
      message = 'Page not found';
      break;
    case 403:
      message = 'Access forbidden';
      break;
    case 401:
      message = 'Unauthorized access';
      break;
    default:
      message = 'An error occurred';
  }
  
  res.status(code).render('system/error', { code, message });
});

export default router;