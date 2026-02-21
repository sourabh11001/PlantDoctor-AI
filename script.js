document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('uploadArea');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeImgBtn = document.getElementById('removeImgBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // Status & Results
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    const errorContainer = document.getElementById('errorContainer');

    // Data Fields
    const plantName = document.getElementById('plantName');
    const diagnosisStatus = document.getElementById('diagnosisStatus');
    const confidenceLevel = document.getElementById('confidenceLevel');
    const problemName = document.getElementById('problemName');
    const problemCause = document.getElementById('problemCause');
    const symptomsList = document.getElementById('symptomsList');

    const naturalList = document.getElementById('naturalList');
    const chemicalList = document.getElementById('chemicalList');
    const preventionList = document.getElementById('preventionList');

    // --- Event Listeners ---

    // Trigger file input when clicking upload area
    uploadArea.addEventListener('click', () => imageInput.click());

    // Handle File Selection
    imageInput.addEventListener('change', handleFileSelect);

    // Remove Image
    removeImgBtn.addEventListener('click', () => {
        imageInput.value = '';
        togglePreview(false);
        resultsContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');
        analyzeBtn.disabled = true;
    });

    // Analyze Button
    analyzeBtn.addEventListener('click', performAnalysis);

    // --- Functions ---

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                togglePreview(true);
                analyzeBtn.disabled = false;
                analyzeBtn.classList.add('pulse');

                // Clear previous results
                resultsContainer.classList.add('hidden');
                errorContainer.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        }
    }

    function togglePreview(show) {
        if (show) {
            previewContainer.classList.remove('hidden');
            uploadArea.classList.add('hidden');
        } else {
            previewContainer.classList.add('hidden');
            uploadArea.classList.remove('hidden');
        }
    }

    async function performAnalysis() {
        const file = imageInput.files[0];
        if (!file) return;

        // UI State: Loading
        analyzeBtn.disabled = true;
        analyzeBtn.classList.remove('pulse');
        loadingIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        errorContainer.classList.add('hidden');

        // Scroll to loader
        loadingIndicator.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/analyze-plant', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Analysis failed');
            }

            const data = await response.json();
            displayResults(data);

        } catch (error) {
            console.error(error);
            showError(error.message);
        } finally {
            loadingIndicator.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    }

    function displayResults(data) {
        // 1. Diagnosis Info
        plantName.textContent = data.plant_name || "Unknown Plant";

        const isConfirmed = data.diagnosis_status === 'confirmed';
        diagnosisStatus.textContent = isConfirmed ? 'Confirmed' : 'Uncertain';
        diagnosisStatus.className = isConfirmed
            ? 'status-pill status-ok'
            : 'status-pill status-warn';

        // Confidence
        if (data.detected_problem && data.detected_problem.confidence) {
            const pct = Math.round(data.detected_problem.confidence * 100);
            confidenceLevel.textContent = `${pct}% Confident`;
            confidenceLevel.classList.remove('hidden');
        } else {
            confidenceLevel.classList.add('hidden');
        }

        // Problem Details
        if (data.detected_problem) {
            problemName.textContent = data.detected_problem.name;
        } else {
            problemName.textContent = "Healthy or Unknown Issue";
        }
        problemCause.textContent = data.cause || "No specific cause detected.";

        // 2. Lists Rendering Helper
        renderList(symptomsList, data.symptoms, 'li');
        renderList(preventionList, data.prevention_tips, 'li');

        // 3. Remedies - Complex Rendering
        renderRemedies(naturalList, data.natural_remedies, 'natural');
        renderRemedies(chemicalList, data.chemical_treatments, 'chemical');

        // Show Results
        resultsContainer.classList.remove('hidden');

        // Animation delay workaround to re-trigger if needed, 
        // but CSS keyframes run on display:block usually. 
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderList(container, items, tag) {
        container.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(item => {
                const el = document.createElement(tag);
                el.textContent = item;
                container.appendChild(el);
            });
        } else {
            container.innerHTML = `<${tag}>None listed.</${tag}>`;
        }
    }

    function renderRemedies(container, items, type) {
        container.innerHTML = '';
        if (items && items.length > 0) {
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'remedy-item'; // simplistic inner style
                div.style.marginBottom = '12px';

                if (type === 'natural') {
                    div.innerHTML = `
                        <strong>✨ ${item.title}</strong>
                        <p style="margin:4px 0; font-size:0.9rem; color:#555;">${item.ingredients.join(', ')}</p>
                        <p style="margin:4px 0; font-size:0.9rem;">${item.steps[0] || ''}</p>
                    `;
                } else {
                    div.innerHTML = `
                        <strong>☢️ ${item.active_ingredient}</strong>
                        <p style="margin:4px 0; font-size:0.9rem;">${item.usage_guidance}</p>
                    `;
                }
                container.appendChild(div);
            });
        } else {
            container.innerHTML = '<p class="text-sm text-gray-500">No recommendations.</p>';
        }
    }

    function showError(msg) {
        errorContainer.textContent = `⚠️ Error: ${msg}. Check connection.`;
        errorContainer.classList.remove('hidden');
    }
});
