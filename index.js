const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const qrRoutes = require('./routes/qrRoutes'); // Import qrRoutes

const app = express();
const PORT = 3000;

// Cấu hình Express để phục vụ tệp tĩnh từ thư mục "public"
app.use(express.static(path.join(__dirname, 'public')));
// Connect to MongoDB
connectDB();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Routes
app.get('/', (req, res) => {
    res.render('login');
});


// Use the route modules
app.use(authRoutes);
app.use(userRoutes);
app.use(reportRoutes);
app.use(dashboardRoutes);
app.use(qrRoutes); // Mount qrRoutes at /qr
//Error page 404
app.use((req, res, next) => {
    const errorMessage = 'Page Not Found1';
    const errorCode = 404;
    res.status(404).render('404', { errorMessage, errorCode });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});