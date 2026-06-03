// ============================================
// NYODERA HEIGHTS - JAVASCRIPT
// ============================================

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

function showCancelConfirmation(bookingId) {
    const modal = document.getElementById('cancel-modal');
    if (!modal) return;

    const confirmRefund = document.getElementById('confirm-cancel-refund');
    const confirmNoRefund = document.getElementById('confirm-cancel-no-refund');

    if (confirmRefund) {
        confirmRefund.onclick = () => {
            cancelBooking(bookingId, true);
        };
    }

    if (confirmNoRefund) {
        confirmNoRefund.onclick = () => {
            cancelBooking(bookingId, false);
        };
    }

    modal.style.display = 'block';
}

function closeCancelModal() {
    const modal = document.getElementById('cancel-modal');
    if (modal) modal.style.display = 'none';
}

function cancelBooking(bookingId, issueRefund = true) {
    closeCancelModal();
    // Send cancellation request to server
    (async () => {
        try {
            const base = await getPaymentsServer();
            const url = (base ? base : '') + '/api/bookings/cancel-request';
            const payload = { bookingId, refundRequested: Boolean(issueRefund), requestedBy: getSession()?.email };

            let resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            let data = await resp.json().catch(() => null);

            if (!resp.ok && data?.error === 'Booking not found') {
                const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
                const booking = allBookings.find(b => String(b.id) === String(bookingId));
                if (booking) {
                    try {
                        await createBooking(booking);
                        resp = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        data = await resp.json().catch(() => null);
                    } catch (syncErr) {
                        console.warn('Unable to sync booking to server before cancellation:', syncErr);
                    }
                }
            }

            if (!resp.ok) throw new Error(data?.error || 'Cancellation request failed');

            // Update local cache and UI
            const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
            const idx = allBookings.findIndex(b => String(b.id) === String(bookingId));
            if (idx >= 0) allBookings[idx] = data.booking;
            localStorage.setItem('nh_bookings', JSON.stringify(allBookings));
            renderBookings();
            alert('Your cancellation request has been submitted and is pending admin approval.');
        } catch (err) {
            console.error('cancelBooking error', err);
            alert('Unable to submit cancellation request: ' + (err.message || err));
        }
    })();
    
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
        const base = await getPaymentsServer();
        const resp = await fetch((base ? base : '') + '/api/properties');
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
            description: 'Experience luxury living in this beautifully furnished studio apartment. Located in the heart of the downtown district, this property offers the perfect blend of comfort, style, and convenience.'
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

const DEFAULT_PAYMENTS_SERVER = 'https://nyoderahomes-backend.onrender.com';
let paymentsServerCache = null;
let paymentsServerProbePromise = null;

function normalizeServerBase(value) {
    if (!value) return '';
    return value.toString().trim().replace(/\/+$/g, '');
}

function getPaymentsServerCandidates() {
    const candidates = [];
    const envServer = normalizeServerBase(window.PAYMENTS_SERVER || '');
    const origin = window.location.protocol === 'file:' ? '' : normalizeServerBase(window.location.origin || '');
    const pathname = window.location.pathname || '';

    if (envServer) {
        candidates.push(envServer);
    }
    candidates.push(DEFAULT_PAYMENTS_SERVER);
    if (origin) {
        candidates.push(origin);

        const pathPrefixMatch = pathname.match(/^\/(\d+)(?:\/|$)/);
        if (pathPrefixMatch) {
            candidates.push(`${origin}/${pathPrefixMatch[1]}`);
        }

        if (origin.includes('.app.github.dev') || origin.includes('.githubpreview.dev') || origin.includes('.github.dev')) {
            candidates.push(`${origin}/4242`);
            const host = origin.replace(/^https?:\/\//, '');
            if (!host.startsWith('4242-')) {
                candidates.push(`${window.location.protocol}//4242-${host}`);
            }
        }

        const hostName = window.location.hostname;
        if (hostName) {
            candidates.push(`${window.location.protocol}//${hostName}:4242`);
            candidates.push(`${window.location.protocol}//${hostName}:4243`);
        }
    }

    if (origin && !origin.startsWith('file:')) {
        candidates.push('');
    }

    candidates.push('http://localhost:4242', 'https://localhost:4242', 'http://localhost:4243', 'https://localhost:4243');
    return Array.from(new Set(candidates));
}

async function probePaymentsServerBase(base) {
    const url = base ? `${base}/config` : '/config';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    try {
        const resp = await fetch(url, { method: 'GET', signal: controller.signal });
        return resp.ok;
    } catch (err) {
        console.warn('[Payments] probe failed:', url, err);
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

async function getPaymentsServer() {
    if (paymentsServerCache !== null) return paymentsServerCache;
    if (!paymentsServerProbePromise) {
        paymentsServerProbePromise = (async () => {
            const candidates = getPaymentsServerCandidates();
            for (const base of candidates) {
                const normalized = normalizeServerBase(base);
                const probeUrl = normalized ? `${normalized}/config` : '/config';
                console.log('[Payments] probing server base:', probeUrl);
                if (await probePaymentsServerBase(normalized)) {
                    paymentsServerCache = normalized;
                    console.log('[Payments] selected server base:', normalized || '(relative)');
                    return normalized;
                }
            }
            paymentsServerCache = normalizeServerBase(DEFAULT_PAYMENTS_SERVER);
            console.warn('[Payments] no valid server base found from probes, falling back to default:', paymentsServerCache);
            return paymentsServerCache;
        })();
    }
    return paymentsServerProbePromise;
}

// Persist a payment record and attach the current logged-in user if any
function addPaymentRecord(record) {
    try {
        const session = getSession();
        const payments = JSON.parse(localStorage.getItem('nh_payments') || '[]');
        const rec = Object.assign({}, record, { userEmail: session?.email || null });
        payments.push(rec);
        localStorage.setItem('nh_payments', JSON.stringify(payments));
        return rec;
    } catch (err) {
        console.error('addPaymentRecord error', err);
        return record;
    }
}

// Finalize a pending booking (if any) after receiving a payment record
async function finalizeBookingAfterPayment(paymentRecord) {
    try {
        const pendingExtension = JSON.parse(localStorage.getItem('nh_pending_extension') || 'null');
        if (pendingExtension) {
            const session = getSession();
            if (pendingExtension.userEmail && session && pendingExtension.userEmail !== session.email) return;

            const bookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
            const booking = bookings.find(b => b.id === pendingExtension.bookingId);
            if (!booking) {
                console.error('No booking found for extension payment', pendingExtension.bookingId);
                return;
            }

            booking.checkOut = pendingExtension.newCheckOut;
            booking.paidAmount = Number((booking.paidAmount || 0) + paymentRecord.amount);
            booking.extensionPaymentId = paymentRecord.id;
            booking.extensionPaidAmount = paymentRecord.amount;
            booking.extensionNights = pendingExtension.additionalNights;
            booking.lastExtensionDate = new Date().toISOString();

            localStorage.setItem('nh_bookings', JSON.stringify(bookings));
            localStorage.removeItem('nh_pending_extension');

            try {
                await createBooking(booking);
            } catch (err) {
                console.warn('Unable to sync extended booking to server:', err);
            }

            alert(`Stay extension confirmed!\nProperty: ${booking.property}\nNew check-out date: ${new Date(pendingExtension.newCheckOut).toLocaleDateString()}\nAmount paid: ${formatCurrency(paymentRecord.amount, paymentRecord.currency || 'USD')}`);
            window.location.href = 'reservations.html';
            return;
        }

        const pending = JSON.parse(localStorage.getItem('nh_pending_booking') || 'null');
        if (!pending) return;
        const session = getSession();
        if (pending.userEmail && session && pending.userEmail !== session.email) return;

        const booking = Object.assign({}, pending, {
            status: 'confirmed',
            paymentId: paymentRecord.id,
            paymentAmount: paymentRecord.amount,
            paymentCurrency: paymentRecord.currency || 'USD',
            paymentProvider: paymentRecord.provider || 'unknown',
            paymentCaptureId: paymentRecord.captureId || null,
            paidAmount: paymentRecord.amount,
            confirmedDate: new Date().toISOString()
        });

        const bookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('nh_bookings', JSON.stringify(bookings));
        localStorage.removeItem('nh_pending_booking');
        try {
            await createBooking(booking);
        } catch (err) {
            console.warn('Unable to save booking to server, continuing with local storage.', err);
        }

        alert(`Booking confirmed!\nProperty: ${booking.property}\nCheck-in: ${booking.checkIn}\nCheck-out: ${booking.checkOut}\nAmount paid: ${formatCurrency(booking.paidAmount, paymentRecord.currency || 'USD')}`);
        // Redirect to reservations page so user can view the confirmed booking
        window.location.href = 'reservations.html';
    } catch (err) {
        console.error('finalizeBookingAfterPayment error', err);
    }
}

async function checkStripeCheckoutResult() {
    const sessionId = getUrlParameter('session_id');
    const canceled = getUrlParameter('canceled');
    if (!sessionId && !canceled) return;

    const base = await getPaymentsServer();
    if (canceled) {
        alert('Stripe checkout was canceled.');
        return;
    }

    try {
        const resp = await fetch(base + `/checkout-session/${encodeURIComponent(sessionId)}`);
        if (!resp.ok) throw new Error('Unable to retrieve session');
        const session = await resp.json();
        const amount = session.amount_total / 100;
        const paymentIntent = session.payment_intent;
        const last4 = paymentIntent?.charges?.data?.[0]?.payment_method_details?.card?.last4 || 'card';
        const record = {
            id: session.id,
            provider: 'Stripe',
            amount,
            currency: 'USD',
            last4,
            date: new Date().toISOString(),
            status: session.payment_status,
            description: session.payment_intent?.description || 'Stripe Checkout'
        };
        // Persist payment and associate with any pending booking
        const saved = addPaymentRecord(record);
        renderPaymentHistory();
        alert(`Stripe payment completed: ${formatCurrency(amount, 'USD')}`);
        // Finalize booking if there was a pending booking for this user
        finalizeBookingAfterPayment(saved);
        if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (err) {
        console.error(err);
        alert('Unable to verify Stripe checkout result.');
    }
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
    const base = await getPaymentsServer();
    try {
        const cfgResp = await fetch((base ? base : '') + '/config');
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

async function apiRequest(path, options = {}) {
    const base = await getPaymentsServer();
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = base ? `${base}${cleanPath}` : cleanPath;

    const fetchOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    };

    const response = await fetch(url, fetchOptions);
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        data = { error: text };
    }

    if (!response.ok) {
        throw new Error(data.error || response.statusText || 'Request failed');
    }

    return data;
}

async function fetchUsersFromServer() {
    return apiRequest('/api/users');
}

async function signupUser(name, email, password) {
    return apiRequest('/api/auth/signup', { method: 'POST', body: { name, email, password } });
}

async function loginUser(email, password) {
    return apiRequest('/api/auth/login', { method: 'POST', body: { email, password } });
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
        const base = await getPaymentsServer();
        const resp = await fetch((base ? base : '') + '/api/bookings');
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
        const base = await getPaymentsServer();
        const resp = await fetch((base ? base : '') + '/api/properties');
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
                    const base = await getPaymentsServer();
                    const response = await fetch((base ? base : '') + '/send-reset-email', {
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
                msg.textContent = `Welcome back, ${user.name}! Redirecting to the home page...`;
                msg.className = 'form-message success';
                localStorage.setItem('nh_session', JSON.stringify({ email: user.email, name: user.name, role: user.role || 'user' }));
                setTimeout(() => { window.location.href = 'index.html'; }, 900);
            } catch (err) {
                const text = err.message || 'Login failed';
                msg.textContent = text;
                msg.className = 'form-message error';
                // if login failed due to unverified email, show inline resend control
                if (text.toLowerCase().includes('not verified')) {
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
                    localStorage.setItem('nh_session', JSON.stringify({ email: res.email, name: res.name, role: res.role || 'user' }));
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

// Admin: approve a pending cancellation and issue 50% refund
async function approveCancellation(bookingId) {
    if (!confirm('Approve cancellation and issue 50% refund for booking ' + bookingId + '?')) return;
        try {
            const base = await getPaymentsServer();
            console.log('approveCancellation base:', base || '(relative)');
            const resp = await fetch((base ? base : '') + `/api/bookings/${encodeURIComponent(bookingId)}/approve-cancellation`, { method: 'POST' });
            const data = await resp.json().catch(() => null);
            if (!resp.ok) throw new Error(data?.error || 'Approve failed');

            // Update local cache
            const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
            const idx = allBookings.findIndex(b => String(b.id) === String(bookingId));
            if (idx >= 0) allBookings[idx] = data.booking;
            localStorage.setItem('nh_bookings', JSON.stringify(allBookings));
            renderBookings();
            await setupAdminPage();
            alert('Cancellation approved and refund processed.');
        } catch (err) {
            console.error('approveCancellation error', err);
            alert('Unable to approve cancellation: ' + (err.message || err));
        }
}

// Admin: deny a pending cancellation request
function denyCancellation(bookingId) {
    if (!confirm('Deny cancellation request for booking ' + bookingId + '?')) return;
    (async () => {
        try {
            const base = await getPaymentsServer();
            console.log('denyCancellation base:', base || '(relative)');
            const resp = await fetch((base ? base : '') + `/api/bookings/${encodeURIComponent(bookingId)}/deny-cancellation`, { method: 'POST' });
            const data = await resp.json().catch(() => null);
            if (!resp.ok) throw new Error(data?.error || 'Deny failed');

            const allBookings = JSON.parse(localStorage.getItem('nh_bookings') || '[]');
            const idx = allBookings.findIndex(b => String(b.id) === String(bookingId));
            if (idx >= 0) allBookings[idx] = data.booking;
            localStorage.setItem('nh_bookings', JSON.stringify(allBookings));
            renderBookings();
            setupAdminPage();
            alert('Cancellation request denied.');
        } catch (err) {
            console.error('denyCancellation error', err);
            alert('Unable to deny cancellation: ' + (err.message || err));
        }
    })();
}

// Update property monthly rate (admin)
async function updatePropertyRate(propertyId) {
    const input = document.getElementById(`prop-rate-${propertyId}`);
    const statusEl = document.getElementById(`prop-status-${propertyId}`);
    const saveBtn = document.querySelector(`button[onclick="updatePropertyRate('${propertyId}')"]`);
    if (!input) return showPerPropertyStatus(propertyId, 'Rate input not found', 'error');
    const value = Number(input.value);
    if (isNaN(value) || value <= 0) return showPerPropertyStatus(propertyId, 'Enter a valid monthly rate', 'error');

    try {
        if (saveBtn) saveBtn.disabled = true;
        showPerPropertyStatus(propertyId, 'Saving...', 'info');
        const base = await getPaymentsServer();
        const resp = await fetch((base ? base : '') + `/api/properties/${encodeURIComponent(propertyId)}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rate_per_month: value })
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || 'Update failed');
        showPerPropertyStatus(propertyId, 'Saved', 'success');
        // refresh admin page content to reflect new values
        await setupAdminPage();
    } catch (err) {
        console.error('updatePropertyRate error', err);
        showPerPropertyStatus(propertyId, 'Unable to update: ' + (err.message || err), 'error');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

function showAdminPropertyMessage(text, type) {
    const el = document.getElementById('property-message');
    if (!el) return alert(text);
    el.style.display = 'block';
    el.textContent = text;
    el.className = `form-message ${type || ''}`;
    if (type === 'success') setTimeout(() => { el.style.display = 'none'; }, 2500);
}

function showPerPropertyStatus(propertyId, text, type) {
    const el = document.getElementById(`prop-status-${propertyId}`);
    if (!el) return showAdminPropertyMessage(text, type);
    el.textContent = text;
    el.className = `prop-status ${type || 'info'}`;
    if (type === 'success') setTimeout(() => { el.textContent = ''; el.className = 'prop-status'; }, 2200);
}

// ============================================
// PAYMENT FORM (demo client-side)
// ============================================
function setupPaymentForm() {
    const form = document.getElementById('payment-form');
    const msg = document.getElementById('payment-message');
    if (!form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const amountInput = document.getElementById('pay-amount');
    const amountParam = urlParams.get('amount');
    const extensionId = urlParams.get('extension_id');
    const pendingExtension = extensionId ? getPendingExtension() : null;
    const pendingBooking = extensionId ? null : JSON.parse(localStorage.getItem('nh_pending_booking') || 'null');

    console.log('[Payments] setupPaymentForm params:', { amountParam, extensionId, pendingExtension, pendingBooking });

    if (amountInput) {
        if (amountParam && !Number.isNaN(Number(amountParam))) {
            amountInput.value = Number(amountParam);
            amountInput.readOnly = true;
            amountInput.dataset.currency = 'USD';
        } else if (pendingBooking && pendingBooking.amount) {
            amountInput.value = Number(pendingBooking.amount);
            amountInput.readOnly = true;
            amountInput.dataset.currency = 'USD';
            const paymentDetails = document.getElementById('payment-details');
            if (paymentDetails) {
                paymentDetails.textContent = `Pending reservation for ${pendingBooking.property}. Pay now to confirm.`;
            }
        }
    }

    const amountLabel = document.getElementById('pay-amount-label');
    if (amountLabel && extensionId) {
        amountLabel.textContent = 'Amount (USD) - Extension fee';
    }

    if (pendingExtension) {
        const paymentDetails = document.getElementById('payment-details');
        if (paymentDetails) {
            paymentDetails.textContent = `Extension payment for booking ${pendingExtension.bookingId}.`;
        }
    } else if (pendingBooking) {
        const paymentDetails = document.getElementById('payment-details');
        if (paymentDetails) {
            paymentDetails.textContent = `Reservation payment pending for ${pendingBooking.property}. Complete checkout to confirm.`;
        }
    }

    function show(type, text) {
        msg.textContent = text;
        msg.className = `form-message ${type}`;
    }

    const methodSelect = document.getElementById('pay-method');
    const mpesaField = document.getElementById('mpesa-field');
    const cardFields = document.getElementById('card-fields');
    const amountField = document.getElementById('amount-field');
    const mpesaInput = document.getElementById('pay-mpesa-phone');
    const paymentDetails = document.getElementById('payment-details');
    const cardInputs = cardFields ? cardFields.querySelectorAll('input') : [];
    const panel = document.querySelector('.payment-history-panel');
    const toggleBtn = document.getElementById('toggle-payments-visibility');
    const historyNote = document.getElementById('payments-history-note');
    const searchInput = document.getElementById('payments-search');
    const visibilityKey = 'nh_payments_visible';
    const session = getSession();
    const MPESA_EXCHANGE_RATE = 150; // 1 USD = 150 KES

    function isHistoryVisible() {
        return localStorage.getItem(visibilityKey) !== 'false';
    }

    function convertUsdToKes(value) {
        return Math.round(Number(value) * MPESA_EXCHANGE_RATE);
    }

    function convertKesToUsd(value) {
        return Number((Number(value) / MPESA_EXCHANGE_RATE).toFixed(2));
    }

    function updateHistoryPanelVisibility() {
        const loggedIn = Boolean(session);
        const visible = loggedIn && isHistoryVisible();

        if (panel) {
            panel.style.display = visible ? 'block' : 'none';
        }

        if (toggleBtn) {
            toggleBtn.style.display = loggedIn ? 'inline-flex' : 'none';
            toggleBtn.textContent = visible ? 'Hide History' : 'Show History';
        }

        if (historyNote) {
            if (!loggedIn) {
                historyNote.style.display = 'block';
                historyNote.textContent = 'Please sign in to view your payment history.';
            } else {
                historyNote.style.display = 'none';
                historyNote.textContent = '';
            }
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const newValue = !isHistoryVisible();
            localStorage.setItem(visibilityKey, String(newValue));
            updateHistoryPanelVisibility();
            if (newValue) renderPaymentHistory();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderPaymentHistory();
        });
    }

    updateHistoryPanelVisibility();

    function ownerPaymentRecord(record) {
        return {
            ...record,
            userEmail: session?.email || null
        };
    }

    function showDetails(text) {
        if (paymentDetails) paymentDetails.textContent = text || '';
    }

    function updatePaymentMethodFields() {
        const method = methodSelect?.value || 'card';
        if (mpesaField) mpesaField.style.display = method === 'mpesa' ? 'block' : 'none';
        if (cardFields) cardFields.style.display = method === 'mpesa' ? 'none' : 'block';
        cardInputs.forEach(input => { input.disabled = method === 'mpesa'; });
        if (mpesaInput) mpesaInput.disabled = method !== 'mpesa';
        if (amountField) amountField.style.display = 'block';

        if (amountInput) {
            const currentCurrency = amountInput.dataset.currency || 'USD';
            const currentValue = Number(amountInput.value) || 0;
            if (method === 'mpesa' && currentCurrency === 'USD' && currentValue > 0) {
                amountInput.dataset.usdValue = String(currentValue);
                amountInput.value = convertUsdToKes(currentValue);
                amountInput.dataset.currency = 'KES';
            }
            if (method !== 'mpesa' && currentCurrency === 'KES' && currentValue > 0) {
                if (amountInput.dataset.usdValue) {
                    amountInput.value = amountInput.dataset.usdValue;
                } else {
                    amountInput.value = convertKesToUsd(currentValue);
                }
                amountInput.dataset.currency = 'USD';
            }
        }

        const amountLabel = document.getElementById('pay-amount-label');
        if (amountLabel) {
            amountLabel.textContent = method === 'mpesa' ? 'Amount (KES)' : 'Amount (USD)';
        }
    }

    if (methodSelect) {
        methodSelect.addEventListener('change', updatePaymentMethodFields);
    }
    updatePaymentMethodFields();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const method = methodSelect?.value || 'card';
        const amount = Number(document.getElementById('pay-amount').value);

        if (!amount || amount <= 0) {
            show('error', 'Please enter a valid amount.');
            return;
        }

        if (method === 'mpesa') {
            const phone = mpesaInput?.value.trim();
            if (!phone || !/^\+?\d{8,15}$/.test(phone)) {
                show('error', 'Enter a valid M-Pesa phone number.');
                return;
            }

            show('success', 'Processing M-Pesa payment...');
            showDetails('');
            try {
                const base = await getPaymentsServer();
                const payload = { amount, currency: 'KES', phone };
                console.log('M-Pesa submit payload:', payload);
                console.log('[Payments] M-Pesa request URL:', (base ? base : '') + '/create-mpesa-payment');
                const resp = await fetch((base ? base : '') + '/create-mpesa-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await resp.json().catch(() => null);
                if (!resp.ok) {
                    const msg = data?.error || data?.message || `${resp.status} ${resp.statusText}`;
                    throw new Error(`HTTP ${resp.status}: ${msg}`);
                }
                if (data?.error) throw new Error(data.error);

                const record = {
                    id: data.transaction.id,
                    provider: 'M-Pesa',
                    last4: phone.slice(-4),
                    amount,
                    currency: 'KES',
                    date: new Date().toISOString(),
                    status: 'COMPLETED',
                    description: `M-Pesa payment from ${phone}`
                };
                const saved = addPaymentRecord(record);
                show('success', `M-Pesa STK push sent to ${phone}. ${data.transaction.note || ''}`);
                showDetails(`Request ID: ${data.transaction.id} • Phone: ${phone}`);
                form.reset();
                updatePaymentMethodFields();
                renderPaymentHistory();
                finalizeBookingAfterPayment(saved);
            } catch (err) {
                console.error('M-Pesa payment error:', err);
                const message = err?.message || 'Unknown error';
                show('error', `M-Pesa payment failed: ${message}`);
                showDetails(`Error: ${message}`);
            }
            return;
        }

        const name = document.getElementById('pay-name').value.trim();
        const number = document.getElementById('pay-number').value.replace(/\s+/g, '');
        const exp = document.getElementById('pay-exp').value.trim();
        const cvv = document.getElementById('pay-cvv').value.trim();

        if (!name || !number || !exp || !cvv) {
            show('error', 'Please complete all payment fields.');
            return;
        }
        if (!/^\d{12,19}$/.test(number)) { show('error', 'Enter a valid card number.'); return; }
        if (!/^\d{2}\/\d{2}$/.test(exp)) { show('error', 'Expiry use MM/YY.'); return; }
        if (!/^\d{3,4}$/.test(cvv)) { show('error', 'Enter a valid CVV.'); return; }

        show('success', 'Processing payment...');
            setTimeout(() => {
            const record = { id: Date.now(), provider: 'Card', last4: number.slice(-4), amount, currency: 'USD', date: new Date().toISOString(), description: 'Card payment' };
            const saved = addPaymentRecord(record);
            show('success', `Payment of $${amount.toFixed(2)} successful. Receipt saved.`);
            form.reset();
            updatePaymentMethodFields();
            renderPaymentHistory();
            finalizeBookingAfterPayment(saved);
        }, 900);
    });
}

function renderPaymentHistory() {
    const container = document.getElementById('payments-history');
    if (!container) return;
    const session = getSession();
    if (!session) {
        container.innerHTML = '<p style="color:#bbb">Sign in to see your own payment history.</p>';
        return;
    }

    const payments = JSON.parse(localStorage.getItem('nh_payments') || '[]').filter(p => p.userEmail === session.email);
    const searchTerm = (document.getElementById('payments-search')?.value || '').trim().toLowerCase();
    const filteredPayments = searchTerm ? payments.filter(p => {
        const id = String(p.id || '').toLowerCase();
        const date = new Date(p.date || '').toLocaleString().toLowerCase();
        const rawDate = String(p.date || '').toLowerCase();
        return id.includes(searchTerm) || date.includes(searchTerm) || rawDate.includes(searchTerm);
    }) : payments;

    if (!filteredPayments.length) {
        container.innerHTML = `<p style="color:#bbb">${payments.length ? `No matching payments found for "${searchTerm}".` : `No payments found for ${session.email}.`}</p>`;
        return;
    }

    const rows = filteredPayments.slice().reverse().map(p => {
        const date = new Date(p.date);
        const currency = p.currency || 'USD';
        return `
            <div class="payment-item" style="padding:10px;border-radius:6px;background:#121212;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
                <div>
                    <div style="font-weight:600;color:#fff">${formatCurrency(p.amount, currency)} <small style="color:#999">• ${p.provider || 'Card'} • **** ${p.last4}</small></div>
                    <div style="color:#999;font-size:0.9rem">${date.toLocaleString()}</div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = rows;
}

// ============================================
// STRIPE + PAYPAL INTEGRATION (client-side)
// Requires server endpoints at /create-checkout-session and /create-paypal-order
// ============================================
function setupStripeAndPayPal() {
    // Stripe
    const stripeBtn = document.getElementById('stripe-checkout');
    if (stripeBtn) {
        stripeBtn.addEventListener('click', async () => {
            const amount = Number(document.getElementById('pay-amount').value) || 0;
            if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
            try {
                const base = await getPaymentsServer();
                const resp = await fetch((base ? base : '') + '/create-checkout-session', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount })
                });
                const data = await resp.json();
                if (data.error) throw new Error(data.error);
                const stripe = Stripe(window.STRIPE_PUBLISHABLE_KEY || (window.__STRIPE_PUBKEY__));
                await stripe.redirectToCheckout({ sessionId: data.id });
            } catch (err) {
                console.error(err);
                alert('Stripe checkout failed. See console for details.');
            }
        });
    }

    // PayPal
    if (window.paypal) {
        paypal.Buttons({
            createOrder: async function() {
                const amount = Number(document.getElementById('pay-amount').value) || 0;
                if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
                const base = await getPaymentsServer();
                const res = await fetch((base ? base : '') + '/create-paypal-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, currency: 'USD' }) });
                const d = await res.json();
                if (d.error) throw new Error(d.error);
                return d.id;
            },
            onApprove: async function(data, actions) {
                try {
                    const capture = await actions.order.capture();
                    const details = capture.purchase_units?.[0]?.payments?.captures?.[0];
                    const amount = details?.amount?.value ? Number(details.amount.value) : Number(document.getElementById('pay-amount').value);
                    const payerName = capture.payer?.name?.given_name || 'PayPal user';
                    const record = {
                        id: data.orderID,
                        provider: 'PayPal',
                        amount,
                        currency: 'USD',
                        last4: 'PayPal',
                        date: new Date().toISOString(),
                        status: details?.status || 'COMPLETED',
                        description: `PayPal payment by ${payerName}`
                    };
                    const saved = addPaymentRecord(record);
                    alert(`PayPal payment completed: ${formatCurrency(amount, 'USD')}`);
                    renderPaymentHistory();
                    finalizeBookingAfterPayment(saved);
                } catch (err) {
                    console.error(err);
                    alert('PayPal capture failed.');
                }
            },
            onCancel: function() {
                alert('PayPal payment was canceled.');
            },
            onError: function(err) { console.error(err); alert('PayPal error'); }
        }).render('#paypal-button-container');
    }

    const mpesaBtn = document.getElementById('mpesa-checkout');
    if (mpesaBtn) {
        mpesaBtn.addEventListener('click', async () => {
            const methodSelect = document.getElementById('pay-method');
            const mpesaPhone = document.getElementById('pay-mpesa-phone');
            if (methodSelect) {
                methodSelect.value = 'mpesa';
                methodSelect.dispatchEvent(new Event('change'));
            }
            if (mpesaPhone) {
                mpesaPhone.focus();
            }

            const amount = Number(document.getElementById('pay-amount').value) || 0;
            const phone = mpesaPhone?.value.trim();
            if (!amount || amount <= 0) { alert('Enter a valid amount'); return; }
            if (!phone || !/^\+?\d{8,15}$/.test(phone)) { alert('Enter a valid M-Pesa phone number.'); return; }

            try {
                const base = await getPaymentsServer();
                const payload = { amount, currency: 'KES', phone };
                console.log('M-Pesa button payload:', payload);
                console.log('[Payments] M-Pesa button request URL:', (base ? base : '') + '/create-mpesa-payment');
                const resp = await fetch((base ? base : '') + '/create-mpesa-payment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await resp.json().catch(() => null);
                if (!resp.ok) {
                    const msg = data?.error || data?.message || `${resp.status} ${resp.statusText}`;
                    throw new Error(`HTTP ${resp.status}: ${msg}`);
                }
                if (data?.error) throw new Error(data.error);

                const record = {
                    id: data.transaction.id,
                    provider: 'M-Pesa',
                    amount,
                    currency: 'KES',
                    last4: phone.slice(-4),
                    date: new Date().toISOString(),
                    status: 'COMPLETED',
                    description: `M-Pesa payment from ${phone}`
                };
                const saved = addPaymentRecord(record);
                alert(`M-Pesa STK push sent to ${phone}. ${data.transaction.note || ''}`);
                if (paymentDetails) paymentDetails.textContent = `Request ID: ${data.transaction.id} • Phone: ${phone}`;
                renderPaymentHistory();
                finalizeBookingAfterPayment(saved);
            } catch (err) {
                console.error('M-Pesa button error:', err);
                const message = err?.message || 'Unknown error';
                alert(`M-Pesa payment failed: ${message}`);
                if (paymentDetails) paymentDetails.textContent = `Error: ${message}`;
            }
        });
    }
}


// ============================================
// ROOM SERVICE MANAGEMENT
// ============================================

let currentBookingForRoomService = null;

async function openRoomServiceModal(bookingId) {
    currentBookingForRoomService = bookingId;
    const modal = document.getElementById('room-service-modal');
    if (!modal) return;

    // Load room service categories
    try {
        const base = await getPaymentsServer();
        const url = (base ? base : '') + '/api/room-service-categories';
        const response = await fetch(url);
        const categories = await response.json();

        const container = document.getElementById('room-service-categories-container');
        if (container) {
            container.innerHTML = categories.map(cat => `
                <div class="room-service-category">
                    <h3>${cat.name}</h3>
                    <div class="room-service-items">
                        ${cat.items.map(item => `
                            <div class="room-service-item">
                                <div class="room-service-item-info">
                                    <div class="room-service-item-name">${item.name}</div>
                                    <div class="room-service-item-price">${item.price > 0 ? '$' + item.price : 'Free'}</div>
                                </div>
                                <button type="button" class="room-service-item-btn" onclick="requestRoomService('${cat.id}', '${item.id}', '${item.name}', ${item.price})">Request</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }

        // Load room service history
        await loadRoomServiceHistory(bookingId);
    } catch (err) {
        console.error('Error loading room service categories:', err);
        alert('Failed to load room service options');
    }

    modal.style.display = 'block';
}

function closeRoomServiceModal() {
    const modal = document.getElementById('room-service-modal');
    if (modal) modal.style.display = 'none';
    currentBookingForRoomService = null;
}

async function requestRoomService(categoryId, serviceId, serviceName, price) {
    const session = getSession();
    if (!session) {
        alert('Please log in to request room service');
        return;
    }

    if (!currentBookingForRoomService) {
        alert('No booking selected');
        return;
    }

    try {
        const base = await getPaymentsServer();
        const url = (base ? base : '') + '/api/room-service/request';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: currentBookingForRoomService,
                userEmail: session.email,
                category: categoryId,
                service: serviceId,
                quantity: 1,
                specialRequests: ''
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Failed to request room service');
            return;
        }

        alert(`Room service requested: ${serviceName}${price > 0 ? ' (Cost: $' + price + ')' : ''}`);
        
        // Reload room service history
        await loadRoomServiceHistory(currentBookingForRoomService);
    } catch (err) {
        console.error('Error requesting room service:', err);
        alert('Failed to request room service');
    }
}

async function loadRoomServiceHistory(bookingId) {
    const session = getSession();
    if (!session) return;

    try {
        const base = await getPaymentsServer();
        const url = (base ? base : '') + `/api/room-service/booking/${bookingId}?userEmail=${encodeURIComponent(session.email)}`;
        
        const response = await fetch(url);
        const services = await response.json();

        const historyContainer = document.getElementById('room-service-list');
        if (historyContainer) {
            if (services.length === 0) {
                historyContainer.innerHTML = '<p style="color:#999;font-size:0.9rem">No room service requests yet</p>';
            } else {
                historyContainer.innerHTML = services.map(service => {
                    const requestedDate = new Date(service.requestedAt);
                    const statusColor = service.status === 'completed' ? '#4CAF50' : 
                                      service.status === 'cancelled' ? '#ff6b6b' : '#ff9800';
                    
                    return `
                        <div class="room-service-request ${service.status}">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <div>
                                    <strong>${service.service}</strong> - 
                                    <span style="color:${statusColor}">${service.status.toUpperCase()}</span>
                                </div>
                                <div style="text-align:right">
                                    <div>$${service.price.toFixed(2)}</div>
                                    <small style="color:#999">${requestedDate.toLocaleDateString()}</small>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Error loading room service history:', err);
    }
}

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

// Log analytics (Example)
function logEvent(eventName, eventData) {
    console.log(`Event: ${eventName}`, eventData);
    // Integration point for analytics
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
        cancelBooking,
        handleExtendStay
    };
}
