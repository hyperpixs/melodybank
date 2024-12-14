// Secure download verification
const verifyDownload = async (platform) => {
    const response = await fetch('/api/verify-download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platform })
    });
    return await response.json();
};

// Platform detection
const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'mac';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('android')) return 'android';
    return 'unknown';
};

// Automatic platform selection
document.addEventListener('DOMContentLoaded', () => {
    const platform = detectPlatform();
    const recommendedDownload = document.querySelector(`[data-platform="${platform}"]`);
    if (recommendedDownload) {
        recommendedDownload.classList.add('recommended');
    }
});

// Download tracking
const trackDownload = async (platform) => {
    try {
        const verification = await verifyDownload(platform);
        if (verification.success) {
            showDownloadStarting(platform);
        }
    } catch (error) {
        console.error('Download verification failed:', error);
    }
};

// Download progress simulation
const showDownloadStarting = (platform) => {
    const downloadBtn = document.querySelector(`[data-platform="${platform}"]`);
    const originalText = downloadBtn.textContent;
    
    downloadBtn.innerHTML = `
        <span class="loading-spinner"></span>
        <span>Preparing Download...</span>
    `;
    
    setTimeout(() => {
        downloadBtn.innerHTML = originalText;
    }, 3000);
};

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Security badge
const securityBadge = document.createElement('div');
securityBadge.className = 'security-badge';
securityBadge.innerHTML = `
    <span>🔒 Secure Download</span>
`;
document.body.appendChild(securityBadge);

// Download buttons event listeners
document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        const platform = button.dataset.platform;
        await trackDownload(platform);
        window.location.href = button.href;
    });
});

// Platform compatibility check
const checkCompatibility = () => {
    const platform = detectPlatform();
    const requirements = {
        windows: { os: 'Windows 10 or later', ram: '4GB RAM', storage: '2GB free space' },
        mac: { os: 'macOS 10.15 or later', ram: '4GB RAM', storage: '2GB free space' },
        ios: { os: 'iOS 14.0 or later', device: 'iPhone 6s or later' },
        android: { os: 'Android 8.0 or later', ram: '3GB RAM' },
        xbox: { os: 'Xbox One or later' },
        playstation: { os: 'PS4 or PS5' }
    };
    
    return requirements[platform] || requirements.windows;
};

// Show compatibility info
const showCompatibility = () => {
    const requirements = checkCompatibility();
    const infoDiv = document.createElement('div');
    infoDiv.className = 'compatibility-info';
    infoDiv.innerHTML = `
        <h4>System Requirements:</h4>
        <ul>
            ${Object.entries(requirements).map(([key, value]) => `
                <li>${key}: ${value}</li>
            `).join('')}
        </ul>
    `;
    return infoDiv;
};

// Initialize compatibility info
document.addEventListener('DOMContentLoaded', () => {
    const downloadSection = document.querySelector('#downloads');
    downloadSection.appendChild(showCompatibility());
});

// Initialize Stripe
const stripe = Stripe('your_publishable_key'); // Replace with your actual publishable key

// Handle subscription button clicks
document.querySelectorAll('.subscribe-btn').forEach(button => {
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        const plan = e.target.dataset.plan;
        
        try {
            // Call your server to create a Checkout Session
            const response = await fetch('/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    plan: plan
                })
            });
            
            const session = await response.json();
            
            // Redirect to Stripe Checkout
            const result = await stripe.redirectToCheckout({
                sessionId: session.id
            });
            
            if (result.error) {
                alert(result.error.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Something went wrong. Please try again.');
        }
    });
});

// Handle download button clicks
document.querySelectorAll('.download-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const platform = e.target.closest('.download-btn').dataset.platform;
        // You can add analytics tracking here
        console.log(`Download clicked for ${platform}`);
    });
});

// Create card element
const elements = stripe.elements();
const card = elements.create('card');
const cardElement = document.getElementById('card-element');
if (cardElement) {
    card.mount('#card-element');
}

// Handle payment button clicks
document.querySelectorAll('.payment-button').forEach(button => {
    button.addEventListener('click', () => {
        const modal = document.getElementById('payment-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });
});

// Handle modal close
document.getElementById('close-modal')?.addEventListener('click', () => {
    const modal = document.getElementById('payment-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
});

// Handle form submission
const form = document.getElementById('payment-form');
form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
        const { token, error } = await stripe.createToken(card);
        
        if (error) {
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = error.message;
            submitButton.disabled = false;
            submitButton.textContent = 'Subscribe';
            return;
        }

        // Send the token to your server
        const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: token.id,
                plan: document.querySelector('.payment-button:focus')?.dataset.plan
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Handle successful payment
            const modal = document.getElementById('payment-modal');
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            alert('Successfully subscribed! You can now start earning with music tasks.');
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = err.message || 'An error occurred. Please try again.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Subscribe';
    }
});

// Admin functionality
const adminButton = document.getElementById('admin-login');
const adminModal = document.getElementById('admin-modal');
const closeAdminModal = document.getElementById('close-admin-modal');
const adminForm = document.getElementById('admin-form');

// Show admin modal
adminButton?.addEventListener('click', () => {
    adminModal.classList.remove('hidden');
    adminModal.classList.add('flex');
});

// Close admin modal
closeAdminModal?.addEventListener('click', () => {
    adminModal.classList.add('hidden');
    adminModal.classList.remove('flex');
});

// Handle admin login
adminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('admin-error');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = '/admin/dashboard';
        } else {
            errorElement.textContent = 'Invalid credentials';
        }
    } catch (err) {
        errorElement.textContent = 'Login failed. Please try again.';
    }
});

// Promo code functionality
const applyPromoButton = document.getElementById('apply-promo');
const promoInput = document.getElementById('promo-code');
const promoMessage = document.getElementById('promo-message');
let currentDiscount = 0;

applyPromoButton?.addEventListener('click', async () => {
    const code = promoInput.value.trim();
    if (!code) {
        promoMessage.textContent = 'Please enter a promo code';
        promoMessage.className = 'text-sm text-red-600';
        return;
    }

    try {
        const response = await fetch('/api/verify-promo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code })
        });

        const result = await response.json();

        if (result.success) {
            promoMessage.textContent = `${result.discount}% discount applied!`;
            promoMessage.className = 'text-sm text-green-600';
            currentDiscount = result.discount;
            updatePrice(result.discount);
        } else {
            promoMessage.textContent = 'Invalid or expired promo code';
            promoMessage.className = 'text-sm text-red-600';
            currentDiscount = 0;
        }
    } catch (err) {
        promoMessage.textContent = 'Error applying promo code';
        promoMessage.className = 'text-sm text-red-600';
    }
});

// Update price display with discount
function updatePrice(discount) {
    const selectedPlan = document.querySelector('.payment-button:focus')?.dataset.plan;
    const prices = {
        basic: 9.99,
        pro: 19.99,
        enterprise: 49.99
    };

    if (selectedPlan && prices[selectedPlan]) {
        const originalPrice = prices[selectedPlan];
        const discountedPrice = originalPrice * (1 - discount / 100);
        // Update price display logic here
    }
}
