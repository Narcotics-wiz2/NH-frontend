// ============================================
// NYODERA HEIGHTS - JAVASCRIPT
// ============================================

// Auto-configured backend server for API calls
window.PAYMENTS_SERVER = 'http://127.0.0.1:25005';
window.PAYMENTS_LOGIN_PATH = '/api/auth/login';

function getBackendBaseCandidates() {
    const explicit = [window.PAYMENTS_SERVER, 'http://localhost:25005', 'http://127.0.0.1:25005'];
    const seen = new Set();
    return explicit.filter((entry) => {
        if (!entry) return false;
        const normalized = entry.replace(/\/$/, '');
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
    });
}

// ============================================
// DOM Elements
// ============================================
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navItems = document.querySelectorAll('.nav-links a');
const priceFilter = document.getElementById('price-filter');
const priceValue = document.getElementById('price-value');
const applyFiltersBtn = document.getElementById('apply-filters');
const clearFiltersBtn = document.getElementById('clear-filters');
const contactForm = document.getElementById('contact-form');
const bookingForm = document.getElementById('booking-form');
const formMessage = document.getElementById('form-message');

// ============================================
// MOBILE NAVIGATION
// ============================================

function toggleMobileMenu() {
    if (!hamburger || !navLinks) return;

    const closeMenu = () => {
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
    };

    hamburger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = navLinks.classList.toggle('open');
        document.body.classList.toggle('menu-open', isOpen);
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.contains(event.target) && !hamburger.contains(event.target)) {
            closeMenu();
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            closeMenu();
        });
    });
}

// ============================================
// PRICE FILTER UPDATE
// ============================================

function setupPriceFilter() {
    if (priceFilter) {
        priceFilter.addEventListener('input', (e) => {
            priceValue.textContent = e.target.value;
        });
    }
}

// ============================================
// APPLY FILTERS
// ============================================

function setupFilterButtons() {
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const price = document.getElementById('price-filter').value;
            const bedrooms = document.getElementById('bedrooms').value;
            const location = document.getElementById('location').value;
            
            console.log('Filters Applied:', { price, bedrooms, location });
            alert(`Filters applied: Price: $${price}, Bedrooms: ${bedrooms || 'Any'}, Location: ${location || 'Any'}`);
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            if (priceFilter) priceFilter.value = 5000;
            if (priceValue) priceValue.textContent = '5000';
            if (document.getElementById('bedrooms')) document.getElementById('bedrooms').value = '';
            if (document.getElementById('location')) document.getElementById('location').value = '';
            
            const checkboxes = document.querySelectorAll('.amenities-list input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);
            
            console.log('Filters cleared');
        });
    }
}

// ============================================
// CONTACT FORM SUBMISSION
// ============================================

function setupContactForm() {
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            if (name && email && subject && message) {
                showFormMessage('Thank you! Your message has been sent successfully. We will contact you shortly.', 'success');
                contactForm.reset();
            } else {
                showFormMessage('Please fill in all required fields.', 'error');
            }
        });
    }
}

// ============================================
// BOOKING FORM SUBMISSION
// ============================================

function setupBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        // Check payment status and show notice if needed
        const session = getSession();
        const paymentNotice = document.getElementById('booking-payment-notice');
        
        if (session && paymentNotice) {
            const payments = JSON.parse(localStorage.getItem('nh_payments') || '[]');
            const userPayment = payments.find(p => p.userEmail === session.email);
            if (!userPayment) {
                paymentNotice.style.display = 'block';
            }
        }
        
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const checkIn = document.getElementById('check-in').value;
            const checkOut = document.getElementById('check-out').value;
            const guests = document.getElementById('guests').value;
            const session = getSession();
            
            if (checkIn && checkOut && guests) {
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                
                if (checkOutDate > checkInDate) {
                    if (!session) {
                        alert('Please sign in to confirm your booking.');
                        window.location.href = 'login.html';
                        return;
                    }
                    
                    // Calculate total cost and redirect user to payment flow
                    const checkInDateObj = checkInDate;
                    const checkOutDateObj = checkOutDate;
                    const nights = Math.ceil((checkOutDateObj - checkInDateObj) / (1000 * 60 * 60 * 24));
                    const propertyTitle = document.getElementById('property-title')?.textContent || '';
                    const ratePerMonth = getRateForProperty(propertyTitle) || PRICE_PER_MONTH;
                    const totalPrice = Number(((nights / 30) * ratePerMonth).toFixed(2));

                    // Create a pending booking awaiting payment
                    const pending = {
                        id: `PENDING_${Date.now()}`,
                        userEmail: session.email,
                        property: document.getElementById('property-title')?.textContent || 'Luxury Apartment',
                        checkIn,
                        checkOut,
                        guests,
                        nights,
                        amount: totalPrice,
                        createdDate: new Date().toISOString(),
                        status: 'pending_payment'
                    };
                    localStorage.setItem('nh_pending_booking', JSON.stringify(pending));

                    // Redirect to payments page with booking id and amount prefilled
                    const params = new URLSearchParams({ booking_id: pending.id, amount: String(totalPrice) });
                    window.location.href = `payments.html?${params.toString()}`;
                    return;
                } else {
                    alert('Check-out date must be after check-in date.');
                }
            } else {
                alert('Please fill in all booking details.');
            }
        });
    }
}

// ============================================
// RESERVATIONS MANAGEMENT
// ============================================
function getPendingExtension() {
    return JSON.parse(localStorage.getItem('nh_pending_extension') || 'null');
}

function setupReservationsPage() {
    const session = getSession();

    // If we were redirected here from a booking or a stay extension, prefill the amount and lock it
    const urlParams = new URLSearchParams(window.location.search);
    const bookingIdParam = urlParams.get('booking_id');
    const pendingExtension = getPendingExtension();
    if (pendingExtension && (!bookingIdParam || pendingExtension.bookingId === bookingIdParam)) {
        const amountInput = document.getElementById('pay-amount');
        if (amountInput) {
            amountInput.value = pendingExtension.amount;
            amountInput.readOnly = true;
        }
        const amountLabel = document.getElementById('pay-amount-label');
        if (amountLabel) amountLabel.textContent = 'Amount (USD) - Extension fee';
    } else {
        const pendingBooking = JSON.parse(localStorage.getItem('nh_pending_booking') || 'null');
        if (pendingBooking && (!bookingIdParam || pendingBooking.id === bookingIdParam)) {
            const amountInput = document.getElementById('pay-amount');
            if (amountInput) {
                amountInput.value = pendingBooking.amount;
                amountInput.readOnly = true;
            }
            const amountLabel = document.getElementById('pay-amount-label');
            if (amountLabel) amountLabel.textContent = 'Amount (USD) - Reservation total';
        }
    }
    const container = document.getElementById('reservations-container');
    const loginNote = document.getElementById('reservations-login-note');
    const bookingsList = document.getElementById('bookings-list');
    const extendForm = document.getElementById('extend-form');

    if (extendForm && !extendForm.dataset.extendHandlerBound) {
        extendForm.addEventListener('submit', handleExtendStay);
        extendForm.dataset.extendHandlerBound = 'true';
        console.log('[Extension] bound submit handler on reservations setup');
    }
    
    if (!container) return;
    
    if (!session) {
        loginNote.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    loginNote.style.display = 'none';
    container.style.display = 'block';
    
    // Sync bookings from server to local cache for current user
    (async () => {
        try {
            const serverBookings = await fetchBookings();
            if (Array.isArray(serverBookings)) {
                const localBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
                // Avoid wiping local cache when the server returns an empty list unexpectedly
                if (serverBookings.length || !localBookings.length) {
                    localStorage.setItem('nh_bookings', JSON.stringify(serverBookings));
                } else {
                    console.log('Reservations sync: keeping local bookings because server returned no bookings and local cache exists.');
                }
            }
        } catch (err) {
            console.warn('Unable to sync server bookings for reservations page', err);
        }
        renderBookings();
    })();
}

function renderBookings() {
    const session = getSession();
    const bookingsList = document.getElementById('bookings-list');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    
    if (!bookingsList) return;
    
    const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
    // Show confirmed bookings and any pending cancellations for the current user
    const userBookings = allBookings.filter(b => b.userEmail === session?.email && (b.status === 'confirmed' || b.status === 'cancellation_pending'));
    
    if (!userBookings.length) {
        bookingsList.innerHTML = '';
        if (noBookingsMessage) noBookingsMessage.style.display = 'block';
        return;
    }
    
    if (noBookingsMessage) noBookingsMessage.style.display = 'none';
    
    const bookingsHtml = userBookings.map(booking => {
        const checkInDate = new Date(booking.checkIn);
        const checkOutDate = new Date(booking.checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const pricePerMonth = 2500;
        const totalPrice = (nights / 30) * pricePerMonth;
        
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-title">${booking.property}</div>
                        <div class="booking-status">${booking.status === 'cancellation_pending' ? 'CANCELLATION PENDING' : 'CONFIRMED'}</div>
                </div>
                <div class="booking-details">
                    <div class="detail-item">
                        <span class="detail-label">Check-in Date</span>
                        <span class="detail-value">${checkInDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Check-out Date</span>
                        <span class="detail-value">${checkOutDate.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Number of Guests</span>
                        <span class="detail-value">${booking.guests} ${booking.guests == 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Total Price</span>
                        <span class="detail-value">$${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                <div class="stay-duration">
                    <strong>${nights} Night${nights !== 1 ? 's' : ''}</strong> • ${nights > 30 ? 'Long term stay' : 'Short term stay'}
                </div>
                <div class="booking-actions">
                    <button class="btn-extend" onclick="openExtendModal('${booking.id}', '${booking.checkOut}')" ${booking.status === 'cancellation_pending' ? 'disabled' : ''}>Extend Stay</button>
                    <button class="btn-room-service" onclick="openRoomServiceModal('${booking.id}')" ${booking.status === 'cancellation_pending' ? 'disabled' : ''}>Room Service</button>
                    <button class="btn-cancel" onclick="showCancelConfirmation('${booking.id}')" ${booking.status === 'cancellation_pending' ? 'disabled' : ''}>Cancel Booking</button>
                </div>
            </div>
        `;
    }).join('');
    
    bookingsList.innerHTML = bookingsHtml;
}

function openExtendModal(bookingId, currentCheckOut) {
    console.log('[Extension] openExtendModal', bookingId, currentCheckOut);
    const modal = document.getElementById('extend-modal');
    const bookingIdField = document.getElementById('extend-booking-id');
    const currentCheckoutStored = document.getElementById('extend-current-checkout');
    const currentCheckoutField = document.getElementById('current-checkout');
    const newCheckoutField = document.getElementById('new-checkout');
    const form = document.getElementById('extend-form');
    
    const currentCheckoutDate = new Date(currentCheckOut);
    const nextDay = new Date(currentCheckoutDate.getTime() + 24 * 60 * 60 * 1000);
    const minDate = nextDay.toISOString().split('T')[0];

    if (bookingIdField) bookingIdField.value = bookingId;
    if (currentCheckoutStored) currentCheckoutStored.value = currentCheckOut;
    if (currentCheckoutField) {
        currentCheckoutField.value = currentCheckoutDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    if (newCheckoutField) {
        newCheckoutField.value = minDate;
        newCheckoutField.min = minDate;
        newCheckoutField.oninput = () => updateExtensionPreview(currentCheckoutDate);
    }

    updateExtensionPreview(currentCheckoutDate);

    if (form) {
        if (!form.dataset.extendHandlerBound) {
            form.addEventListener('submit', handleExtendStay);
            form.dataset.extendHandlerBound = 'true';
        }
    }
    
    if (modal) modal.style.display = 'block';
}

function updateExtensionPreview(currentCheckoutDate) {
    const newCheckoutField = document.getElementById('new-checkout');
    const additionalNightsDisplay = document.getElementById('additional-nights-display');
    const additionalCostDisplay = document.getElementById('additional-cost-display');
    if (!newCheckoutField || !additionalNightsDisplay || !additionalCostDisplay) return;

    const newCheckoutDate = new Date(newCheckoutField.value);
    if (isNaN(newCheckoutDate) || newCheckoutDate <= currentCheckoutDate) {
        additionalNightsDisplay.textContent = '0';
        additionalCostDisplay.textContent = '$0.00';
        return;
    }

    const additionalNights = Math.ceil((newCheckoutDate - currentCheckoutDate) / (1000 * 60 * 60 * 24));
    const additionalCost = Number(((additionalNights / 30) * PRICE_PER_MONTH).toFixed(2));
    additionalNightsDisplay.textContent = String(additionalNights);
    additionalCostDisplay.textContent = formatCurrency(additionalCost, 'USD');
}

function closeExtendModal() {
    const modal = document.getElementById('extend-modal');
    modal.style.display = 'none';
}

function handleExtendStay(e) {
    console.log('[Extension] handleExtendStay fired');
    e.preventDefault();

    const bookingIdField = document.getElementById('extend-booking-id');
    const currentCheckoutStored = document.getElementById('extend-current-checkout');
    const newCheckoutField = document.getElementById('new-checkout');
    const bookingId = bookingIdField?.value;
    const currentCheckOut = currentCheckoutStored?.value;

    if (!bookingId || !currentCheckOut || !newCheckoutField) {
        alert('Unable to process extension. Please try again.');
        return;
    }

    const newCheckout = newCheckoutField.value;
    console.log('[Extension] handleExtendStay data', { bookingId, currentCheckOut, newCheckout });
    const currentCheckoutDate = new Date(currentCheckOut);
    const newCheckoutDate = new Date(newCheckout);

    if (isNaN(currentCheckoutDate.getTime()) || isNaN(newCheckoutDate.getTime())) {
        alert('Invalid check-out dates. Please choose a valid new check-out date.');
        return;
    }

    if (newCheckoutDate <= currentCheckoutDate) {
        alert('New check-out date must be after the current check-out date.');
        return;
    }

    const additionalNights = Math.ceil((newCheckoutDate - currentCheckoutDate) / (1000 * 60 * 60 * 24));
    const additionalAmount = Number(((additionalNights / 30) * PRICE_PER_MONTH).toFixed(2));
    const session = getSession();
    const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
    const booking = allBookings.find(b => b.id == bookingId);

    const pendingExtension = {
        id: `EXT_${Date.now()}`,
        bookingId,
        userEmail: session?.email || null,
        property: booking?.property || 'Reserved Property',
        oldCheckOut: currentCheckOut,
        newCheckOut,
        additionalNights,
        amount: additionalAmount,
        createdDate: new Date().toISOString(),
        status: 'pending_extension_payment'
    };

    localStorage.setItem('nh_pending_extension', JSON.stringify(pendingExtension));

    const params = new URLSearchParams({ extension_id: pendingExtension.id, booking_id: bookingId, amount: String(additionalAmount) });
    const targetUrl = `payments.html?${params.toString()}`;
    console.log('[Extension] redirecting to:', targetUrl);
    window.location.href = targetUrl;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const extendModal = document.getElementById('extend-modal');
    const cancelModal = document.getElementById('cancel-modal');
    if (extendModal && event.target === extendModal) {
        extendModal.style.display = 'none';
    }
    if (cancelModal && event.target === cancelModal) {
        cancelModal.style.display = 'none';
    }
};

// ============================================
// FORM MESSAGE DISPLAY
// ============================================

function showFormMessage(message, type) {
    if (formMessage) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
        
        setTimeout(() => {
            formMessage.textContent = '';
            formMessage.className = 'form-message';
        }, 5000);
    }
}

// ============================================
// GALLERY IMAGE CHANGE
// ============================================

function changeMainImage(src) {
    const mainImage = document.getElementById('main-image');
    if (mainImage) {
        mainImage.src = src;
    }
    
    // Update active thumbnail
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.src === src) {
            thumb.classList.add('active');
        }
    });
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================

function setupSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                const element = document.querySelector(href);
                element.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ============================================
// PROPERTY DETAILS PAGE
// ============================================

// Pricing constant used across booking/payment calculations
const PRICE_PER_MONTH = 2500; // USD (fallback)

// Load properties from server into local cache for client-side pricing
async function loadPropertiesIntoCache() {
    try {
        const base = window.PAYMENTS_SERVER;
        const resp = await fetch(`${base}/api/properties`);
        if (!resp.ok) return;
        const props = await resp.json().catch(() => []);
        if (Array.isArray(props)) {
            localStorage.setItem('nh_properties', JSON.stringify(props));
        }
    } catch (err) {
        console.warn('Unable to load properties into cache', err);
    }
}

function getRateForProperty(title) {
    try {
        const props = JSON.parse(localStorage.getItem('nh_properties') || '[]');
        const found = props.find(p => String(p.title).trim().toLowerCase() === String(title).trim().toLowerCase());
        return found ? Number(found.rate_per_month) : PRICE_PER_MONTH;
    } catch (err) {
        return PRICE_PER_MONTH;
    }
}


function setupPropertyDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const propertyId = urlParams.get('id');
    
    if (propertyId) {
        loadPropertyDetails(propertyId);
    }
}

function loadPropertyDetails(id) {
    // Sample property data
    const properties = {
        1: {
            title: 'Luxury Studio Apartment',
            price: '$2,500',
            location: 'Downtown District',
            bedrooms: 1,
            bathrooms: 1,
            sqft: '550 sq ft',
            description: 'Experience luxury living in this beautifully furnished studio apartment. Located in the heart of the downtown district, this property offers the perfect blend of comfort and convenience.'
        },
        2: {
            title: 'Elegant One Bedroom',
            price: '$3,200',
            location: 'Midtown Elegance',
            bedrooms: 1,
            bathrooms: 1,
            sqft: '750 sq ft',
            description: 'Spacious one-bedroom apartment with separate living area, fully equipped kitchen, and premium finishes.'
        },
        3: {
            title: 'Premium Two Bedroom',
            price: '$4,500',
            location: 'Highrise Avenue',
            bedrooms: 2,
            bathrooms: 2,
            sqft: '1000 sq ft',
            description: 'Luxurious two-bedroom apartment with master suite, guest bedroom, and expansive living space.'
        },
        4: {
            title: 'Luxury Two Bedroom Penthouse',
            price: '$5,800',
            location: 'Waterfront Plaza',
            bedrooms: 2,
            bathrooms: 2,
            sqft: '1200 sq ft',
            description: 'Exclusive waterfront penthouse with panoramic views, private balcony, and state-of-the-art amenities.'
        },
        5: {
            title: 'Spacious Three Bedroom',
            price: '$6,500',
            location: 'Uptown Heights',
            bedrooms: 3,
            bathrooms: 2,
            sqft: '1400 sq ft',
            description: 'Perfect for families or groups. Three bedrooms, spacious living area, and modern amenities throughout.'
        },
        6: {
            title: 'Modern Studio with Balcony',
            price: '$2,800',
            location: 'Downtown District',
            bedrooms: 1,
            bathrooms: 1,
            sqft: '550 sq ft',
            description: 'Contemporary studio with private balcony, high ceilings, and access to building amenities.'
        }
    };
    
    const property = properties[id];
    if (property) {
        // Update page title
        const titleElement = document.getElementById('property-title');
        if (titleElement) titleElement.textContent = property.title;
        
        // Update bedrooms, bathrooms, sqft
        const bedroomsEl = document.getElementById('bedrooms');
        const bathroomsEl = document.getElementById('bathrooms');
        const sqftEl = document.getElementById('sqft');
        
        if (bedroomsEl) bedroomsEl.textContent = property.bedrooms;
        if (bathroomsEl) bathroomsEl.textContent = property.bathrooms;
        if (sqftEl) sqftEl.textContent = property.sqft;
    }
}

// ============================================
// EMAIL VALIDATION
// ============================================

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============================================
// DATE VALIDATION FOR BOOKING
// ============================================

function validateDates(checkIn, checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
        return { valid: false, message: 'Check-in date must be in the future.' };
    }
    
    if (checkOutDate <= checkInDate) {
        return { valid: false, message: 'Check-out date must be after check-in date.' };
    }
    
    return { valid: true };
}

// ============================================
// SCROLL ANIMATIONS (Optional Enhancement)
// ============================================

function observeElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });
    
    const cards = document.querySelectorAll('.property-card, .service-card, .testimonial-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(card);
    });
}

// ============================================
// INITIALIZE ALL FUNCTIONS
// ============================================

// Dynamically load PayPal SDK with the provided client id
function loadPayPalSdk(clientId) {
    return new Promise((resolve, reject) => {
        if (!clientId) return reject(new Error('Missing PayPal client id'));
        if (window.paypal) return resolve(window.paypal);
        const s = document.createElement('script');
        s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD`;
        s.async = true;
        s.onload = () => { if (window.paypal) resolve(window.paypal); else reject(new Error('PayPal SDK loaded but window.paypal missing')); };
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
    });
}

async function apiRequest(path, options = {}) {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fetchOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    };

    let lastError;
    for (const base of getBackendBaseCandidates()) {
        const url = `${base}${cleanPath}`;
        try {
            const response = await fetch(url, fetchOptions);
            const text = await response.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                data = { error: text };
            }

            if (!response.ok) {
                const error = new Error(data.error || data.message || response.statusText || 'Request failed');
                error.verified = data.verified;
                error.requiresVerification = data.requiresVerification;
                error.code = data.code;
                throw error;
            }

            return data;
        } catch (err) {
            lastError = err;
            if (err.name === 'TypeError' && /fetch/i.test(err.message)) {
                continue;
            }
            throw err;
        }
    }

    throw lastError || new Error('Request failed');
}

async function fetchUsersFromServer() {
    return apiRequest('/api/users');
}

async function signupUser(name, email, password) {
    return apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } });
}

async function loginUser(email, password) {
    const loginPath = window.PAYMENTS_LOGIN_PATH || '/api/auth/login';
    return apiRequest(loginPath, { method: 'POST', body: { email, password } });
}

async function changeUserPassword(email, currentPassword, newPassword) {
    return apiRequest('/api/auth/password', { method: 'PATCH', body: { email, currentPassword, newPassword } });
}

async function getUserDetails(email) {
    return apiRequest(`/api/auth/me?email=${encodeURIComponent(email)}`);
}

async function createBooking(booking) {
    return apiRequest('/api/bookings', { method: 'POST', body: booking });
}

async function fetchBookings() {
    return apiRequest('/api/bookings');
}

function isAdminSession() {
    const session = getSession();
    return session?.role === 'admin';
}

function setupAuthNav() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    const session = getSession();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const createNavItem = (href, text, id) => {
        const li = document.createElement('li');
        const anchor = document.createElement('a');
        anchor.href = href;
        anchor.textContent = text;
        if (id) anchor.id = id;
        if (href.endsWith(currentPage) || currentPage === '' && href.endsWith('index.html')) {
            anchor.classList.add('active');
        }
        li.appendChild(anchor);
        return li;
    };

    const removeLink = (selector) => {
        const item = nav.querySelector(selector);
        if (item) {
            const li = item.closest('li');
            if (li) li.remove();
        }
    };

    const hasLink = (href) => Boolean(nav.querySelector(`a[href="${href}"]`));

    if (session) {
        removeLink('a[href="login.html"]');
        removeLink('a[href="signup.html"]');
        removeLink('a[href="account.html"]');
        removeLink('#nav-logout-link');

        if (session.role === 'admin' && !hasLink('admin.html')) {
            const adminItem = createNavItem('admin.html', 'Admin');
            nav.appendChild(adminItem);
        }

        const navAccount = document.getElementById('nav-account');
        if (navAccount) {
            const initials = getUserInitials(session);
            navAccount.classList.add('nav-account-avatar');
            navAccount.innerHTML = `
                <span class="nav-account-initials">${initials}</span>
                <div class="nav-account-menu">
                    <button class="nav-account-menu-item" type="button" data-action="account">Account</button>
                    <button class="nav-account-menu-item" type="button" data-action="logout">Log Out</button>
                </div>
            `;
            navAccount.title = `Signed in as ${session.name || session.email}`;
            navAccount.onclick = (e) => {
                e.stopPropagation();
                toggleAccountMenu(navAccount);
            };

            const menu = navAccount.querySelector('.nav-account-menu');
            if (menu) {
                menu.addEventListener('click', (e) => e.stopPropagation());
                const accountBtn = menu.querySelector('[data-action="account"]');
                const logoutBtn = menu.querySelector('[data-action="logout"]');
                if (accountBtn) {
                    accountBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = 'account.html';
                    });
                }
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        clearSession();
                        window.location.href = 'login.html';
                    });
                }
            }
        }
    } else {
        removeLink('a[href="account.html"]');
        removeLink('#nav-logout-link');

        if (!hasLink('login.html')) {
            nav.appendChild(createNavItem('login.html', 'Login'));
        }
        if (!hasLink('signup.html')) {
            nav.appendChild(createNavItem('signup.html', 'Sign Up'));
        }
    }

    const logoutAnchor = document.getElementById('nav-logout-link');
    if (logoutAnchor) {
        logoutAnchor.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.location.href = 'login.html';
        });
    }
}

function getUserInitials(session) {
    const name = (session?.name || session?.email || '').trim();
    if (!name) return '';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toggleAccountMenu(navAccount) {
    const menu = navAccount.querySelector('.nav-account-menu');
    if (!menu) return;
    const isOpen = menu.style.display === 'block';
    closeAccountMenu();
    if (!isOpen) {
        menu.style.display = 'block';
        document.addEventListener('click', handleAccountMenuClose);
    }
}

function closeAccountMenu() {
    const openMenu = document.querySelector('.nav-account-menu');
    if (openMenu) {
        openMenu.style.display = 'none';
        document.removeEventListener('click', handleAccountMenuClose);
    }
}

function handleAccountMenuClose(event) {
    const menu = document.querySelector('.nav-account-menu');
    if (!menu) return;
    const navAccount = document.getElementById('nav-account');
    if (navAccount && !navAccount.contains(event.target)) {
        closeAccountMenu();
    }
}

function setupAccountPage() {
    const accountForm = document.getElementById('account-form');
    const accountInfo = document.getElementById('account-info');
    const accountMessage = document.getElementById('account-message');
    const logoutButton = document.getElementById('logout-button');
    const verificationStatus = document.getElementById('verification-status');
    const verificationMessage = document.getElementById('verification-message');
    const sendVerificationBtn = document.getElementById('send-verification-btn');
    const verifyCodePanel = document.getElementById('verification-code-panel');
    const verificationOtpInput = document.getElementById('account-verification-otp');
    const accountVerifyBtn = document.getElementById('account-verify-btn');

    if (!accountForm) return;

    const session = getSession();
    if (!session) {
        if (accountInfo) accountInfo.textContent = 'You are not logged in. Please log in first.';
        accountForm.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';
        if (sendVerificationBtn) sendVerificationBtn.style.display = 'none';
        if (verifyCodePanel) verifyCodePanel.style.display = 'none';
        return;
    }

    const updateVerificationUI = (verified, showOtpPanel = false) => {
        if (accountInfo) {
            accountInfo.textContent = verified
                ? `Signed in as ${session.email}. Your email is verified.`
                : `Signed in as ${session.email}. Your email is not verified. Use the controls below to verify it.`;
        }
        if (verificationStatus) verificationStatus.textContent = verified ? 'Verified' : 'Not verified';
        if (sendVerificationBtn) sendVerificationBtn.style.display = verified ? 'none' : 'inline-flex';
        if (verifyCodePanel) verifyCodePanel.style.display = verified ? 'none' : (showOtpPanel ? 'flex' : 'none');
    };

    const refreshVerificationState = async () => {
        try {
            const userDetails = await getUserDetails(session.email);
            updateVerificationUI(userDetails.verified, false);
        } catch (err) {
            if (verificationStatus) verificationStatus.textContent = 'Unable to load verification status.';
        }
    };

    refreshVerificationState();

    if (sendVerificationBtn) {
        sendVerificationBtn.addEventListener('click', async () => {
            if (verificationMessage) {
                verificationMessage.textContent = '';
                verificationMessage.className = 'form-message';
            }
            try {
                const res = await apiRequest('/api/auth/send-verification', { method: 'POST', body: { email: session.email } });
                if (verificationMessage) {
                    verificationMessage.textContent = `${res.message || 'Verification code sent — check your email.'}`;
                    verificationMessage.className = 'form-message info';
                }
                if (verifyCodePanel) verifyCodePanel.style.display = 'flex';
                startResendCountdown(sendVerificationBtn, 60);
            } catch (err) {
                const wait = err?.waitSeconds || null;
                if (wait) {
                    if (verificationMessage) {
                        verificationMessage.textContent = `Please wait ${wait}s before sending another code.`;
                        verificationMessage.className = 'form-message error';
                    }
                    startResendCountdown(sendVerificationBtn, wait);
                } else if (verificationMessage) {
                    verificationMessage.textContent = err.message || 'Unable to send verification email';
                    verificationMessage.className = 'form-message error';
                }
            }
        });
    }

    if (accountVerifyBtn) {
        accountVerifyBtn.addEventListener('click', async () => {
            const code = verificationOtpInput?.value.trim();
            if (!code) {
                if (verificationMessage) {
                    verificationMessage.textContent = 'Enter the verification code.';
                    verificationMessage.className = 'form-message error';
                }
                return;
            }
            try {
                await apiRequest('/api/auth/verify-otp', { method: 'POST', body: { email: session.email, otp: code } });
                if (verificationMessage) {
                    verificationMessage.textContent = 'Email verified successfully.';
                    verificationMessage.className = 'form-message success';
                }
                updateVerificationUI(true, false);
            } catch (err) {
                if (verificationMessage) {
                    verificationMessage.textContent = err.message || 'Verification failed';
                    verificationMessage.className = 'form-message error';
                }
            }
        });
    }

    accountForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('current-password').value.trim();
        const newPassword = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            accountMessage.textContent = 'Please complete all password fields.';
            accountMessage.className = 'form-message error';
            return;
        }

        if (newPassword.length < 8) {
            accountMessage.textContent = 'New password must be at least 8 characters.';
            accountMessage.className = 'form-message error';
            return;
        }

        if (newPassword !== confirmPassword) {
            accountMessage.textContent = 'New password and confirmation do not match.';
            accountMessage.className = 'form-message error';
            return;
        }

        try {
            await changeUserPassword(session.email, currentPassword, newPassword);
            accountMessage.textContent = 'Password changed successfully.';
            accountMessage.className = 'form-message success';
            accountForm.reset();
        } catch (err) {
            accountMessage.textContent = err.message;
            accountMessage.className = 'form-message error';
        }
    });

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            clearSession();
            window.location.href = 'login.html';
        });
    }
}

async function setupAdminPage() {
    const adminSection = document.getElementById('admin-dashboard');
    if (!adminSection) return;

    const session = getSession();
    if (!session || session.role !== 'admin') {
        adminSection.innerHTML = '<p class="form-message error">Admin access required. Please log in as the admin account.</p>';
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        return;
    }

    let users = [];
    try {
        users = await fetchUsersFromServer();
    } catch (err) {
        users = [];
        console.error('Unable to fetch users for admin page:', err);
    }

    const localBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
    let bookings = localBookings;
    const payments = JSON.parse(localStorage.getItem('nh_payments') || '[]');
    // Try to fetch server-side bookings for authoritative data; preserve local cache if the server returns no bookings
    try {
        const base = window.PAYMENTS_SERVER;
        const resp = await fetch(`${base}/api/bookings`);
        if (resp.ok) {
            const serverBookings = await resp.json().catch(() => null);
            if (Array.isArray(serverBookings)) {
                if (serverBookings.length || !localBookings.length) {
                    bookings = serverBookings;
                    localStorage.setItem('nh_bookings', JSON.stringify(serverBookings));
                }
            }
        }
    } catch (err) {
        console.warn('Unable to fetch server bookings for admin page', err);
    }

    const userRows = users.map(u => `
        <tr>
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>${u.role || 'user'}</td>
        </tr>
    `).join('');

    const bookingRows = bookings.map(b => `
        <tr>
            <td>${b.id}</td>
            <td>${b.property}</td>
            <td>${b.userEmail || 'N/A'}</td>
            <td>${b.checkIn}</td>
            <td>${b.checkOut}</td>
            <td>${b.status || 'unknown'}</td>
            <td>
                ${b.status === 'cancellation_pending' ? `
                    <button class="btn-extend" onclick="approveCancellation('${b.id}')">Approve</button>
                    <button class="btn-cancel" onclick="denyCancellation('${b.id}')">Deny</button>
                ` : ''}
            </td>
        </tr>
    `).join('');

    const paymentRows = payments.map(p => {
        const dateObj = new Date(p.date);
        const dateStr = dateObj.toLocaleString();
        return `
        <tr data-payment-id="${p.id}" data-payment-date="${p.date}">
            <td>${p.id}</td>
            <td>${p.provider}</td>
            <td>${p.last4 || ''}</td>
            <td>${formatCurrency(p.amount, p.currency || 'USD')}</td>
            <td>${dateStr}</td>
            <td>${p.status || 'unknown'}</td>
        </tr>
    `;
    }).join('');

    // Fetch properties so admin can edit rates
    let properties = [];
    try {
        const base = window.PAYMENTS_SERVER;
        const resp = await fetch(`${base}/api/properties`);
        if (resp.ok) properties = await resp.json().catch(() => []);
    } catch (err) {
        console.warn('Unable to load properties for admin page', err);
    }

    const propertyRows = properties.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.title}</td>
            <td><input type="number" id="prop-rate-${p.id}" value="${p.rate_per_month}" style="width:120px" /></td>
            <td style="white-space:nowrap"><button class="btn-extend" onclick="updatePropertyRate('${p.id}')">Save</button></td>
            <td><span id="prop-status-${p.id}" class="prop-status info"></span></td>
        </tr>
    `).join('');

    adminSection.innerHTML = `
        <div class="admin-summary" style="margin-bottom:20px;">
            <h2>Admin Dashboard</h2>
            <p>Welcome, ${session.name}. You are signed in as admin.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px;">
                <div class="admin-card">Users: ${users.length}</div>
                <div class="admin-card">Bookings: ${bookings.length}</div>
                <div class="admin-card">Payments: ${payments.length}</div>
            </div>
        </div>
        <div style="margin-bottom:24px;">
            <h3>Properties</h3>
            <div id="property-message" class="form-message" style="display:none;margin-bottom:8px"></div>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Title</th><th>Monthly Rate (USD)</th><th>Actions</th><th>Status</th></tr></thead><tbody>${propertyRows}</tbody></table></div>
        </div>
        <div style="margin-bottom:24px;">
            <h3>Registered Users</h3>
            <div class="table-container"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>${userRows}</tbody></table></div>
        </div>
        <div style="margin-bottom:24px;">
            <h3>Bookings</h3>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Property</th><th>User</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr></thead><tbody>${bookingRows}</tbody></table></div>
        </div>
        <div>
            <h3>Payments</h3>
            <div style="margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;">
                <div>
                    <label for="search-transaction-id" style="display:block;margin-bottom:6px;font-size:14px;color:#aaa;">Transaction ID</label>
                    <input type="text" id="search-transaction-id" placeholder="Search by ID..." style="padding:8px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#eee;font-size:14px;" />
                </div>
                <div>
                    <label for="search-payment-date" style="display:block;margin-bottom:6px;font-size:14px;color:#aaa;">Date (YYYY-MM-DD)</label>
                    <input type="date" id="search-payment-date" style="padding:8px;border:1px solid #333;border-radius:6px;background:#1a1a1a;color:#eee;font-size:14px;" />
                </div>
                <button id="clear-payment-search" class="btn-secondary" style="padding:8px 16px;">Clear Filters</button>
            </div>
            <div class="table-container"><table><thead><tr><th>ID</th><th>Provider</th><th>Last4</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody id="payments-tbody">${paymentRows}</tbody></table></div>
        </div>
    `;

    // Setup payment search filters
    const searchTransactionInput = document.getElementById('search-transaction-id');
    const searchDateInput = document.getElementById('search-payment-date');
    const clearSearchBtn = document.getElementById('clear-payment-search');
    const paymentsTbody = document.getElementById('payments-tbody');

    function filterPayments() {
        const searchId = searchTransactionInput.value.toLowerCase().trim();
        const searchDate = searchDateInput.value; // Format: YYYY-MM-DD
        const rows = paymentsTbody.querySelectorAll('tr');

        rows.forEach(row => {
            const paymentId = row.getAttribute('data-payment-id') || '';
            const paymentDate = row.getAttribute('data-payment-date') || '';
            
            let idMatch = true;
            let dateMatch = true;

            // Check transaction ID match
            if (searchId) {
                idMatch = paymentId.toLowerCase().includes(searchId);
            }

            // Check date match
            if (searchDate) {
                const paymentDateStr = paymentDate.split('T')[0]; // Extract YYYY-MM-DD from ISO string
                dateMatch = paymentDateStr === searchDate;
            }

            // Show row if both conditions match
            row.style.display = (idMatch && dateMatch) ? '' : 'none';
        });
    }

    if (searchTransactionInput) {
        searchTransactionInput.addEventListener('input', filterPayments);
    }
    if (searchDateInput) {
        searchDateInput.addEventListener('change', filterPayments);
    }
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchTransactionInput.value = '';
            searchDateInput.value = '';
            filterPayments();
        });
    }
}

function setupAuthForms() {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const session = getSession();

    if (signupForm) {
        if (session) {
            window.location.href = 'index.html';
            return;
        }

        const msg = document.getElementById('signup-message');

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim().toLowerCase();
            const pass = document.getElementById('signup-password').value;
            const pass2 = document.getElementById('signup-password-confirm').value;

            if (!name || !email || !pass) {
                msg.textContent = 'Please fill all fields.';
                msg.className = 'form-message error';
                return;
            }
            if (pass !== pass2) {
                msg.textContent = 'Passwords do not match.';
                msg.className = 'form-message error';
                return;
            }

            try {
                const user = await signupUser(name, email, pass);
                localStorage.setItem('nh_session', JSON.stringify({ email: user.email, name: user.name, role: user.role, verified: user.verified }));
                window.location.href = 'index.html';
            } catch (err) {
                msg.textContent = err.message;
                msg.className = 'form-message error';
            }
        });
    }

    if (loginForm) {
        if (session) {
            window.location.href = 'index.html';
            return;
        }

        const msg = document.getElementById('login-message');
        const forgotLink = document.getElementById('forgot-password-link');
        const forgotPanel = document.getElementById('forgot-password-panel');
        const forgotForm = document.getElementById('forgot-password-form');
        const forgotMsg = document.getElementById('forgot-password-message');
        const backToLogin = document.getElementById('back-to-login');

        const showForgotPanel = () => {
            loginForm.style.display = 'none';
            if (forgotPanel) forgotPanel.style.display = 'block';
            if (msg) { msg.textContent = ''; msg.className = 'form-message'; }
        };

        const hideForgotPanel = () => {
            loginForm.style.display = 'block';
            if (forgotPanel) forgotPanel.style.display = 'none';
            if (forgotMsg) { forgotMsg.textContent = ''; forgotMsg.className = 'form-message'; }
            if (forgotForm) forgotForm.reset();
            const emailBox = document.getElementById('forgot-password-email-box');
            if (emailBox) emailBox.style.display = 'none';
        };

        if (forgotLink) {
            forgotLink.addEventListener('click', (e) => {
                e.preventDefault();
                showForgotPanel();
            });
        }

        if (backToLogin) {
            backToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                hideForgotPanel();
            });
        }

        if (forgotForm) {
            forgotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgot-email').value.trim().toLowerCase();
                if (!email) {
                    forgotMsg.textContent = 'Please enter your email.';
                    forgotMsg.className = 'form-message error';
                    return;
                }

                const tempPassword = Math.random().toString(36).slice(-8);

                try {
                    const base = window.PAYMENTS_SERVER;
                    const response = await fetch(`${base}/send-reset-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, tempPassword })
                    });
                    let data;
                    const text = await response.text();
                    try {
                        data = text ? JSON.parse(text) : {};
                    } catch (parseErr) {
                        data = null;
                    }

                    if (!response.ok) {
                        const errorMessage = data?.error || data?.message || text || 'Failed to send reset email';
                        throw new Error(errorMessage);
                    }

                    const emailBox = document.getElementById('forgot-password-email-box');
                    const previewLink = document.getElementById('forgot-password-preview-link');
                    const emailText = document.getElementById('forgot-password-email-text');

                    if (emailBox) emailBox.style.display = 'block';
                    if (previewLink) {
                        if (data.previewUrl) {
                            previewLink.href = data.previewUrl;
                            previewLink.style.display = 'inline-block';
                        } else {
                            previewLink.style.display = 'none';
                        }
                    }

                    if (data.mode === 'ethereal') {
                        forgotMsg.textContent = `Temporary password created. A test email preview is available below because SMTP is not configured.`;
                        if (emailText) {
                            emailText.textContent = 'This environment uses a test mail preview. No actual email will be delivered unless SMTP is configured.';
                        }
                    } else {
                        forgotMsg.textContent = `Password reset email sent to ${email}. Please check your inbox.`;
                        if (emailText) {
                            emailText.textContent = 'A password reset email has been sent to your address.';
                        }
                    }
                    forgotMsg.className = 'form-message success';
                } catch (err) {
                    forgotMsg.textContent = `Reset email failed: ${err.message}`;
                    forgotMsg.className = 'form-message error';
                }
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-password').value;

            if (!email || !pass) {
                msg.textContent = 'Please enter email and password.';
                msg.className = 'form-message error';
                return;
            }

            try {
                const user = await loginUser(email, pass);
                
                // Ensure we have required user properties
                if (!user.email || !user.name) {
                    throw new Error('Invalid server response: missing user email or name');
                }
                
                // Store session with all available properties
                const sessionData = {
                    email: user.email,
                    name: user.name,
                    role: user.role || 'user',
                    verified: user.verified || false
                };
                localStorage.setItem('nh_session', JSON.stringify(sessionData));
                
                msg.textContent = `Welcome back, ${user.name}! Redirecting to the home page...`;
                msg.className = 'form-message success';
                setTimeout(() => { window.location.href = 'index.html'; }, 900);
            } catch (err) {
                const errorText = err.message || 'Login failed';
                msg.textContent = errorText;
                msg.className = 'form-message error';
                
                // Check if the error is due to unverified email
                const isNotVerified = err.requiresVerification || errorText.toLowerCase().includes('not verified') || errorText.toLowerCase().includes('verify');
                if (isNotVerified) {
                    showLoginResend(email);
                }
            }
        });
    }

    function showLoginResend(email) {
        const existing = document.getElementById('login-resend');
        if (existing) return;
        const container = document.querySelector('.contact-form-wrapper');
        if (!container) return;

        const el = document.createElement('div');
        el.id = 'login-resend';
        el.style.marginTop = '12px';
        el.innerHTML = `
            <div style="margin-bottom:12px;font-size:0.95rem;color:#ddd">
                Your email is not verified yet. Enter the code from your email or resend it below.
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                <input id="login-otp" type="text" placeholder="Verification code" style="width:180px;padding:8px;border-radius:4px;border:1px solid #333;background:#0f0f0f;color:#fff;" />
                <button id="login-verify-btn" class="btn-primary">Verify code</button>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                <button id="login-resend-btn" class="btn-secondary">Resend verification</button>
                <span id="login-resend-msg" style="margin-left:12px"></span>
            </div>
        `;

        container.appendChild(el);

        const loginVerifyBtn = document.getElementById('login-verify-btn');
        const loginResendBtn = document.getElementById('login-resend-btn');
        const msgSpan = document.getElementById('login-resend-msg');

        if (loginVerifyBtn) {
            loginVerifyBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                const codeInput = document.getElementById('login-otp');
                if (!codeInput) return;
                const code = codeInput.value.trim();
                if (!code) {
                    msgSpan.textContent = 'Enter the verification code.';
                    msgSpan.className = 'form-message error';
                    return;
                }

                try {
                    const res = await apiRequest('/api/auth/verify-otp', { method: 'POST', body: { email, otp: code } });
                    
                    // Store the verified session
                    const sessionData = {
                        email: res.email,
                        name: res.name,
                        role: res.role || 'user',
                        verified: true
                    };
                    localStorage.setItem('nh_session', JSON.stringify(sessionData));
                    
                    msgSpan.textContent = 'Verified! Redirecting...';
                    msgSpan.className = 'form-message success';
                    setTimeout(() => window.location.href = 'index.html', 900);
                } catch (err) {
                    msgSpan.textContent = err.message || 'Verification failed';
                    msgSpan.className = 'form-message error';
                }
            });
        }

        if (loginResendBtn) {
            loginResendBtn.addEventListener('click', async () => {
                try {
                    const res = await apiRequest('/api/auth/resend-otp', { method: 'POST', body: { email } });
                    msgSpan.textContent = 'Code resent — check your email';
                    msgSpan.className = 'form-message info';
                    startResendCountdown(loginResendBtn, 60);
                } catch (err) {
                    const wait = err?.waitSeconds || null;
                    if (wait) {
                        msgSpan.textContent = `Please wait ${wait}s before resending.`;
                        msgSpan.className = 'form-message error';
                        startResendCountdown(loginResendBtn, wait);
                    } else {
                        msgSpan.textContent = err.message || 'Unable to resend';
                        msgSpan.className = 'form-message error';
                    }
                }
            });
        }
    }

    function startResendCountdown(button, seconds) {
        if (!button) return;
        let remaining = Number(seconds) || 60;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = `${originalText} (${remaining}s)`;
        const iv = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(iv);
                button.disabled = false;
                button.textContent = originalText;
                return;
            }
            button.textContent = `${originalText} (${remaining}s)`;
        }, 1000);
    }
}

// ============================================
// AUTH (LOGIN / SIGNUP) - simple client-side
// ============================================
function getSession() {
    try {
        return JSON.parse(localStorage.getItem('nh_session') || 'null');
    } catch {
        return null;
    }
}

function clearSession() {
    localStorage.removeItem('nh_session');
}

document.addEventListener('DOMContentLoaded', async () => {
    toggleMobileMenu();
    setupPriceFilter();
    setupFilterButtons();
    setupContactForm();
    setupBookingForm();
    setupSmoothScroll();
    setupPropertyDetails();
    observeElements();
    setupAuthNav();
    setupAuthForms();
    setupAccountPage();
    setupPaymentForm();
    setupReservationsPage();
    await setupAdminPage();

    // Load payment configuration from server and initialize SDKs
    const base = window.PAYMENTS_SERVER;
    try {
        const cfgResp = await fetch(`${base}/config`);
        if (cfgResp.ok) {
            const cfg = await cfgResp.json();
            if (cfg.stripePublishableKey) window.STRIPE_PUBLISHABLE_KEY = cfg.stripePublishableKey;
            if (cfg.paypalClientId) {
                try { await loadPayPalSdk(cfg.paypalClientId); } catch (e) { console.warn('PayPal SDK load failed', e); }
            }
        } else {
            console.warn('Could not fetch payment config');
        }
    } catch (err) {
        console.warn('Error fetching payment config', err);
    }

    setupStripeAndPayPal();
    await checkStripeCheckoutResult();
    // Load properties into local cache for client-side pricing
    loadPropertiesIntoCache();

    console.log('Nyodera Heights website initialized successfully!');
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Get URL parameter
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// Placeholder functions for payment and admin functionality
async function setupPaymentForm() {
    console.log('Payment form setup - use backend at:', window.PAYMENTS_SERVER);
}

async function checkStripeCheckoutResult() {
    console.log('Checking Stripe result');
}

function setupStripeAndPayPal() {
    console.log('Stripe and PayPal setup - use backend at:', window.PAYMENTS_SERVER);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateEmail,
        validateDates,
        formatCurrency,
        getUrlParameter,
        setupReservationsPage,
        renderBookings,
        openExtendModal,
        closeExtendModal,
        handleExtendStay
    };
}
