import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import flash from 'express-flash';
import helmet from 'helmet';
import dotenv from 'dotenv';
import ejsLayouts from 'express-ejs-layouts';
import multer from 'multer';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth';
import playerRoutes from './routes/player';
import staffRoutes from './routes/staff';
import adminRoutes from './routes/admin';
import cashierRoutes from './routes/cashier';
import refereeRoutes from './routes/referee';
import leaderboardRoutes from './routes/leaderboard';
import teamRoutes from './routes/teams';
import publicRoutes from './routes/public';
import apiRoutes from './routes/api';
import errorRoutes from './routes/system/error';

// Load environment variables
dotenv.config();

const app = express();

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/views'));
app.set('layout', 'layouts/main');
app.use(ejsLayouts);

// Disable view caching
app.disable('view cache');

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"]
    },
  },
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../src/public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(express.static(path.join(__dirname, '../src/public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'striker_splash_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
  }
}));

// Flash messages
app.use(flash());

// Global variables middleware
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// File upload middleware
app.use((req: any, res, next) => {
  req.fileUpload = upload.single('photo');
  next();
});

// Clear view cache on each request in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Clear the require cache for views
    Object.keys(require.cache).forEach(key => {
      if (key.includes('/views/')) {
        delete require.cache[key];
      }
    });
    next();
  });
}

// Routes
app.use('/', publicRoutes);
app.use('/auth', authRoutes);
app.use('/player', playerRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);
app.use('/cashier', cashierRoutes);
app.use('/referee', refereeRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/teams', teamRoutes);
app.use('/api', apiRoutes);

// Error routes should be last
app.use(errorRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('system/error', { 
    title: 'Page Not Found',
    code: 404, 
    message: 'Page not found' 
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).render('system/error', { 
    title: 'Server Error',
    code: 500, 
    message: 'Something went wrong' 
  });
});

export default app;