// attributes.js

(function () {
    // Get references to HTML elements
    const attributesButton = document.getElementById('attributes-button');
    const attributesModal = document.getElementById('attributes-modal');
    const closeAttributes = attributesModal.querySelector('.close');
    const layerSelect = document.getElementById('layer-select');
    const attributesTable = document.getElementById('attributes-table');

    // Event listener to open the attributes modal
    attributesButton.addEventListener('click', function() {
        populateLayerSelect();
        attributesModal.classList.remove('hidden');
        attributesModal.style.display = 'flex'; // Ensure modal is displayed as flex
    });

    // Event listener to close the modal
    closeAttributes.addEventListener('click', function() {
        attributesModal.classList.add('hidden');
        attributesModal.style.display = 'none';
    });

    // Close the modal when clicking outside of the modal content
    window.addEventListener('click', function(event) {
        if (event.target === attributesModal) {
            attributesModal.classList.add('hidden');
            attributesModal.style.display = 'none';
        }
    });

    // Function to populate the layer dropdown
    function populateLayerSelect() {
        layerSelect.innerHTML = ''; // Clear previous options

        // Use a Set to keep track of added layer names and prevent duplicates
        const addedLayers = new Set();

        layers.forEach(layerObj => {
            if (!addedLayers.has(layerObj.name)) {
                const option = document.createElement('option');
                option.value = layerObj.id; // Use layer ID for value
                option.textContent = layerObj.name;
                layerSelect.appendChild(option);
                addedLayers.add(layerObj.name);
            }
        });

        if (layerSelect.options.length > 0) {
            displayAttributesTable(layerSelect.value);
        } else {
            attributesTable.innerHTML = '<tr><td>No layers available</td></tr>';
        }
    }

    // Event listener for layer selection change
    layerSelect.addEventListener('change', function() {
        displayAttributesTable(this.value);
    });

    // Function to display the attributes table
    function displayAttributesTable(layerId) {
        const layerObj = layers.find(l => l.id === layerId);
        if (!layerObj) {
            console.error('Layer not found:', layerId);
            return;
        }

        const features = layerObj.layer.toGeoJSON().features;
        attributesTable.innerHTML = ''; // Clear the table

        if (features.length > 0) {
            // Create table headers
            const headers = Object.keys(features[0].properties);
            const headerRow = document.createElement('tr');

            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                th.classList.add('py-2', 'px-4', 'border', 'border-gray-300', 'bg-blue-500', 'text-white');
                headerRow.appendChild(th);
            });

            attributesTable.appendChild(headerRow);

            // Create table rows
            features.forEach(feature => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = feature.properties[header];
                    td.classList.add('py-2', 'px-4', 'border', 'border-gray-300');
                    tr.appendChild(td);
                });
                attributesTable.appendChild(tr);
            });
        } else {
            const noDataRow = document.createElement('tr');
            const noDataCell = document.createElement('td');
            noDataCell.colSpan = 1; // Adjust based on expected columns
            noDataCell.textContent = 'No data available';
            noDataCell.classList.add('py-2', 'px-4', 'text-center', 'text-gray-500');
            noDataRow.appendChild(noDataCell);
            attributesTable.appendChild(noDataRow);
        }
    }
})();
