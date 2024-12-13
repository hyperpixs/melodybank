require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Serve static files from the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

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

// Create Stripe Checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { plan } = req.body;
        
        let priceId;
        switch(plan) {
            case 'pro':
                priceId = process.env.STRIPE_PRO_PRICE_ID;
                break;
            case 'enterprise':
                priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID;
                break;
            default:
                return res.status(400).json({ error: 'Invalid plan selected' });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: 'subscription',
            success_url: `${req.protocol}://${req.get('host')}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/`,
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to create checkout session' });
    }
});

// Success page
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, 'success.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
