const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Create a checkout session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { priceId } = req.body;
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${req.headers.origin}/success`,
            cancel_url: `${req.headers.origin}`,
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve success.html
app.get('/success', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'success.html'));
});

module.exports.handler = serverless(app);
