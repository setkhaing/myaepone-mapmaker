(function () {
    // Initialize the map with a Canvas renderer for better performance on large datasets
    const canvasRenderer = L.canvas();
    const map = L.map('map', {
        renderer: canvasRenderer
    }).setView([0, 0], 2);

    // Default basemap layer
    const defaultBasemap = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png');
    defaultBasemap.addTo(map);

    // To store layers and their corresponding names
    const layers = [];
    let layerIdCounter = 0; // Unique ID counter for layers

    // Function to add a GeoJSON layer to the map
    function addGeoJSONLayer(geojson, name) {
        const layer = L.geoJSON(geojson, {
            renderer: canvasRenderer, // Set the renderer for all geometries
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng);
            }
        }).addTo(map);

        const layerId = `layer-${layerIdCounter++}`;
        layers.push({ id: layerId, name: name, layer: layer });
        addLayerControl(layerId, name, layer);
    }

    // Shapefile upload handling
    document.getElementById('shapefile-input').addEventListener('change', function (event) {
        const files = event.target.files;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function (e) {
                shp(e.target.result)
                    .then(function (geojson) {
                        const existingLayer = layers.find(l => l.name === file.name);
                        if (!existingLayer) {
                            addGeoJSONLayer(geojson, file.name);
                        } else {
                            alert(`Layer named "${file.name}" already exists.`);
                        }
                    })
                    .catch(function (err) {
                        console.error('Error loading shapefile:', err);
                    });
            };
            reader.readAsArrayBuffer(file);
        });
    });

    // Function to add a layer control item to the UI
    function addLayerControl(layerId, layerName, layer) {
        const layerControlContent = document.getElementById('layer-control-content');
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-item';
        layerDiv.draggable = true;
        layerDiv.dataset.layerId = layerId;

        // Attach drag-and-drop event listeners
        attachDragAndDropHandlers(layerDiv);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.addEventListener('change', function () {
            if (this.checked) {
                map.addLayer(layer);
            } else {
                map.removeLayer(layer);
            }
        });

        const label = document.createElement('label');
        label.textContent = layerName;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'layer-buttons';

        buttonsDiv.appendChild(createLayerButton('zoom-button', 'fas fa-search-plus', () => {
            map.fitBounds(layer.getBounds());
        }));

        buttonsDiv.appendChild(createLayerButton('style-button', 'fas fa-paint-brush', () => {
            openStylingModal(layer);
        }));

        buttonsDiv.appendChild(createLayerButton('remove-button', 'fas fa-trash-alt', () => {
            removeLayer(layerId);
            layerDiv.remove();
        }));

        layerDiv.appendChild(checkbox);
        layerDiv.appendChild(label);
        layerDiv.appendChild(buttonsDiv);

        layerControlContent.appendChild(layerDiv);
    }

    // Function to create a button for layer controls
    function createLayerButton(className, iconClass, onClick) {
        const button = document.createElement('button');
        button.className = className;
        button.innerHTML = `<i class="${iconClass}"></i>`;
        button.addEventListener('click', onClick);
        return button;
    }

    // Drag-and-drop functionality
    let draggedItem = null;

    function attachDragAndDropHandlers(element) {
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragover', handleDragOver);
        element.addEventListener('drop', handleDrop);
        element.addEventListener('dragend', handleDragEnd);
    }

    function handleDragStart(e) {
        draggedItem = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e) {
        e.preventDefault();
        if (draggedItem !== this) {
            const layerControlContent = document.getElementById('layer-control-content');
            const items = Array.from(layerControlContent.children);
            const draggedIndex = items.indexOf(draggedItem);
            const targetIndex = items.indexOf(this);

            if (draggedIndex > targetIndex) {
                layerControlContent.insertBefore(draggedItem, this);
            } else {
                layerControlContent.insertBefore(draggedItem, this.nextSibling);
            }
            reorderLayers();
        }
        this.classList.remove('drag-over');
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        draggedItem = null;
        const layerItems = document.querySelectorAll('.layer-item');
        layerItems.forEach(item => item.classList.remove('drag-over'));
    }

    // Reorder layers on the map based on the layer control order
    function reorderLayers() {
        const layerItems = document.querySelectorAll('.layer-item');
        const newLayersOrder = [];

        layerItems.forEach(item => {
            const layerId = item.dataset.layerId;
            const layerObj = layers.find(l => l.id === layerId);
            if (layerObj) {
                newLayersOrder.push(layerObj);
            }
        });

        // Remove all layers and re-add them in the new order
        layers.slice().reverse().forEach(layerObj => {
            map.removeLayer(layerObj.layer);
        });

        newLayersOrder.forEach(layerObj => {
            map.addLayer(layerObj.layer);
        });

        // Update the layers array
        layers.length = 0;
        layers.push(...newLayersOrder);
    }

    // Function to remove a layer by ID
    function removeLayer(layerId) {
        const layerIndex = layers.findIndex(l => l.id === layerId);
        if (layerIndex !== -1) {
            const layerObj = layers[layerIndex];
            map.removeLayer(layerObj.layer);
            layers.splice(layerIndex, 1);
        }
    }

    // Expose necessary functions and variables to the global scope if needed
    window.map = map;
    window.layers = layers;
    window.addGeoJSONLayer = addGeoJSONLayer;
})();

// Define a feature group to store drawn items
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Create a custom control for the pencil button (text tool)
L.Control.TextTool = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        // Create the pencil button (font awesome used for icon)
        container.innerHTML = '<a class="leaflet-draw-draw-pencil" title="Add Text"><i class="fas fa-pencil-alt"></i></a>';

        // Set styles for the button (optional, for appearance)
        container.style.cursor = 'pointer';
        container.style.backgroundColor = '#fff';
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        // Handle click event to activate text creation mode
        container.onclick = function () {
            activateTextCreation(); // Custom function to activate text mode

            // Disable text mode after adding text, enable draw controls again
            map.addControl(drawControl); // Re-enable draw controls
        };

        return container;
    }
});

// Add the control to the draw toolbar
var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems,
    },
    draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: true,
        marker: true,
    }
});
map.addControl(drawControl);

// Add the custom pencil control to the map (alongside Leaflet Draw controls)
var textControl = new L.Control.TextTool({ position: 'topleft' }).addTo(map);

// Variable to track the active shape
let activeShape = null;

// Handle creation of new shapes (polygons, lines, etc.)
map.on(L.Draw.Event.CREATED, function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);
    
    // Only add a text box if text creation mode is active
    if (addingText) {
        addTextToShape(layer);
        addingText = false;  // Reset text creation mode after adding the text
    }

    // Set the newly created shape as the active shape
    activeShape = layer;

    // Add click event to select the shape when clicked
    layer.on('click', function () {
        activeShape = layer;
    });
});

// Apply stroke color to the active shape
document.getElementById('shape-stroke-color').addEventListener('input', function () {
    if (activeShape) {
        activeShape.setStyle({ color: this.value });
    }
});

// Apply stroke width to the active shape
document.getElementById('shape-stroke-width').addEventListener('input', function () {
    if (activeShape) {
        activeShape.setStyle({ weight: this.value });
    }
});

// Apply fill color to the active shape
document.getElementById('shape-fill-color').addEventListener('input', function () {
    if (activeShape) {
        activeShape.setStyle({ fillColor: this.value });
    }
});

// Apply fill opacity to the active shape
document.getElementById('shape-fill-opacity').addEventListener('input', function () {
    if (activeShape) {
        activeShape.setStyle({ fillOpacity: this.value });
    }
});

L.Control.ShapeStyling = L.Control.extend({
    onAdd: function(map) {
        var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

        // Create the icon button for styling (using Font Awesome)
        container.innerHTML = '<a class="leaflet-draw-draw-style" title="Shape Styling"><i class="fas fa-paint-brush"></i></a>';
        container.style.cursor = 'pointer';
        container.style.backgroundColor = '#fff';
        container.style.width = '30px';
        container.style.height = '30px';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';

        // Handle click to open the styling modal
        container.onclick = function() {
            document.getElementById('shape-style-modal').classList.remove('hidden');
            document.getElementById('shape-style-modal').style.display = 'flex';
        };

        return container;
    }
});

map.addControl(new L.Control.ShapeStyling({ position: 'topleft' }));

