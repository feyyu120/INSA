/* ==========================================================================
   BMI CALCULATOR - JAVASCRIPT LOGIC
   Clean Dark Mode UI with Weight & Height controls, Visual scale, 
   Sidebar History & Favorites Drawer, and direct Favorites saving.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Inputs
    const bmiForm = document.getElementById('bmiForm');
    const weightInput = document.getElementById('weightInput');
    const weightMinusBtn = document.getElementById('weightMinusBtn');
    const weightPlusBtn = document.getElementById('weightPlusBtn');

    const heightInput = document.getElementById('heightInput');
    const heightMinusBtn = document.getElementById('heightMinusBtn');
    const heightPlusBtn = document.getElementById('heightPlusBtn');
    const heightSlider = document.getElementById('heightSlider');
    const heightValueDisplay = document.getElementById('heightValueDisplay');

    const calcBtn = document.getElementById('calcBtn');
    const resetBtn = document.getElementById('resetBtn');
    const errorMessage = document.getElementById('errorMessage');

    // DOM Elements - Result Card
    const resultCard = document.getElementById('resultCard');
    const bmiValueEl = document.getElementById('bmiValue');
    const bmiCategoryBadge = document.getElementById('bmiCategoryBadge');
    const scalePointer = document.getElementById('scalePointer');
    const pointerValue = document.getElementById('pointerValue');
    const bmiDescription = document.getElementById('bmiDescription');
    const saveBtn = document.getElementById('saveBtn');
    const favResultBtn = document.getElementById('favResultBtn');
    const saveStatus = document.getElementById('saveStatus');

    // DOM Elements - Sidebar Drawer
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarDrawer = document.getElementById('sidebarDrawer');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const filterAllBtn = document.getElementById('filterAllBtn');
    const filterFavBtn = document.getElementById('filterFavBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // State
    let currentResult = null;
    let activeFilter = 'all'; // 'all' or 'favorites'
    const STORAGE_KEY = 'bmi_calc_records_v4';

    // Step Weight Buttons
    weightMinusBtn.addEventListener('click', () => {
        let val = parseFloat(weightInput.value) || 70;
        if (val > 2) {
            val = Math.max(2, parseFloat((val - 1).toFixed(1)));
            weightInput.value = val;
        }
    });

    weightPlusBtn.addEventListener('click', () => {
        let val = parseFloat(weightInput.value) || 70;
        if (val < 300) {
            val = Math.min(300, parseFloat((val + 1).toFixed(1)));
            weightInput.value = val;
        }
    });

    // Sync Height Input & Slider
    heightSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        heightInput.value = val;
        heightValueDisplay.textContent = `${val} cm`;
    });
    heightMinusBtn.addEventListener('click', () => {
        let val = parseFloat(heightInput.value) || 170;
        if (val > 30) {
            val = Math.max(30, parseFloat((val - 1).toFixed(1)));
            heightInput.value = val;
        }
    });
    heightPlusBtn.addEventListener('click', () => {
        let val = parseFloat(heightInput.value) || 170;
        if (val < 250) {
            val = Math.min(250, parseFloat((val + 1).toFixed(1)));
            heightInput.value = val;
        }
    });

    heightInput.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val) && val >= 100 && val <= 220) {
            heightSlider.value = val;
        }
        heightValueDisplay.textContent = `${e.target.value || 0} cm`;
    });

    // Form Submit / Calculate
    bmiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCalculate();
    });

    resetBtn.addEventListener('click', handleReset);
    saveBtn.addEventListener('click', () => saveResult(false));
    favResultBtn.addEventListener('click', () => saveResult(true));

    // Sidebar Open/Close
    sidebarToggleBtn.addEventListener('click', openSidebar);
    closeSidebarBtn.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    // Filter Tabs
    filterAllBtn.addEventListener('click', () => {
        activeFilter = 'all';
        filterAllBtn.classList.add('active');
        filterFavBtn.classList.remove('active');
        renderHistory();
    });

    filterFavBtn.addEventListener('click', () => {
        activeFilter = 'favorites';
        filterFavBtn.classList.add('active');
        filterAllBtn.classList.remove('active');
        renderHistory();
    });

    clearHistoryBtn.addEventListener('click', handleClearHistory);

    // Initial Render
    renderHistory();


    /**
     * Handle BMI calculation
     */
    function handleCalculate() {
        hideError();

        const weight = parseFloat(weightInput.value);
        const height = parseFloat(heightInput.value);

        // Validation
        const errorMsg = validateInputs(weight, height);
        if (errorMsg) {
            showError(errorMsg);
            return;
        }

        // BMI Formula: weight / (height/100)^2
        const heightMeters = height / 100;
        const bmiRaw = weight / (heightMeters * heightMeters);
        const bmi = parseFloat(bmiRaw.toFixed(1));

        const categoryInfo = getBMICategory(bmi);

        currentResult = {
            weight: weight,
            height: height,
            bmi: bmi,
            categoryKey: categoryInfo.key,
            categoryName: categoryInfo.name,
            description: categoryInfo.description
        };

        // Update Result UI
        bmiValueEl.textContent = bmi.toFixed(1);
        bmiCategoryBadge.textContent = categoryInfo.name;
        bmiCategoryBadge.className = `category-badge category-${categoryInfo.key}`;
        bmiDescription.textContent = categoryInfo.description;

        // Position pointer pin (BMI 10 - 40 mapped to 0% - 100%)
        let percent = ((bmi - 10) / (40 - 10)) * 100;
        percent = Math.max(4, Math.min(96, percent));
        scalePointer.style.left = `${percent}%`;
        pointerValue.textContent = bmi.toFixed(1);

        // Show result card
        resultCard.classList.remove('hidden');
        saveStatus.classList.add('hidden');

        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Validate input fields
     */
    function validateInputs(weight, height) {
        if (isNaN(weight) || isNaN(height)) {
            return 'Please enter valid numbers for weight and height.';
        }
        if (weight <= 0 || height <= 0) {
            return 'Weight and height must be positive numbers.';
        }
        if (weight < 2 || weight > 300) {
            return 'Please enter a weight between 2 kg and 300 kg.';
        }
        if (height < 30 || height > 250) {
            return 'Please enter a height between 30 cm and 250 cm.';
        }
        return null;
    }

    /**
     * Determine BMI classification
     */
    function getBMICategory(bmi) {
        if (bmi < 18.5) {
            return {
                key: 'underweight',
                name: 'Underweight',
                description: 'You are below the recommended healthy weight. Eating nutrient-dense meals can help you reach a healthy weight.'
            };
        } else if (bmi >= 18.5 && bmi <= 24.9) {
            return {
                key: 'normal',
                name: 'Normal Weight',
                description: 'You have a healthy body weight! Keep maintaining your regular physical activity and balanced nutrition.'
            };
        } else if (bmi >= 25.0 && bmi <= 29.9) {
            return {
                key: 'overweight',
                name: 'Overweight',
                description: 'You are slightly above the healthy weight range. Increasing daily activity and balanced eating can assist.'
            };
        } else {
            return {
                key: 'obese',
                name: 'Obesity',
                description: 'Your score falls in the obesity classification. Consulting a health professional for personalized guidance is advised.'
            };
        }
    }

    /**
     * Reset form and clear results
     */
    function handleReset() {
        weightInput.value = '70';
        heightInput.value = '170';
        heightSlider.value = '170';
        heightValueDisplay.textContent = '170 cm';
        hideError();
        resultCard.classList.add('hidden');
        currentResult = null;
        saveStatus.classList.add('hidden');
    }

    /**
     * Save Result or Add directly to Favorites
     * @param {boolean} asFavorite - whether to save/mark as favorite
     */
    function saveResult(asFavorite = false) {
        if (!currentResult) return;

        const history = getSavedHistory();

        // DEDUPLICATION & UPDATE: Check if record with matching parameters already exists
        const existingIndex = history.findIndex(item =>
            item.weight === currentResult.weight &&
            item.height === currentResult.height &&
            item.bmi === currentResult.bmi
        );

        if (existingIndex !== -1) {
            if (asFavorite) {
                // Update favorite state on existing record
                history[existingIndex].isFavorite = true;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
                saveStatus.textContent = '⭐ Marked as Favorite in History!';
                saveStatus.className = 'save-status-toast favorite';
            } else {
                saveStatus.textContent = '⚠️ Already saved in your history!';
                saveStatus.className = 'save-status-toast duplicate';
            }
            saveStatus.classList.remove('hidden');
            renderHistory();
            return;
        }

        // Create timestamp
        const now = new Date();
        const dateStr = now.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }) + ' at ' + now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });

        const newRecord = {
            id: Date.now(),
            weight: currentResult.weight,
            height: currentResult.height,
            bmi: currentResult.bmi,
            categoryKey: currentResult.categoryKey,
            categoryName: currentResult.categoryName,
            dateStr: dateStr,
            isFavorite: asFavorite
        };

        history.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        if (asFavorite) {
            saveStatus.textContent = '⭐ Saved to Favorites & History!';
            saveStatus.className = 'save-status-toast favorite';
        } else {
            saveStatus.textContent = '✓ Saved to History!';
            saveStatus.className = 'save-status-toast saved';
        }
        saveStatus.classList.remove('hidden');

        renderHistory();
    }

    /**
     * Fetch saved entries from LocalStorage
     */
    function getSavedHistory() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (e) {
            return [];
        }
    }

    /**
     * Render History list in Sidebar
     */
    function renderHistory() {
        const history = getSavedHistory();
        historyList.innerHTML = '';

        const filtered = history.filter(item => {
            if (activeFilter === 'favorites') return item.isFavorite;
            return true;
        });

        if (filtered.length === 0) {
            const msg = activeFilter === 'favorites'
                ? 'No favorite records saved yet. Click ⭐ Add to Favorites on any calculation!'
                : 'No history records saved yet. Calculate and save your result above!';
            historyList.innerHTML = `<div class="empty-history-text">${msg}</div>`;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = `history-item-card ${item.isFavorite ? 'is-favorite' : ''}`;

            const starIcon = item.isFavorite ? '⭐' : '☆';
            const favClass = item.isFavorite ? 'is-fav' : '';

            card.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px;">
          <div class="item-badge category-${item.categoryKey}">
            ${item.bmi.toFixed(1)}
          </div>
          <div class="item-details">
            <span class="item-cat-title category-${item.categoryKey}">${item.categoryName}</span>
            <span class="item-stats-text">${item.weight} kg &bull; ${item.height} cm</span>
            <span class="item-date-text">📅 ${item.dateStr}</span>
          </div>
        </div>
        <div class="item-btn-group">
          <button class="icon-btn fav-btn ${favClass}" data-action="fav" data-id="${item.id}" title="Toggle Favorite">
            ${starIcon}
          </button>
          <button class="icon-btn" data-action="delete" data-id="${item.id}" title="Delete Record">
            🗑️
          </button>
        </div>
      `;

            historyList.appendChild(card);
        });

        // Event delegation for action buttons
        historyList.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.getAttribute('data-action');
                const id = parseInt(btn.getAttribute('data-id'), 10);

                if (action === 'fav') {
                    toggleFavorite(id);
                } else if (action === 'delete') {
                    deleteRecord(id);
                }
            });
        });
    }

    /**
     * Toggle favorite flag for record
     */
    function toggleFavorite(id) {
        const history = getSavedHistory();
        const idx = history.findIndex(h => h.id === id);
        if (idx !== -1) {
            history[idx].isFavorite = !history[idx].isFavorite;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            renderHistory();
        }
    }

    /**
     * Delete single record
     */
    function deleteRecord(id) {
        let history = getSavedHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        renderHistory();
    }

    /**
     * Clear all history records
     */
    function handleClearHistory() {
        const history = getSavedHistory();
        if (history.length === 0) return;

        if (confirm('Are you sure you want to clear all history records?')) {
            localStorage.removeItem(STORAGE_KEY);
            renderHistory();
        }
    }

    /**
     * Sidebar Helpers
     */
    function openSidebar() {
        renderHistory();
        sidebarDrawer.classList.remove('closed');
        sidebarOverlay.classList.remove('hidden');
    }

    function closeSidebar() {
        sidebarDrawer.classList.add('closed');
        sidebarOverlay.classList.add('hidden');
    }

    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
    }
});
