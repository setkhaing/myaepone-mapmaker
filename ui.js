// ui.js
(function () {
    // Ensure the script runs after the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function () {

        // Use the layers and addGeoJSONLayer from map.js

        // Layer Control Toggle
        const layerControlHeader = document.getElementById('layer-control-header');
        const layerControlContent = document.getElementById('layer-control-content');
        const toggleIcon = document.getElementById('toggle-icon');

        layerControlHeader.addEventListener('click', function () {
            if (layerControlContent.style.display === 'none' || layerControlContent.style.display === '') {
                layerControlContent.style.display = 'block';
                toggleIcon.classList.remove('fa-chevron-down');
                toggleIcon.classList.add('fa-chevron-up');
            } else {
                layerControlContent.style.display = 'none';
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
            }
        });

    // Your new Shape Styling Modal functionality
    const shapeModal = document.getElementById('shape-style-modal');
    const closeShapeModal = shapeModal.querySelector('.close');

    // Close modal when the 'X' button is clicked
    closeShapeModal.addEventListener('click', function() {
        shapeModal.classList.add('hidden');
        shapeModal.style.display = 'none';
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === shapeModal) {
            shapeModal.classList.add('hidden');
            shapeModal.style.display = 'none';
        }
    });

        // Modal Initialization Function
        function initModal(modalId, triggerId, onOpenCallback) {
            const modal = document.getElementById(modalId);
            const trigger = document.getElementById(triggerId);
            const closeButton = modal.querySelector('.close');
        
            // Ensure modal is hidden on page load
            modal.classList.add('hidden');
            modal.style.display = 'none';
        
            if (trigger) {
                trigger.addEventListener('click', function () {
                    modal.classList.remove('hidden');   // Show modal only when clicked
                    modal.style.display = 'flex';       // Ensure modal is displayed as flex
                    if (typeof onOpenCallback === 'function') {
                        onOpenCallback();
                    }
                });
            }
        
            if (closeButton) {
                closeButton.addEventListener('click', function () {
                    modal.classList.add('hidden');   // Hide modal when close button is clicked
                    modal.style.display = 'none';
                });
            }
        
            window.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.classList.add('hidden');   // Hide modal when clicking outside
                    modal.style.display = 'none';
                }
            });
        }
        

        // Basemap Modal Initialization
        initModal('basemap-modal', 'basemap-button', function () {
            const basemapOptions = document.querySelectorAll('.basemap-option');
            basemapOptions.forEach(option => {
                option.addEventListener('click', function () {
                    const selectedLayer = this.getAttribute('data-layer');
                    switchBasemap(selectedLayer);
                    document.getElementById('basemap-modal').classList.add('hidden');
                });
            });
        });

        // Function to switch basemap layers
        function switchBasemap(layerName) {
            if (window.currentBasemap) {
                map.removeLayer(window.currentBasemap);
            }
            let newBasemap;
            switch (layerName) {
                case 'streets':
                    newBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
                    break;
                case 'dark':
                    newBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
                    break;
                case 'light':
                    newBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png');
                    break;
                case 'satellite':
                    newBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: 'Map data © OpenStreetMap contributors'
                    });
                    break;
                default:
                    newBasemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
            }
            newBasemap.addTo(map);
            window.currentBasemap = newBasemap;
        }

        // Open Data MM Modal Initialization
        initModal('open-data-modal', 'open-data-button', function () {
            populateDataGrid();
        });

        // Function to populate the data grid with available layers
        function populateDataGrid() {
            const dataGrid = document.getElementById('data-grid');
            dataGrid.innerHTML = ''; // Clear previous content

            const dataLayers = [
                {
                    name: "Myanmar National Boundary MIMU v9.4",
                    url: "https://storage.googleapis.com/opendata-mm-geospatial/mmr_polbnda_adm0_250k_mimu_1.geojson",
                    type: "Polygon",
                    metadata: "Polygons of National boundaries for Myanmar (Admin 0), based on the latest MIMU Pcode version 9.4."
                },
                {
                    name: "Myanmar State and Region Boundaries with Sub-regions MIMU v9.4",
                    url: "https://storage.googleapis.com/opendata-mm-geospatial/mmr_polbnda2_adm1_250k_mimu_1.geojson",
                    type: "Polygon",
                    metadata: "Polygons of Myanmar State, Region and Union territory boundaries (Admin1) with Sub-regions."
                },
                {
                    name: "Myanmar District Boundaries MIMU v9.4",
                    url: "https://storage.googleapis.com/opendata-mm-geospatial/mmr_polbnda_adm2_250k_mimu.geojson",
                    type: "Polygon",
                    metadata: "Polygons of Myanmar District boundaries (Admin2), based on the latest MIMU Pcode version 9.4."
                },
                {
                    name: "Myanmar Township Boundaries MIMU v9.4",
                    url: "https://storage.googleapis.com/opendata-mm-geospatial/mmr_polbnda_adm3_250k_mimu_1.geojson",
                    type: "Polygon",
                    metadata: "Polygons of Myanmar Township boundaries (Admin3), based on the latest MIMU Pcode version 9.4."
                }
            ];

            // Populate the grid with your data layers
            dataLayers.forEach(item => {
                const dataItemDiv = document.createElement('div');
                dataItemDiv.className = 'data-item';
                dataItemDiv.innerHTML = `
                    <i class="fas fa-map"></i>
                    <p>${item.name}</p>
                    <small>${item.metadata}</small>
                `;
                dataItemDiv.dataset.layerUrl = item.url;

                dataItemDiv.addEventListener('click', function () {
                    this.classList.toggle('selected');
                });

                dataGrid.appendChild(dataItemDiv);
            });
        }

        // Add selected layers to map
        const addToMapButton = document.getElementById('add-to-map-button');
        addToMapButton.addEventListener('click', function () {
            const selectedItems = document.querySelectorAll('.data-item.selected');
            selectedItems.forEach(item => {
                const layerUrl = item.dataset.layerUrl;
                fetch(layerUrl)
                    .then(response => response.json())
                    .then(geojson => {
                        addGeoJSONLayer(geojson, item.querySelector('p').textContent);
                    })
                    .catch(error => {
                        console.error('Error loading data layer:', error);
                    });
            });
            document.getElementById('open-data-modal').classList.add('hidden');
        });

        // Introduction Modal Initialization
        const introModal = document.getElementById('intro-modal-new');
        const startButton = document.getElementById('start-button-new');
        if (introModal) {
            introModal.style.display = 'flex'; // Show the modal on page load

            startButton.addEventListener('click', function () {
                introModal.style.display = 'none';
            });

            const closeIntroModal = introModal.querySelector('.close');
            if (closeIntroModal) {
                closeIntroModal.addEventListener('click', function () {
                    introModal.style.display = 'none';
                });
            }
        }

        // Query Layer Modal Initialization
        initModal('query-layer-modal', 'query-layer-button', function () {
            populateLayerSelect(); // Populate layers dropdown
        });

        const queryLayerSelect = document.getElementById('query-layer-select');
        const queryPropertySelect = document.getElementById('query-property');
        const queryOperatorSelect = document.getElementById('query-operator');
        const queryValueInput = document.getElementById('query-value');
        const applyQueryButton = document.getElementById('apply-query-button');
        const addConditionButton = document.getElementById('add-condition-button');
        const queryConditionsContainer = document.getElementById('query-conditions-container');
        let selectedLayer;
        let conditions = []; // Store multiple conditions

        // Populate Layer Dropdown
        function populateLayerSelect() {
            queryLayerSelect.innerHTML = '';
            layers.forEach(layerObj => {
                const option = document.createElement('option');
                option.value = layerObj.id;
                option.textContent = layerObj.name;
                queryLayerSelect.appendChild(option);
            });
            // Trigger change event to populate properties for the first layer
            if (layers.length > 0) {
                queryLayerSelect.value = layers[0].id;
                queryLayerSelect.dispatchEvent(new Event('change'));
            }
        }

        // Populate Properties on Layer Change
        queryLayerSelect.addEventListener('change', function () {
            const selectedLayerId = queryLayerSelect.value;
            const layerObj = layers.find(l => l.id === selectedLayerId);
            if (layerObj) {
                selectedLayer = layerObj.layer;
                populatePropertySelect(selectedLayer);
            } else {
                queryPropertySelect.innerHTML = '';
            }
        });

        function populatePropertySelect(layer) {
            queryPropertySelect.innerHTML = '';
            const features = layer.toGeoJSON().features;
            if (features.length === 0) {
                alert('No features in selected layer.');
                return;
            }
            const properties = features[0].properties;
            for (let key in properties) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = key;
                queryPropertySelect.appendChild(option);
            }
        }

        // Add condition to the conditions array
        addConditionButton.addEventListener('click', function () {
            const property = queryPropertySelect.value;
            const operator = queryOperatorSelect.value;
            const value = queryValueInput.value;

            if (property && operator && value) {
                const condition = { property, operator, value };
                conditions.push(condition);
                displayCondition(condition);
            }
        });

        // Function to display conditions in the UI
        function displayCondition(condition) {
            const conditionDiv = document.createElement('div');
            conditionDiv.classList.add('condition-item');
            conditionDiv.textContent = `${condition.property} ${condition.operator} ${condition.value}`;
            
            // Add a remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = 'Remove';
            removeButton.classList.add('remove-condition-button');
            removeButton.addEventListener('click', function () {
                removeCondition(condition, conditionDiv);
            });

            conditionDiv.appendChild(removeButton);
            queryConditionsContainer.appendChild(conditionDiv);
        }

        // Function to remove a condition
        function removeCondition(condition, conditionDiv) {
            // Remove condition from the array
            conditions = conditions.filter(c => !(c.property === condition.property && c.operator === condition.operator && c.value === condition.value));
            
            // Remove the condition element from the DOM
            conditionDiv.remove();
        }

        // Apply query when the "Apply Query" button is clicked
        applyQueryButton.addEventListener('click', function () {
            if (conditions.length > 0) {
                queryLayer(conditions);
                conditions = []; // Reset conditions after query
                document.getElementById('query-layer-modal').classList.add('hidden');
                document.getElementById('query-layer-modal').style.display = 'none';
            } else {
                alert('Please add at least one condition.');
            }
        });

        // Function to query the layer based on conditions
        function queryLayer(conditions) {
            const filteredFeatures = selectedLayer.toGeoJSON().features.filter(feature => {
                return conditions.every(condition => {
                    const { property, operator, value } = condition;
                    const featureValue = feature.properties[property];
                    switch (operator) {
                        case '=':
                            return featureValue == value;
                        case '!=':
                            return featureValue != value;
                        case '>':
                            return featureValue > value;
                        case '<':
                            return featureValue < value;
                        case 'LIKE':
                            return new RegExp(value, 'i').test(featureValue); // partial match
                        default:
                            return false;
                    }
                });
            });

            if (filteredFeatures.length > 0) {
                const newGeoJSON = {
                    type: 'FeatureCollection',
                    features: filteredFeatures
                };
                addGeoJSONLayer(newGeoJSON, `Query Result`);
            } else {
                alert('No features match the query.');
            }
        }
    });
})();

