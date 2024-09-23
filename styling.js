// styling.js

(function () {
    // Styling Modal Elements
    const stylingModal = document.getElementById('styling-modal');
    const closeStylingModal = stylingModal.querySelector('.close');
    const stylingTypeSelect = document.getElementById('styling-type');
    const singleStylingOptions = document.getElementById('single-styling-options');
    const categoriesStylingOptions = document.getElementById('categories-styling-options');
    const applyStylingButton = document.getElementById('apply-styling');

    const columnDropdown = document.getElementById('column-name');
    const categoriesList = document.getElementById('categories-list');

    let currentLayer; // Variable to hold the current layer to style
    let categoryStyles = {}; // Object to store the styles for each category
    let singleStyle = {}; // Object to store the single styling
    let currentColumn;  // Track the currently selected column for category styling

    // Function to open the styling modal
    function openStylingModal(layer) {
        if (!layer || typeof layer.toGeoJSON !== 'function') {
            console.error("Invalid layer passed to openStylingModal:", layer);
            return;
        }

        currentLayer = layer;
        stylingModal.classList.remove('hidden');
        stylingModal.style.display = 'flex'; // Ensure modal is displayed as flex

        if (stylingTypeSelect.value === 'single') {
            showSingleStyling();
        } else {
            showCategoryStyling();
        }
    }

    // Display Single Styling options
    function showSingleStyling() {
        singleStylingOptions.classList.remove('hidden');
        categoriesStylingOptions.classList.add('hidden');
        loadSingleStyling();

        if (currentLayer && currentLayer.toGeoJSON().features.length > 0) {
            const geometryType = currentLayer.toGeoJSON().features[0].geometry.type;
            updateUIForGeometryType(geometryType);
        }
    }

    // Display Category Styling options
    function showCategoryStyling() {
        singleStylingOptions.classList.add('hidden');
        categoriesStylingOptions.classList.remove('hidden');
        populateColumnsDropdown();

        if (columnDropdown.options.length > 0) {
            columnDropdown.selectedIndex = 0;
            currentColumn = columnDropdown.value;
            displayCategoriesList();
        }

        if (currentLayer && currentLayer.toGeoJSON().features.length > 0) {
            const geometryType = currentLayer.toGeoJSON().features[0].geometry.type;
            updateUIForGeometryType(geometryType, true);
        }
    }

    // Load Single Styling values into inputs
    function loadSingleStyling() {
        document.getElementById('border-color').value = singleStyle.borderColor || '#3388ff';
        document.getElementById('border-width').value = singleStyle.borderWidth || '1';
        document.getElementById('fill-color').value = singleStyle.fillColor || '#3388ff';
        document.getElementById('fill-opacity').value = singleStyle.fillOpacity || '1';
        document.getElementById('point-size').value = singleStyle.pointSize || '5';
    }

    // Save Single Styling when inputs change
    function saveSingleStyle() {
        singleStyle = {
            borderColor: document.getElementById('border-color').value,
            borderWidth: document.getElementById('border-width').value,
            fillColor: document.getElementById('fill-color').value,
            fillOpacity: document.getElementById('fill-opacity').value,
            pointSize: document.getElementById('point-size').value
        };
    }

    // Apply Single Styling
    function applySingleStyling() {
        if (currentLayer) {
            currentLayer.eachLayer(function(layer) {
                const geometryType = layer.feature.geometry.type;
                applyStyleToLayer(layer, singleStyle, geometryType);
            });
        }
    }

    // Apply style to features of a specific category
    function applyCategoryStyleToFeatures(categoryValue) {
        if (currentLayer) {
            currentLayer.eachLayer(function(layer) {
                const layerValue = layer.feature.properties[currentColumn];
                if (String(layerValue) === String(categoryValue)) {
                    const geometryType = layer.feature.geometry.type;
                    const style = categoryStyles[currentColumn][categoryValue];
                    applyStyleToLayer(layer, style, geometryType);
                }
            });
        }
    }

    // Function to apply style to a layer based on geometry type
    function applyStyleToLayer(layer, style, geometryType) {
        // For Points
        if (geometryType.includes('Point') || geometryType.includes('MultiPoint')) {
            const pointStyle = {
                radius: parseFloat(style.pointSize) || 5,
                fillColor: style.fillColor || '#3388ff',
                fillOpacity: parseFloat(style.fillOpacity) || 1,
                color: style.borderColor || '#3388ff',
                weight: parseFloat(style.borderWidth) || 1
            };
            layer.setStyle(pointStyle);
        }
        // For Polygons
        else if (geometryType.includes('Polygon') || geometryType.includes('MultiPolygon')) {
            const polygonStyle = {
                color: style.borderColor || '#3388ff',
                weight: parseFloat(style.borderWidth) || 1,
                fillColor: style.fillColor || '#3388ff',
                fillOpacity: parseFloat(style.fillOpacity) || 1
            };
            layer.setStyle(polygonStyle);
        }
        // For Lines
        else if (geometryType.includes('LineString') || geometryType.includes('MultiLineString')) {
            const lineStyle = {
                color: style.borderColor || '#3388ff',
                weight: parseFloat(style.borderWidth) || 1
            };
            layer.setStyle(lineStyle);
        }
    }

    // Function to update the UI based on the geometry type
    function updateUIForGeometryType(geometryType, isCategoryStyling = false) {
        const prefix = isCategoryStyling ? '' : '';  // No prefix needed

        const borderColorInputGroup = document.getElementById(`${prefix}border-color`).closest('.input-group');
        const borderWidthInputGroup = document.getElementById(`${prefix}border-width`).closest('.input-group');
        const fillColorInputGroup = document.getElementById(`${prefix}fill-color`).closest('.input-group');
        const fillOpacityInputGroup = document.getElementById(`${prefix}fill-opacity`).closest('.input-group');
        const pointSizeInputGroup = document.getElementById(`${prefix}point-size`) ? document.getElementById(`${prefix}point-size`).closest('.input-group') : null;

        // Hide all groups initially
        [borderColorInputGroup, borderWidthInputGroup, fillColorInputGroup, fillOpacityInputGroup, pointSizeInputGroup].forEach(group => {
            if (group) {
                group.style.display = 'none';
            }
        });

        // Show relevant groups based on geometry type
        if (geometryType.includes('Point') || geometryType.includes('MultiPoint')) {
            [borderColorInputGroup, borderWidthInputGroup, fillColorInputGroup, fillOpacityInputGroup, pointSizeInputGroup].forEach(group => {
                if (group) {
                    group.style.display = 'block';
                }
            });
        } else if (geometryType.includes('LineString') || geometryType.includes('MultiLineString')) {
            [borderColorInputGroup, borderWidthInputGroup].forEach(group => {
                if (group) {
                    group.style.display = 'block';
                }
            });
        } else if (geometryType.includes('Polygon') || geometryType.includes('MultiPolygon')) {
            [borderColorInputGroup, borderWidthInputGroup, fillColorInputGroup, fillOpacityInputGroup].forEach(group => {
                if (group) {
                    group.style.display = 'block';
                }
            });
        }
    }

    // Populate Columns Dropdown
    function populateColumnsDropdown() {
        columnDropdown.innerHTML = '';
        if (currentLayer && currentLayer.toGeoJSON().features.length > 0) {
            const properties = currentLayer.toGeoJSON().features[0].properties;
            for (const key in properties) {
                if (properties.hasOwnProperty(key)) {
                    const option = document.createElement('option');
                    option.value = key;
                    option.textContent = key;
                    columnDropdown.appendChild(option);
                }
            }
        }
    }

    // Display the categories list
    function displayCategoriesList() {
        categoriesList.innerHTML = ''; // Clear previous content

        const selectedColumn = columnDropdown.value;
        currentColumn = selectedColumn; // Ensure currentColumn is set
        const uniqueValues = new Set();
        currentLayer.eachLayer(function(layer) {
            if (layer.feature && layer.feature.properties) {
                uniqueValues.add(layer.feature.properties[selectedColumn]);
            }
        });

        uniqueValues.forEach(value => {
            // Create a container for each category
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';

            // Display the category value
            const categoryLabel = document.createElement('label');
            categoryLabel.textContent = `Category: ${value}`;
            categoryDiv.appendChild(categoryLabel);

            // Create input elements for styling
            const styleInputs = createStyleInputs(value);
            categoryDiv.appendChild(styleInputs);

            categoriesList.appendChild(categoryDiv);
        });

        // Apply styles to all categories (initial load)
        uniqueValues.forEach(value => {
            if (categoryStyles[currentColumn] && categoryStyles[currentColumn][value]) {
                applyCategoryStyleToFeatures(value);
            }
        });

        // Update the legend
        updateLegend();
    }

    // Function to create style input elements for a category
    function createStyleInputs(categoryValue) {
        const styles = (categoryStyles[currentColumn] && categoryStyles[currentColumn][categoryValue]) || {};

        const container = document.createElement('div');
        container.className = 'style-inputs';

        // Border Color
        const borderColorInput = document.createElement('input');
        borderColorInput.type = 'color';
        borderColorInput.value = styles.borderColor || '#3388ff'; // Default border color
        borderColorInput.addEventListener('input', function() {
            updateCategoryStyle(categoryValue, 'borderColor', this.value);
        });
        container.appendChild(createInputGroup('Border Color', borderColorInput));

        // Border Width
        const borderWidthInput = document.createElement('input');
        borderWidthInput.type = 'number';
        borderWidthInput.min = 0;
        borderWidthInput.max = 10;
        borderWidthInput.value = styles.borderWidth || '1';
        borderWidthInput.addEventListener('input', function() {
            updateCategoryStyle(categoryValue, 'borderWidth', this.value);
        });
        container.appendChild(createInputGroup('Border Width', borderWidthInput));

        // For Points and Polygons, include Fill Color and Fill Opacity
        const geometryType = currentLayer.toGeoJSON().features[0].geometry.type;
        if (geometryType.includes('Point') || geometryType.includes('MultiPoint') || geometryType.includes('Polygon') || geometryType.includes('MultiPolygon')) {
            // Fill Color
            const fillColorInput = document.createElement('input');
            fillColorInput.type = 'color';
            fillColorInput.value = styles.fillColor || '#3388ff'; // Default fill color
            fillColorInput.addEventListener('input', function() {
                updateCategoryStyle(categoryValue, 'fillColor', this.value);
            });
            container.appendChild(createInputGroup('Fill Color', fillColorInput));

            // Fill Opacity
            const fillOpacityInput = document.createElement('input');
            fillOpacityInput.type = 'number';
            fillOpacityInput.min = 0;
            fillOpacityInput.max = 1;
            fillOpacityInput.step = 0.1;
            fillOpacityInput.value = styles.fillOpacity !== undefined ? styles.fillOpacity : 1;
            fillOpacityInput.addEventListener('input', function() {
                updateCategoryStyle(categoryValue, 'fillOpacity', this.value);
            });
            container.appendChild(createInputGroup('Fill Opacity', fillOpacityInput));
        }

        // Point Size (if applicable)
        if (geometryType.includes('Point') || geometryType.includes('MultiPoint')) {
            const pointSizeInput = document.createElement('input');
            pointSizeInput.type = 'number';
            pointSizeInput.min = 1;
            pointSizeInput.max = 20;
            pointSizeInput.value = styles.pointSize || '5';
            pointSizeInput.addEventListener('input', function() {
                updateCategoryStyle(categoryValue, 'pointSize', this.value);
            });
            container.appendChild(createInputGroup('Point Size', pointSizeInput));
        }

        return container;
    }

    // Helper function to create input groups
    function createInputGroup(labelText, inputElement) {
        const group = document.createElement('div');
        group.className = 'input-group';

        const label = document.createElement('label');
        label.textContent = labelText;
        group.appendChild(label);

        group.appendChild(inputElement);

        return group;
    }

    // Function to update category style and apply it
    function updateCategoryStyle(categoryValue, styleProperty, value) {
        if (!categoryStyles[currentColumn]) {
            categoryStyles[currentColumn] = {};
        }
        if (!categoryStyles[currentColumn][categoryValue]) {
            categoryStyles[currentColumn][categoryValue] = {};
        }
        categoryStyles[currentColumn][categoryValue][styleProperty] = value;

        applyCategoryStyleToFeatures(categoryValue);
        updateLegend();
    }

    // Update the legend dynamically
    function updateLegend() {
        const legendContent = document.getElementById('legend-content');
        legendContent.innerHTML = ''; // Clear existing legend content

        // Group legend items by layer name
        const layerName = currentLayer.options.name || 'Layer';
        const layerLegendTitle = document.createElement('h4');
        layerLegendTitle.textContent = layerName;
        legendContent.appendChild(layerLegendTitle);

        if (stylingTypeSelect.value === 'single') {
            // Single Styling Legend
            const legendItem = document.createElement('div');
            legendItem.innerHTML = `
                <span style="background-color: ${singleStyle.fillColor || '#3388ff'}; width: 20px; height: 20px; display: inline-block; border: 1px solid ${singleStyle.borderColor || '#3388ff'}; margin-right: 5px;"></span>
                <span> ${layerName}</span>
            `;
            legendContent.appendChild(legendItem);
        } else {
            // Category Styling Legend
            const categories = categoryStyles[currentColumn] || {};
            for (const [categoryValue, styles] of Object.entries(categories)) {
                const legendItem = document.createElement('div');
                legendItem.innerHTML = `
                    <span style="background-color: ${styles.fillColor || '#3388ff'}; width: 20px; height: 20px; display: inline-block; border: 1px solid ${styles.borderColor || '#3388ff'}; margin-right: 5px;"></span>
                    <span>${categoryValue}</span>
                `;
                legendContent.appendChild(legendItem);
            }
        }
    }

    // Attach event listeners to Single Styling inputs
    ['border-color', 'border-width', 'fill-color', 'fill-opacity', 'point-size'].forEach(function(id) {
        const input = document.getElementById(id);
        input.addEventListener('input', function() {
            saveSingleStyle();
            applySingleStyling();
            updateLegend(); // Update legend to reflect new styles
        });
    });

    // Event listener for column dropdown
    columnDropdown.addEventListener('change', function() {
        currentColumn = columnDropdown.value;
        displayCategoriesList();
    });

    // Apply styles when the "Apply" button is clicked
    applyStylingButton.addEventListener('click', function() {
        stylingModal.classList.add('hidden');
        stylingModal.style.display = 'none';
    });

    // Close the modal when the close button is clicked
    closeStylingModal.addEventListener('click', function() {
        stylingModal.classList.add('hidden');
        stylingModal.style.display = 'none';
    });

    // Close the modal when clicking outside of the modal content
    window.addEventListener('click', function(event) {
        if (event.target === stylingModal) {
            stylingModal.classList.add('hidden');
            stylingModal.style.display = 'none';
        }
    });

    // Switching between styling modes
    stylingTypeSelect.addEventListener('change', function() {
        if (this.value === 'single') {
            showSingleStyling();
        } else {
            showCategoryStyling();
        }
    });

    // Initialize the modal with the default styling type
    if (stylingTypeSelect.value === 'single') {
        showSingleStyling();
    } else {
        showCategoryStyling();
    }

    // Expose the openStylingModal function to the global scope
    window.openStylingModal = openStylingModal;

})();
