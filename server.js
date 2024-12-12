require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files
app.use(express.static(__dirname));

// API Routes
app.post('/api/subscribe', async (req, res) => {
    try {
        const { token, plan } = req.body;
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
            source: token,
            email: req.body.email
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`] }]
        });

        res.json({ success: true, subscription });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/verify-promo', async (req, res) => {
    try {
        const { code } = req.body;
        // Add your promo code verification logic here
        // This is a simple example
        const promoCodes = {
            'FOUNDER2024': { discount: 100 },
            'LAUNCH50': { discount: 50 }
        };

        if (promoCodes[code]) {
            res.json({ success: true, ...promoCodes[code] });
        } else {
            res.json({ success: false, message: 'Invalid promo code' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin routes
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    // Add your admin authentication logic here
    // This is a placeholder - implement proper authentication
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
