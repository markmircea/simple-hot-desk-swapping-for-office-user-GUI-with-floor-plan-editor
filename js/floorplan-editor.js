// Floor Plan Editor
class FloorPlanEditor {
    constructor() {
        this.container = null;
        this.svg = null;
        this.seats = [];
        this.meetingRooms = [];
        this.deleteMode = false;
        this.isDragging = false;
        this.draggedSeat = null;
        this.dragOffset = { x: 0, y: 0 };
        this.nextSeatId = 100; // Start with high ID to avoid conflicts
        this.gridSize = 25; // Grid snapping size
    }

    init() {
        this.container = document.getElementById('editor-floor-plan');
        this.setupEventListeners();
        this.loadCurrentLayout();
    }

    setupEventListeners() {
        // Editor modal buttons
        document.getElementById('edit-floorplan-btn').addEventListener('click', () => {
            window.adminAuth.requireAuth(() => {
                this.openEditor();
            }, 'Edit Floor Plan');
        });

        document.getElementById('add-desk-btn').addEventListener('click', () => {
            this.addDesk();
        });

        document.getElementById('add-meeting-room-btn').addEventListener('click', () => {
            this.addMeetingRoom();
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
        
        // Reload main floor plan to show any changes
        if (window.floorPlan) {
            window.location.reload();
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
                
                data.seats.forEach(seat => {
                    if (seat.seat_type === 'meeting_room') {
                        this.meetingRooms.push({
                            id: seat.id,
                            name: seat.seat_number,
                            x: seat.x_position * this.gridSize * 2,
                            y: seat.y_position * this.gridSize * 2,
                            width: (seat.width || 2) * this.gridSize * 2,
                            height: (seat.height || 2) * this.gridSize * 2
                        });
                    } else {
                        this.seats.push({
                            id: seat.id,
                            x: seat.x_position * this.gridSize * 2,
                            y: seat.y_position * this.gridSize * 2
                        });
                    }
                });
                
                this.renderLayout();
            }
        } catch (error) {
            console.error('Error loading layout:', error);
            // Load default layout if API fails
            this.loadDefaultLayout();
        }
    }

    loadDefaultLayout() {
        this.seats = FLOOR_LAYOUT.desks.map(desk => ({
            id: desk.id,
            x: desk.x * this.gridSize * 2,
            y: desk.y * this.gridSize * 2
        }));
        
        this.meetingRooms = FLOOR_LAYOUT.meetingRooms.map(room => ({
            id: room.id,
            name: room.name,
            x: room.x * this.gridSize * 2,
            y: room.y * this.gridSize * 2,
            width: room.width * this.gridSize * 2,
            height: room.height * this.gridSize * 2
        }));
        
        this.renderLayout();
    }

    renderLayout() {
        // Clear existing seats (keep grid)
        const existingSeats = this.svg.querySelectorAll('.seat-group, .room-group');
        existingSeats.forEach(seat => seat.remove());

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

    handleSeatMouseDown(e, seat) {
        if (this.deleteMode) return;
        
        e.preventDefault();
        this.isDragging = true;
        this.draggedSeat = seat;
        
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
        this.draggedSeat = room;
        
        const rect = this.svg.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left - room.x,
            y: e.clientY - rect.top - room.y
        };
        
        e.target.classList.add('dragging');
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.draggedSeat) return;
        
        const rect = this.svg.getBoundingClientRect();
        let newX = e.clientX - rect.left - this.dragOffset.x;
        let newY = e.clientY - rect.top - this.dragOffset.y;
        
        // Snap to grid
        newX = Math.round(newX / this.gridSize) * this.gridSize;
        newY = Math.round(newY / this.gridSize) * this.gridSize;
        
        // Update position
        this.draggedSeat.x = newX;
        this.draggedSeat.y = newY;
        
        // Re-render
        this.renderLayout();
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedSeat = null;
            
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
                // Renumber remaining desks
                this.renumberDesks();
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
        // Add new desk with next sequential number based on total count
        const totalDesks = this.seats.length + 1;
        
        // Find a visible position (center of viewport)
        const newSeat = {
            id: String(totalDesks),
            x: 200,  // More centered position
            y: 200,
            isNew: true  // Mark as new for highlighting
        };
        
        this.seats.push(newSeat);
        
        // Renumber all desks sequentially
        this.renumberDesks();
        
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
        // Sort seats by position (left to right, top to bottom)
        this.seats.sort((a, b) => {
            if (Math.abs(a.y - b.y) < 20) {
                return a.x - b.x;
            }
            return a.y - b.y;
        });
        
        // Renumber them sequentially
        this.seats.forEach((seat, index) => {
            seat.id = String(index + 1);
        });
    }

    addMeetingRoom() {
        const roomName = prompt('Enter meeting room name:');
        if (!roomName) return;
        
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
            width: 100,
            height: 75
        };
        
        this.meetingRooms.push(newRoom);
        this.renderLayout();
        alert(`Added ${roomName}. Drag it to the desired position.`);
    }

    async saveLayout() {
        // Ensure desks are numbered sequentially before saving
        this.renumberDesks();
        
        const layoutData = {
            seats: this.seats.map(seat => ({
                id: seat.id,
                x_position: Math.round(seat.x / (this.gridSize * 2)),
                y_position: Math.round(seat.y / (this.gridSize * 2)),
                seat_type: 'desk'
            })),
            meeting_rooms: this.meetingRooms.map(room => ({
                id: room.id,
                name: room.name,
                x_position: Math.round(room.x / (this.gridSize * 2)),
                y_position: Math.round(room.y / (this.gridSize * 2)),
                width: Math.round(room.width / (this.gridSize * 2)),
                height: Math.round(room.height / (this.gridSize * 2)),
                seat_type: 'meeting_room'
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