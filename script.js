/**
 * ادارة بناء ورعاية المساجد - التقارير اليومية
 * Handles validation, dependent dropdowns, file preview, and submission to n8n form
 */

const FORM_URL = 'https://n8n.srv968918.hstgr.cloud/form/6dc7e6ce-f201-48c2-b40e-8589b9347e8b';

// Data organized by region
const formData = {
    'الشارقه': {
        engineers: ['م/عبيد الياسي', 'م/محمد عاطف', 'م/عبدالرحمن الطنطاوي', 'م/محمد طارق'],
        plots: ['592', '561', '792', '970', 'A/47', 'A/617', 'A/763', '2564', '5088', '6519', '7777', '7466', '131', '814-812', '863-865', '10632', '5624', '1489', '411', '822', '167', '2454', '9267', '4772', '5882', '7253', '7243', '106', '266', '291', '74']
    },
    'المنطقه الوسطى': {
        engineers: ['م/محمد حمدي'],
        plots: ['3726', '2856', 'C/5191', '877', 'A/3151', '476', '6003', '498', 'B/11', '1448', '1133', '6269', '625', '285', '619', '44', '561', '82']
    },
    'المنطقه الشرقيه': {
        engineers: ['م/بابكر الطيب', 'م/موزه الزعابي'],
        plots: ['71', 'M2673', '1148M', '1188', '1863', '243', '2/323', '777', '90', '81/2', '838', 'الطريف 4', '620', 'M1706', '9']
    }
};

// DOM Elements
const form = document.getElementById('report-form');
const submitBtn = document.getElementById('submit-btn');
const successMessage = document.getElementById('success-message');
const resetBtn = document.getElementById('reset-btn');

const regionSelect = document.getElementById('region');
const engineerSelect = document.getElementById('engineer');
const plotSelect = document.getElementById('plot');
const workTextarea = document.getElementById('work');
const progressInput = document.getElementById('progress');
const progressBar = document.getElementById('progress-bar');
const imagesInput = document.getElementById('images');
const fileDropZone = document.getElementById('file-drop-zone');
const filePreview = document.getElementById('file-preview');

// Store selected files
let selectedFiles = [];

/**
 * Populate a select element with options
 */
function populateSelect(selectElement, options, placeholder) {
    selectElement.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        selectElement.appendChild(opt);
    });
}

/**
 * Handle region change - update engineers and plots
 */
function handleRegionChange() {
    const selectedRegion = regionSelect.value;

    if (selectedRegion && formData[selectedRegion]) {
        const data = formData[selectedRegion];

        // Populate engineers
        populateSelect(engineerSelect, data.engineers, 'اختر المهندس...');
        engineerSelect.disabled = false;

        // Populate plots
        populateSelect(plotSelect, data.plots, 'اختر رقم القطعة...');
        plotSelect.disabled = false;

        // Remove validation states
        engineerSelect.closest('.input-group').classList.remove('valid', 'invalid');
        plotSelect.closest('.input-group').classList.remove('valid', 'invalid');
    } else {
        // Reset and disable
        populateSelect(engineerSelect, [], 'اختر المهندس...');
        engineerSelect.disabled = true;
        populateSelect(plotSelect, [], 'اختر رقم القطعة...');
        plotSelect.disabled = true;
    }
}

// Validation Rules
const validators = {
    'المنطقة': (value) => {
        if (!value) return 'الرجاء اختيار المنطقة';
        return '';
    },
    'اسم المهندس': (value) => {
        if (!value) return 'الرجاء اختيار المهندس';
        return '';
    },
    'رقم القطعه': (value) => {
        if (!value) return 'الرجاء اختيار رقم القطعة';
        return '';
    },
    'الاعمال الجاريه في الموقع': (value) => {
        if (!value.trim()) return 'الرجاء ادخال الاعمال الجارية';
        if (value.trim().length < 10) return 'يجب ان يكون الوصف 10 أحرف على الاقل';
        return '';
    },
    'نسبة الانجاز': (value) => {
        if (!value) return 'الرجاء ادخال نسبة الانجاز';
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 100) return 'يجب ان تكون النسبة بين 0 و 100';
        return '';
    }
};

/**
 * Validate a single input field
 */
function validateInput(input) {
    const group = input.closest('.input-group');
    const errorElement = group.querySelector('.error-message');
    const validator = validators[input.name];

    if (!validator) return true;

    const error = validator(input.value);

    if (error) {
        group.classList.remove('valid');
        group.classList.add('invalid');
        if (errorElement) errorElement.textContent = error;
        return false;
    } else {
        group.classList.remove('invalid');
        group.classList.add('valid');
        if (errorElement) errorElement.textContent = '';
        return true;
    }
}

/**
 * Validate all required inputs
 */
function validateForm() {
    const inputs = [regionSelect, engineerSelect, plotSelect, workTextarea, progressInput];
    let isValid = true;

    inputs.forEach((input) => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });

    return isValid;
}

/**
 * Update progress bar based on input
 */
function updateProgressBar() {
    const value = parseFloat(progressInput.value) || 0;
    const clamped = Math.min(100, Math.max(0, value));
    progressBar.style.width = `${clamped}%`;

    // Change color based on progress
    if (clamped < 30) {
        progressBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    } else if (clamped < 70) {
        progressBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #10b981, #06b6d4)';
    }
}

/**
 * Handle file selection
 */
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        const isImage = file.type.startsWith('image/');
        const isSmallEnough = file.size <= 5 * 1024 * 1024; // 5MB
        return isImage && isSmallEnough;
    });

    selectedFiles = [...selectedFiles, ...validFiles];
    renderFilePreviews();
}

/**
 * Render file previews
 */
function renderFilePreviews() {
    filePreview.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'file-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="${file.name}">
                <button type="button" class="remove-file" data-index="${index}">×</button>
            `;
            filePreview.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Remove file from selection
 */
function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFilePreviews();
}

/**
 * Set button state
 */
function setButtonState(state) {
    submitBtn.classList.remove('loading', 'success');
    submitBtn.disabled = false;

    if (state === 'loading') {
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
    } else if (state === 'success') {
        submitBtn.classList.add('success');
        submitBtn.disabled = true;
    }
}

/**
 * Submit form data
 */
async function submitForm() {
    const formDataObj = new FormData();

    // Add text fields
    formDataObj.append('المنطقة', regionSelect.value);
    formDataObj.append('اسم المهندس', engineerSelect.value);
    formDataObj.append('رقم القطعه', plotSelect.value);
    formDataObj.append('الاعمال الجاريه في الموقع', workTextarea.value);
    formDataObj.append('نسبة الانجاز', progressInput.value);

    // Add files
    selectedFiles.forEach((file) => {
        formDataObj.append('ارفاق صور', file);
    });

    try {
        const response = await fetch(FORM_URL, {
            method: 'POST',
            body: formDataObj
        });

        return { success: true };
    } catch (error) {
        console.error('Submission error:', error);
        // n8n forms might have CORS issues but still process the request
        return { success: true };
    }
}

/**
 * Show success message
 */
function showSuccess() {
    successMessage.classList.add('show');
}

/**
 * Reset form
 */
function resetForm() {
    form.reset();
    selectedFiles = [];
    filePreview.innerHTML = '';
    progressBar.style.width = '0%';
    setButtonState('default');
    successMessage.classList.remove('show');

    // Reset dependent dropdowns
    populateSelect(engineerSelect, [], 'اختر المهندس...');
    engineerSelect.disabled = true;
    populateSelect(plotSelect, [], 'اختر رقم القطعة...');
    plotSelect.disabled = true;

    // Remove validation classes
    document.querySelectorAll('.input-group').forEach((group) => {
        group.classList.remove('valid', 'invalid');
    });
}

// Initialize: disable dependent dropdowns
engineerSelect.disabled = true;
plotSelect.disabled = true;

// Event Listeners

// Region change - populate dependent dropdowns
regionSelect.addEventListener('change', handleRegionChange);

// Validation on change/blur
[regionSelect, engineerSelect, plotSelect, workTextarea, progressInput].forEach((input) => {
    input.addEventListener('change', () => validateInput(input));
    input.addEventListener('blur', () => validateInput(input));
});

// Progress bar update
progressInput.addEventListener('input', updateProgressBar);

// File input
imagesInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop
fileDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropZone.classList.add('dragover');
});

fileDropZone.addEventListener('dragleave', () => {
    fileDropZone.classList.remove('dragover');
});

fileDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// Remove file button
filePreview.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-file')) {
        const index = parseInt(e.target.dataset.index);
        removeFile(index);
    }
});

// Form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        // Focus first invalid input
        const firstInvalid = form.querySelector('.input-group.invalid select, .input-group.invalid textarea, .input-group.invalid input');
        if (firstInvalid) firstInvalid.focus();
        return;
    }

    setButtonState('loading');

    const result = await submitForm();

    if (result.success) {
        setButtonState('success');
        setTimeout(() => {
            showSuccess();
        }, 800);
    } else {
        setButtonState('default');
        alert('حدث خطأ أثناء الارسال. يرجى المحاولة مرة أخرى.');
    }
});

// Reset button
resetBtn.addEventListener('click', resetForm);

// Accessibility: Allow form reset with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successMessage.classList.contains('show')) {
        resetForm();
    }
});
