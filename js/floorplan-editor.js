// Floor Plan Editor
class FloorPlanEditor {
    constructor() {
        this.container = null;
        this.svg = null;
        this.seats = [];
        this.meetingRooms = [];
        this.areaLabels = [];
        this.deleteMode = false;
        this.isDragging = false;
        this.draggedItem = null;
        this.dragOffset = { x: 0, y: 0 };
        this.nextSeatId = 100; // Start with high ID to avoid conflicts
        this.nextLabelId = 1;
        this.gridSize = 25; // Grid snapping size
    }

    init() {
        this.container = document.getElementById('editor-floor-plan');
        this.setupEventListeners();
        // Don't load layout on init - only when editor is opened
    }

    setupEventListeners() {
        // Editor modal buttons
        document.getElementById('edit-floorplan-btn').addEventListener('click', () => {
            // Edit button is only visible when authenticated
            this.openEditor();
        });

        document.getElementById('add-desk-btn').addEventListener('click', () => {
            this.addDesk();
        });

        document.getElementById('add-meeting-room-btn').addEventListener('click', () => {
            this.addMeetingRoom();
        });

        document.getElementById('add-label-btn').addEventListener('click', () => {
            this.addAreaLabel();
        });

        document.getElementById('delete-mode-btn').addEventListener('click', () => {
            this.toggleDeleteMode();
        });

        document.getElementById('save-floorplan-btn').addEventListener('click', () => {
            this.saveLayout();
        });

        document.getElementById('reset-floorplan-btn').addEventListener('click', () => {
            if (confirm('Reset to default layout? This will remove all customizations.')) {
                this.resetToDefault();
            }
        });

        // Close modal
        const modal = document.getElementById('floorplan-editor-modal');
        modal.querySelector('.close').addEventListener('click', () => {
            this.closeEditor();
        });
    }

    openEditor() {
        const modal = document.getElementById('floorplan-editor-modal');
        modal.style.display = 'block';
        this.createSVG();
        this.loadCurrentLayout();
    }

    closeEditor() {
        document.getElementById('floorplan-editor-modal').style.display = 'none';
        this.deleteMode = false;
        document.getElementById('delete-mode-btn').classList.remove('active');
        
        // Reload main floor plan to show any changes without page refresh
        if (window.floorPlan && window.floorPlan.loadFloorPlan) {
            window.floorPlan.loadFloorPlan();
        }
    }

    createSVG() {
        const svgWidth = 1000;
        const svgHeight = 500;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', svgWidth);
        this.svg.setAttribute('height', svgHeight);
        this.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        
        // Add grid
        this.drawGrid(svgWidth, svgHeight);
        
        this.container.innerHTML = '';
        this.container.appendChild(this.svg);

        // Add SVG event listeners for dragging
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleMouseUp());
        this.svg.addEventListener('mouseleave', () => this.handleMouseUp());
    }

    drawGrid(width, height) {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid');

        // Vertical lines
        for (let x = 0; x <= width; x += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('class', 'grid-line');
            gridGroup.appendChild(line);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += this.gridSize) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('class', 'grid-line');
            gridGroup.appendChild(line);
        }

        this.svg.appendChild(gridGroup);
    }

    async loadCurrentLayout() {
        try {
            const response = await fetch(`${CONFIG.API_URL}seats.php`);
            const data = await response.json();
            
            if (data.success && data.seats) {
                this.seats = [];
                this.meetingRooms = [];
                this.areaLabels = [];
                
                data.seats.forEach(seat => {
                    if (seat.seat_type === 'meeting_room') {
                        this.meetingRooms.push({
                            id: seat.id,
                            name: seat.seat_number,
                            x: seat.x_position * 50,  // x_position is stored in grid units of 50px
                            y: seat.y_position * 50,
                            width: (seat.width || 4) * 50,  // width is stored in grid units of 50px
                            height: (seat.height || 4) * 50  // height is stored in grid units of 50px
                        });
                    } else if (seat.seat_type === 'label') {
                        this.areaLabels.push({
                            id: seat.id,
                            text: seat.seat_number,
                            x: seat.x_position * 50,  // x_position is stored in grid units of 50px
                            y: seat.y_position * 50
                        });
                    } else {
                        this.seats.push({
                            id: seat.id,
                            x: seat.x_position * 50,  // x_position is stored in grid units of 50px
                            y: seat.y_position * 50
                        });
                    }
                });
                
                this.renderLayout();
            }
        } catch (error) {
            console.error('Error loading layout:', error);
            // Load default layout if API fails, but only if SVG exists
            if (this.svg) {
                this.loadDefaultLayout();
            }
        }
    }

    loadDefaultLayout() {
        this.seats = FLOOR_LAYOUT.desks.map(desk => ({
            id: desk.id,
            x: desk.x * 50,  // Use consistent 50px grid units
            y: desk.y * 50
        }));
        
        this.meetingRooms = FLOOR_LAYOUT.meetingRooms.map(room => ({
            id: room.id,
            name: room.name,
            x: room.x * 50,  // Use consistent 50px grid units
            y: room.y * 50,
            width: room.width * 50,  // width is in grid units, convert to pixels
            height: room.height * 50  // height is in grid units, convert to pixels
        }));
        
        // Only initialize labels array if not already present
        if (!this.areaLabels) {
            this.areaLabels = [];
        }
        
        this.renderLayout();
    }

    renderLayout() {
        // Only render if SVG exists
        if (!this.svg) {
            console.warn('SVG not created yet, skipping render');
            return;
        }
        
        // Clear existing seats, rooms, and labels (keep grid)
        const existingItems = this.svg.querySelectorAll('.seat-group, .room-group, .label-group');
        existingItems.forEach(item => item.remove());

        // Render area labels first (so they appear behind seats)
        this.areaLabels.forEach(label => {
            this.drawEditableLabel(label);
        });

        // Render seats
        this.seats.forEach(seat => {
            this.drawEditableSeat(seat);
        });

        // Render meeting rooms
        this.meetingRooms.forEach(room => {
            this.drawEditableMeetingRoom(room);
        });
    }

    drawEditableSeat(seat) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'seat-group');
        group.setAttribute('data-seat-id', seat.id);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', seat.x);
        rect.setAttribute('y', seat.y);
        rect.setAttribute('width', 40);
        rect.setAttribute('height', 40);
        rect.setAttribute('rx', 4);
        rect.setAttribute('class', 'seat available');
        rect.setAttribute('data-seat-id', seat.id);
        
        // Highlight newly added seats
        if (seat.isNew) {
            rect.style.fill = '#f39c12';
            rect.style.stroke = '#e67e22';
            rect.style.strokeWidth = '2';
            // Remove highlight after a moment
            setTimeout(() => {
                seat.isNew = false;
                this.renderLayout();
            }, 3000);
        }

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', seat.x + 20);
        text.setAttribute('y', seat.y + 25);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'seat-label');
        text.textContent = seat.id;

        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);

        // Add event listeners
        rect.addEventListener('mousedown', (e) => this.handleSeatMouseDown(e, seat));
        rect.addEventListener('click', (e) => this.handleSeatClick(e, seat));
    }

    drawEditableMeetingRoom(room) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'room-group');
        group.setAttribute('data-room-id', room.id);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', room.x);
        rect.setAttribute('y', room.y);
        rect.setAttribute('width', room.width || 100);
        rect.setAttribute('height', room.height || 75);
        rect.setAttribute('rx', 8);
        rect.setAttribute('class', 'meeting-room');
        rect.setAttribute('data-room-id', room.id);
        rect.style.cursor = 'move';
        rect.style.fill = '#3498db';
        rect.style.opacity = '0.3';

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', room.x + (room.width || 100) / 2);
        text.setAttribute('y', room.y + (room.height || 75) / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'room-label');
        text.style.pointerEvents = 'none';
        text.textContent = room.name;

        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);

        // Add event listeners to both rect and group for better dragging
        group.addEventListener('mousedown', (e) => this.handleRoomMouseDown(e, room));
        rect.addEventListener('mousedown', (e) => this.handleRoomMouseDown(e, room));
        rect.addEventListener('click', (e) => this.handleRoomClick(e, room));
    }

    drawEditableLabel(label) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'label-group');
        group.setAttribute('data-label-id', label.id);

        // Create text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', label.x);
        text.setAttribute('y', label.y);
        text.setAttribute('class', 'area-label');
        text.setAttribute('data-label-id', label.id);
        text.style.fontSize = '16px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#34495e';
        text.style.cursor = 'move';
        text.textContent = label.text;

        group.appendChild(text);
        this.svg.appendChild(group);

        // Add event listeners
        text.addEventListener('mousedown', (e) => this.handleLabelMouseDown(e, label));
        text.addEventListener('click', (e) => this.handleLabelClick(e, label));
    }

    handleSeatMouseDown(e, seat) {
        if (this.deleteMode) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.draggedItem = seat;
        
        const rect = this.svg.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left - seat.x,
            y: e.clientY - rect.top - seat.y
        };
        
        e.target.classList.add('dragging');
    }

    handleRoomMouseDown(e, room) {
        if (this.deleteMode) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.draggedItem = room;
        
        const rect = this.svg.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left - room.x,
            y: e.clientY - rect.top - room.y
        };
        
        e.target.classList.add('dragging');
    }

    handleLabelMouseDown(e, label) {
        if (this.deleteMode) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.draggedItem = label;
        
        const rect = this.svg.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left - label.x,
            y: e.clientY - rect.top - label.y
        };
        
        e.target.classList.add('dragging');
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.draggedItem) return;
        
        const rect = this.svg.getBoundingClientRect();
        let newX = e.clientX - rect.left - this.dragOffset.x;
        let newY = e.clientY - rect.top - this.dragOffset.y;
        
        // Snap to grid
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
        
        // Update position
        this.draggedItem.x = newX;
        this.draggedItem.y = newY;
        
        // Re-render
        this.renderLayout();
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedItem = null;
            
            // Remove dragging class
            const dragging = this.svg.querySelector('.dragging');
            if (dragging) {
                dragging.classList.remove('dragging');
            }
        }
    }

    handleSeatClick(e, seat) {
        if (this.deleteMode) {
            e.stopPropagation();
            if (confirm(`Delete desk ${seat.id}?`)) {
                this.seats = this.seats.filter(s => s.id !== seat.id);
                this.renderLayout();
            }
        }
    }

    handleRoomClick(e, room) {
        if (this.deleteMode) {
            e.stopPropagation();
            if (confirm(`Delete ${room.name}?`)) {
                this.meetingRooms = this.meetingRooms.filter(r => r.id !== room.id);
                this.renderLayout();
            }
        }
    }

    handleLabelClick(e, label) {
        if (this.deleteMode) {
            e.stopPropagation();
            if (confirm(`Delete label "${label.text}"?`)) {
                this.areaLabels = this.areaLabels.filter(l => l.id !== label.id);
                this.renderLayout();
            }
        }
    }

    toggleDeleteMode() {
        this.deleteMode = !this.deleteMode;
        const btn = document.getElementById('delete-mode-btn');
        
        if (this.deleteMode) {
            btn.classList.add('active');
            btn.style.background = '#c0392b';
            this.container.classList.add('delete-mode-active');
        } else {
            btn.classList.remove('active');
            btn.style.background = '';
            this.container.classList.remove('delete-mode-active');
        }
    }

    addDesk() {
        // Find the highest existing desk number
        let maxId = 0;
        this.seats.forEach(seat => {
            const id = parseInt(seat.id);
            if (!isNaN(id) && id > maxId) {
                maxId = id;
            }
        });
        
        // Add new desk with next number after max
        const newDeskId = maxId + 1;
        
        // Find a visible position (center of viewport)
        const newSeat = {
            id: String(newDeskId),
            x: 200,  // More centered position
            y: 200,
            isNew: true  // Mark as new for highlighting
        };
        
        this.seats.push(newSeat);
        
        this.renderLayout();
        
        // Scroll to the new desk
        const editorDiv = document.getElementById('editor-floor-plan');
        if (editorDiv) {
            editorDiv.scrollLeft = 100;
            editorDiv.scrollTop = 100;
        }
        
        alert(`Added Desk ${newSeat.id}. Look for the orange highlighted desk in the center of the floor plan.`);
    }
    
    renumberDesks() {
        // This function is now optional - only used when explicitly wanting to renumber
        // Sort seats by position (left to right, top to bottom)
        this.seats.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 20) {
                return a.x - b.x;
            }
            return a.y - b.y;
        });
        
        // Renumber them sequentially from 1
        this.seats.forEach((seat, index) => {
            seat.id = String(index + 1);
        });
    }

    addMeetingRoom() {
        const roomName = prompt('Enter meeting room name:');
        if (!roomName) return;
        
        // Ask for dimensions in grid units
        const widthInput = prompt('Enter width in grid units (e.g., 4 for 4 grid squares):', '4');
        if (!widthInput) return;
        const width = parseInt(widthInput);
        if (isNaN(width) || width < 1 || width > 10) {
            alert('Width must be a number between 1 and 10');
            return;
        }
        
        const heightInput = prompt('Enter height in grid units (e.g., 4 for 4 grid squares):', '4');
        if (!heightInput) return;
        const height = parseInt(heightInput);
        if (isNaN(height) || height < 1 || height > 10) {
            alert('Height must be a number between 1 and 10');
            return;
        }
        
        // Find the highest existing meeting room number
        let maxNum = 0;
        this.meetingRooms.forEach(room => {
            if (room.id.startsWith('M')) {
                const num = parseInt(room.id.substring(1));
                if (!isNaN(num) && num > maxNum) {
                    maxNum = num;
                }
            }
        });
        
        const newRoom = {
            id: 'M' + (maxNum + 1),
            name: roomName,
            x: 100,
            y: 100,
            width: width * this.gridSize,  // Convert grid units to pixels (25px per grid unit)
            height: height * this.gridSize  // Convert grid units to pixels (25px per grid unit)
        };
        
        this.meetingRooms.push(newRoom);
        this.renderLayout();
        alert(`Added ${roomName} (${width}x${height} grid units). Drag it to the desired position.`);
    }

    addAreaLabel() {
        const labelText = prompt('Enter area label text (e.g., "Engineering", "Sales Area", "Reception"):');
        if (!labelText) return;
        
        // Find the highest existing label ID
        let maxId = 0;
        this.areaLabels.forEach(label => {
            if (label.id.startsWith('L')) {
                const num = parseInt(label.id.substring(1));
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        });
        
        const newLabel = {
            id: 'L' + (maxId + 1),
            text: labelText,
            x: 300,
            y: 100
        };
        
        this.areaLabels.push(newLabel);
        this.renderLayout();
        alert(`Added label "${labelText}". Drag it to the desired position.`);
    }

    async saveLayout() {
        const layoutData = {
            seats: this.seats.map(seat => ({
                id: seat.id,
                x_position: Math.round(seat.x / 50),  // Convert pixels back to grid units
                y_position: Math.round(seat.y / 50),
                seat_type: 'desk'
            })),
            meeting_rooms: this.meetingRooms.map(room => ({
                id: room.id,
                name: room.name,
                x_position: Math.round(room.x / 50),  // Convert pixels back to grid units
                y_position: Math.round(room.y / 50),
                width: Math.round(room.width / 50),  // Convert pixels back to grid units
                height: Math.round(room.height / 50),
                seat_type: 'meeting_room'
            })),
            labels: this.areaLabels.map(label => ({
                id: label.id,
                text: label.text,
                x_position: Math.round(label.x / 50),  // Convert pixels back to grid units
                y_position: Math.round(label.y / 50),
                seat_type: 'label'
            }))
        };

        try {
            const response = await fetch(`${CONFIG.API_URL}update-layout.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(layoutData)
            });

            const data = await response.json();
            
            if (data.success) {
                alert('Floor plan saved successfully!');
                // Refresh the main floor plan before closing
                if (window.floorPlan && window.floorPlan.loadFloorPlan) {
                    await window.floorPlan.loadFloorPlan();
                }
                this.closeEditor();
            } else {
                alert('Failed to save floor plan: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving layout:', error);
            alert('Error saving floor plan. Please try again.');
        }
    }

    async resetToDefault() {
        try {
            const response = await fetch(`${CONFIG.API_URL}reset-layout.php`, {
                method: 'POST'
            });

            const data = await response.json();
            
            if (data.success) {
                this.loadDefaultLayout();
                alert('Floor plan reset to default!');
            } else {
                alert('Failed to reset floor plan: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error resetting layout:', error);
            this.loadDefaultLayout();
        }
    }
}

// Initialize editor when needed
window.floorPlanEditor = new FloorPlanEditor();