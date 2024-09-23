let addingText = false;  // Track if we're in text creation mode
let currentTextBox = null; // Track the currently selected text box
const textEditor = document.getElementById('text-editor'); // Reference to the editor

// Function to activate text creation mode (triggered by the pencil button)
function activateTextCreation() {
    addingText = true;
    map.getContainer().classList.add('crosshair'); // Change cursor to crosshair

    // Deactivate draw tools while in text mode
    map.removeControl(drawControl); // Disable draw controls
}

// Add a text box to the map on click
map.on('click', function (e) {
    if (!addingText) return;

    // Create a new text box
    const textBox = document.createElement('div');
    textBox.contentEditable = true;
    textBox.classList.add('text-box');

    // Position the text box based on map click
    const point = map.latLngToContainerPoint(e.latlng);
    textBox.style.left = `${point.x}px`;
    textBox.style.top = `${point.y}px`;

    // Add the text box to the body
    document.body.appendChild(textBox);

    // Make the text box resizable and draggable
    makeResizableAndDraggable(textBox);

    // Select the text box on click
    textBox.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent map click event
        selectTextBox(textBox); // Select the current text box
    });

    // Disable text creation mode after adding the text box
    addingText = false;
    map.getContainer().classList.remove('crosshair'); // Restore cursor

    // Re-enable draw controls after exiting text mode
    map.addControl(drawControl); // Re-enable draw controls
});

// Apply styles from the floating text editor to the selected text box
function applyTextBoxStyles(textBox) {
    const fontSize = document.getElementById('font-size').value;
    const color = document.getElementById('font-color').value;
    const align = document.getElementById('text-align').value;

    // Set styles
    textBox.style.fontSize = `${fontSize}px`;
    textBox.style.color = color;
    textBox.style.textAlign = align;

    // Check for bold, italic, underline
    textBox.style.fontWeight = document.getElementById('bold-button').classList.contains('active') ? 'bold' : 'normal';
    textBox.style.fontStyle = document.getElementById('italic-button').classList.contains('active') ? 'italic' : 'normal';
    textBox.style.textDecoration = document.getElementById('underline-button').classList.contains('active') ? 'underline' : 'none';
}

// Function to position the text editor above the text box
function updateEditorPosition(textBox) {
    textEditor.style.left = textBox.style.left;
    textEditor.style.top = `${parseInt(textBox.style.top) - 60}px`; // Keep it above the text box
}

// Make the text box resizable and draggable
function makeResizableAndDraggable(textBox) {
    textBox.addEventListener('mousedown', function (e) {
        let offsetX = e.clientX - textBox.offsetLeft;
        let offsetY = e.clientY - textBox.offsetTop;

        function moveAt(event) {
            textBox.style.left = event.pageX - offsetX + 'px';
            textBox.style.top = event.pageY - offsetY + 'px';

            // Update the editor position as the text box moves
            updateEditorPosition(textBox);
        }

        function stopDrag() {
            document.removeEventListener('mousemove', moveAt);
            document.removeEventListener('mouseup', stopDrag);
        }

        document.addEventListener('mousemove', moveAt);
        document.addEventListener('mouseup', stopDrag);
    });

    // Allow resizing the text box
    textBox.style.resize = 'both';
}

// Prevent the text editor from disappearing when clicking inside its inputs
textEditor.addEventListener('click', function (e) {
    e.stopPropagation(); // Prevent click from deselecting the text box
});

// Deselect a text box (hide border and fade out the text editor)
function deselectTextBox() {
    if (currentTextBox) {
        currentTextBox.classList.add('deselected');
        textEditor.classList.remove('visible'); // Hide the editor smoothly
        currentTextBox = null;
    }
}

// Select a text box (show border and fade in the text editor)
function selectTextBox(textBox) {
    if (currentTextBox) deselectTextBox(); // Deselect previous box
    textBox.classList.remove('deselected');
    currentTextBox = textBox;

    // Position the text editor above the text box
    updateEditorPosition(textBox);
    textEditor.classList.add('visible'); // Show the editor with smooth transition

    // Apply the current styles from the editor to the text box
    applyTextBoxStyles(textBox);
}

// Hide the text editor and deselect the box when clicking outside both the text box and editor
document.addEventListener('click', function () {
    deselectTextBox(); // Deselect when clicking outside
});

// Toggle Bold, Italic, and Underline
document.getElementById('bold-button').addEventListener('click', function () {
    this.classList.toggle('active');
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

document.getElementById('italic-button').addEventListener('click', function () {
    this.classList.toggle('active');
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

document.getElementById('underline-button').addEventListener('click', function () {
    this.classList.toggle('active');
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

// Apply changes in the floating text editor
document.getElementById('font-size').addEventListener('input', function () {
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

document.getElementById('font-color').addEventListener('input', function () {
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

document.getElementById('text-align').addEventListener('change', function () {
    if (currentTextBox) applyTextBoxStyles(currentTextBox);
});

// Delete the selected text box
document.getElementById('delete-textbox').addEventListener('click', function () {
    if (currentTextBox) {
        currentTextBox.remove(); // Remove the text box from the DOM
        deselectTextBox(); // Hide the editor after deletion
    }
});

// Function to add text to a shape (used with Leaflet Draw)
function addTextToShape(layer) {
    if (!addingText) return;  // Ensure text is only added in text mode

    // Get the centroid or center point of the shape
    var latlng = layer.getBounds().getCenter(); // For polygons, rectangles, circles

    // Create a new text box
    const textBox = document.createElement('div');
    textBox.contentEditable = true;
    textBox.classList.add('text-box');

    // Position the text box based on the shape's center point
    const point = map.latLngToContainerPoint(latlng);
    textBox.style.left = `${point.x}px`;
    textBox.style.top = `${point.y}px`;

    // Add the text box to the body
    document.body.appendChild(textBox);

    // Make the text box resizable and draggable
    makeResizableAndDraggable(textBox);

    // Select the text box on click
    textBox.addEventListener('click', function (e) {
        e.stopPropagation();
        selectTextBox(textBox);
    });
}

// Handle shape creation event from Leaflet Draw
map.on(L.Draw.Event.CREATED, function (e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);

    // Only add a text box when text mode is active
    if (addingText) {
        addTextToShape(layer);
        addingText = false;  // Exit text mode after adding the text
    }
});
