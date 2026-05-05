// Screen Management
function showScreen(screenId) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');

        // If showing prayer times screen, load the times
        if (screenId === 'prayerTimesScreen') {
            showPrayerTimes();
        }

        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

// Prayer Times Data for Sharjah (Source: Sharjah Islamic Affairs Department)
const sharjahPrayerTimes = {
    fajr: '05:15',
    sunrise: '06:42',
    dhuhr: '12:28',
    asr: '15:48',
    maghrib: '18:14',
    isha: '19:44'
};

// Display Prayer Times for Sharjah
function showPrayerTimes() {
    const container = document.getElementById('prayerTimesDisplay');
    const cityTitle = document.getElementById('selectedCity');
    const dateElement = document.getElementById('prayerDate');

    // Get current date in Arabic
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const arabicDate = now.toLocaleDateString('ar-AE', options);

    // Update display
    cityTitle.textContent = 'مواقيت الصلاة - الشارقة';
    dateElement.textContent = arabicDate;

    // Set prayer times
    document.getElementById('fajr').textContent = sharjahPrayerTimes.fajr;
    document.getElementById('sunrise').textContent = sharjahPrayerTimes.sunrise;
    document.getElementById('dhuhr').textContent = sharjahPrayerTimes.dhuhr;
    document.getElementById('asr').textContent = sharjahPrayerTimes.asr;
    document.getElementById('maghrib').textContent = sharjahPrayerTimes.maghrib;
    document.getElementById('isha').textContent = sharjahPrayerTimes.isha;

    // Highlight current prayer time
    highlightCurrentPrayer(sharjahPrayerTimes);
}

// Highlight Current Prayer Time
function highlightCurrentPrayer(times) {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayerCards = document.querySelectorAll('.prayer-time-card');
    prayerCards.forEach(card => card.classList.remove('highlight'));

    const timesToCheck = [
        { name: 'fajr', time: times.fajr, element: prayerCards[0] },
        { name: 'sunrise', time: times.sunrise, element: prayerCards[1] },
        { name: 'dhuhr', time: times.dhuhr, element: prayerCards[2] },
        { name: 'asr', time: times.asr, element: prayerCards[3] },
        { name: 'maghrib', time: times.maghrib, element: prayerCards[4] },
        { name: 'isha', time: times.isha, element: prayerCards[5] }
    ];

    for (let i = 0; i < timesToCheck.length; i++) {
        const [hours, minutes] = timesToCheck[i].time.split(':').map(Number);
        const prayerTime = hours * 60 + minutes;

        const nextIndex = i + 1;
        if (nextIndex < timesToCheck.length) {
            const [nextHours, nextMinutes] = timesToCheck[nextIndex].time.split(':').map(Number);
            const nextPrayerTime = nextHours * 60 + nextMinutes;

            if (currentTime >= prayerTime && currentTime < nextPrayerTime) {
                timesToCheck[nextIndex].element.classList.add('highlight');
                break;
            }
        } else if (currentTime >= prayerTime || currentTime < timesToCheck[0].time.split(':').map(Number)[0] * 60 + timesToCheck[0].time.split(':').map(Number)[1]) {
            timesToCheck[0].element.classList.add('highlight');
        }
    }
}

// Form Handlers
function handleCemeteryForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        phone: formData.get('phone'),
        date: formData.get('date'),
        location: formData.get('location')
    };

    console.log('Cemetery Visit Request:', data);

    // Show success message
    showSuccess();

    // Reset form
    e.target.reset();
}

function handleMosqueExpansionForm(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const data = {
        mosqueName: formData.get('mosque_name'),
        location: formData.get('location'),
        details: formData.get('details'),
        contactPhone: formData.get('contact_phone')
    };

    console.log('Mosque Expansion Request:', data);

    // Show success message
    showSuccess();

    // Reset form
    e.target.reset();
}

// Success Modal
function showSuccess() {
    const modal = document.getElementById('successMessage');
    modal.classList.remove('hidden');
}

function hideSuccess() {
    const modal = document.getElementById('successMessage');
    modal.classList.add('hidden');

    // Return to welcome screen
    showScreen('welcomeScreen');
}

// Set minimum date for cemetery visit (today)
function setMinDate() {
    const dateInput = document.getElementById('cemetery_date');
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const minDate = `${year}-${month}-${day}`;
        dateInput.setAttribute('min', minDate);
    }
}

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', function () {
    // Set minimum date for cemetery visit
    setMinDate();

    // Cemetery Form
    const cemeteryForm = document.getElementById('cemeteryForm');
    if (cemeteryForm) {
        cemeteryForm.addEventListener('submit', handleCemeteryForm);
    }

    // Mosque Expansion Form
    const mosqueForm = document.getElementById('mosqueExpansionForm');
    if (mosqueForm) {
        mosqueForm.addEventListener('submit', handleMosqueExpansionForm);
    }

    // Phone number validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function (e) {
            // Allow only numbers
            this.value = this.value.replace(/[^0-9]/g, '');

            // Limit to 10 digits
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }
        });
    });

    // Close success modal on outside click
    const successModal = document.getElementById('successMessage');
    if (successModal) {
        successModal.addEventListener('click', function (e) {
            if (e.target === this) {
                hideSuccess();
            }
        });
    }

    // Add smooth scrolling for all internal navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function (e) {
        // ESC key closes success modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('successMessage');
            if (modal && !modal.classList.contains('hidden')) {
                hideSuccess();
            }
        }
    });
});

// Form Validation Enhancement
function validatePhoneNumber(phone) {
    const phoneRegex = /^(05|06|07)[0-9]{8}$/;
    return phoneRegex.test(phone);
}

// Add real-time validation feedback
document.addEventListener('DOMContentLoaded', function () {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', function () {
                if (this.value.trim() === '') {
                    this.style.borderColor = '#e53e3e';
                } else if (this.type === 'tel' && !validatePhoneNumber(this.value)) {
                    this.style.borderColor = '#e53e3e';
                } else {
                    this.style.borderColor = '#0a5c44';
                }
            });

            input.addEventListener('focus', function () {
                this.style.borderColor = '#0a5c44';
            });
        });
    });
});

// Update prayer times every minute (for highlighting current prayer)
setInterval(() => {
    const prayerTimesContainer = document.getElementById('prayerTimesDisplay');
    if (prayerTimesContainer && !prayerTimesContainer.classList.contains('hidden')) {
        highlightCurrentPrayer(sharjahPrayerTimes);
    }
}, 60000); // Update every minute
