require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const router = express.Router();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve static files from the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve success.html
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

// Stripe endpoints
router.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId } = req.body;
        
        if (!priceId) {
            return res.status(400).json({ error: 'Price ID is required' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.URL || 'https://melody-bank.netlify.app'}/success`,
            cancel_url: `${process.env.URL || 'https://melody-bank.netlify.app'}/cancel`,
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// API Routes
router.post('/api/subscribe', async (req, res) => {
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

router.post('/api/verify-promo', async (req, res) => {
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
router.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    // Add your admin authentication logic here
    // This is a placeholder - implement proper authentication
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/', router);

// Export the serverless handler
module.exports.handler = serverless(app);
