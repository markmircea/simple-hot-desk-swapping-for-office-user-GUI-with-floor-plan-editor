// Floor Plan Visualization
class FloorPlan {
    constructor(container) {
        this.container = container;
        this.selectedSeat = null;
        this.bookings = {};
    }

    async init() {
        this.createSVG();
        await this.loadFloorPlan();
    }

    async loadFloorPlan() {
        try {
            const response = await fetch(`${CONFIG.API_URL}seats.php`);
            const data = await response.json();
            
            if (data.success && data.seats) {
                // Clear default layout
                FLOOR_LAYOUT.desks = [];
                FLOOR_LAYOUT.meetingRooms = [];
                
                // Load from database
                data.seats.forEach(seat => {
                    if (seat.seat_type === 'meeting_room') {
                        FLOOR_LAYOUT.meetingRooms.push({
                            id: seat.id,
                            name: seat.seat_number,
                            x: parseInt(seat.x_position),
                            y: parseInt(seat.y_position),
                            width: parseInt(seat.width || 2),
                            height: parseInt(seat.height || 2)
                        });
                    } else {
                        FLOOR_LAYOUT.desks.push({
                            id: seat.id,
                            x: parseInt(seat.x_position),
                            y: parseInt(seat.y_position)
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error loading floor plan from database:', error);
            // Use default layout if database load fails
        }
        
        this.drawFloorPlan();
    }

    createSVG() {
        // Make SVG large enough to show all content including meeting rooms
        const svgWidth = 1000;
        const svgHeight = 500;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
        this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        
        // Add a subtle grid for reference
        this.drawGrid(svgWidth, svgHeight);
        
        this.container.innerHTML = '';
        this.container.appendChild(this.svg);
    }

    drawGrid(width, height) {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid');
        gridGroup.style.opacity = '0.2';

        // Draw grid lines every 50 pixels
        for (let x = 0; x <= width; x += 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', 0);
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', '#ddd');
            line.setAttribute('stroke-width', '0.5');
            gridGroup.appendChild(line);
        }

        for (let y = 0; y <= height; y += 50) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', 0);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', '#ddd');
            line.setAttribute('stroke-width', '0.5');
            gridGroup.appendChild(line);
        }

        this.svg.appendChild(gridGroup);
    }

    drawFloorPlan() {
        // Draw desks
        FLOOR_LAYOUT.desks.forEach(desk => {
            this.drawSeat(desk);
        });

        // Draw meeting rooms
        FLOOR_LAYOUT.meetingRooms.forEach(room => {
            this.drawMeetingRoom(room);
        });
    }

    drawSeat(desk) {
        // Use the same coordinate system as the editor (gridSize * 2 = 50)
        const x = parseInt(desk.x) * 50 + 40;
        const y = parseInt(desk.y) * 50 + 40;

        // Create seat group
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-seat-id', desk.id);
        group.setAttribute('class', 'seat-group');

        // Create seat rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', CONFIG.SEAT_SIZE);
        rect.setAttribute('height', CONFIG.SEAT_SIZE);
        rect.setAttribute('rx', 4);
        rect.setAttribute('class', 'seat available');
        rect.setAttribute('data-seat-id', desk.id);

        // Create seat label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + CONFIG.SEAT_SIZE / 2);
        text.setAttribute('y', y + CONFIG.SEAT_SIZE / 2 + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'seat-label');
        text.textContent = desk.id;

        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);

        // Add click handler
        rect.addEventListener('click', () => this.handleSeatClick(desk.id));
    }

    drawMeetingRoom(room) {
        // Use the same coordinate system as the editor
        const x = parseInt(room.x) * 50 + 40;
        const y = parseInt(room.y) * 50 + 40;
        const width = parseInt(room.width || 2) * 50 - 10;
        const height = parseInt(room.height || 2) * 50 - 10;

        // Create room group
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('data-room-id', room.id);

        // Create room rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', width);
        rect.setAttribute('height', height);
        rect.setAttribute('rx', 8);
        rect.setAttribute('class', 'meeting-room');
        rect.setAttribute('data-room-id', room.id);

        // Create room label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + width / 2);
        text.setAttribute('y', y + height / 2);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'room-label');
        text.textContent = room.name;

        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);

        // Add click handler
        rect.addEventListener('click', () => this.handleSeatClick(room.id));
    }

    handleSeatClick(seatId) {
        if (this.selectedSeat) {
            const prevSeat = this.svg.querySelector(`[data-seat-id="${this.selectedSeat}"]`);
            if (prevSeat && !this.bookings[this.selectedSeat]) {
                prevSeat.classList.remove('selected');
            }
        }

        this.selectedSeat = seatId;
        const seat = this.svg.querySelector(`rect[data-seat-id="${seatId}"], rect[data-room-id="${seatId}"]`);
        
        if (seat) {
            if (!this.bookings[seatId]) {
                seat.classList.add('selected');
            }
            
            // Trigger booking modal
            if (window.bookingManager) {
                window.bookingManager.openBookingModal(seatId);
            }
        }
    }

    updateSeatStatus(seatId, isBooked, userName = null) {
        const seat = this.svg.querySelector(`rect[data-seat-id="${seatId}"], rect[data-room-id="${seatId}"]`);
        const group = this.svg.querySelector(`g[data-seat-id="${seatId}"], g[data-room-id="${seatId}"]`);
        
        if (seat) {
            seat.classList.remove('available', 'booked', 'selected');
            
            // Remove any existing user name label
            const existingUserLabel = group ? group.querySelector('.user-name-label') : null;
            if (existingUserLabel) {
                existingUserLabel.remove();
            }
            
            if (isBooked) {
                seat.classList.add('booked');
                this.bookings[seatId] = userName;
                
                // Add user name label
                if (userName && group) {
                    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    const rect = seat.getBoundingClientRect();
                    const svgRect = this.svg.getBoundingClientRect();
                    
                    // Get seat position from its attributes
                    const x = parseFloat(seat.getAttribute('x')) || 0;
                    const y = parseFloat(seat.getAttribute('y')) || 0;
                    const width = parseFloat(seat.getAttribute('width')) || 40;
                    const height = parseFloat(seat.getAttribute('height')) || 40;
                    
                    text.setAttribute('x', x + width / 2);
                    text.setAttribute('y', y + height + 15);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('class', 'user-name-label');
                    text.setAttribute('font-size', '10');
                    text.setAttribute('fill', '#2c3e50');
                    text.textContent = userName.split(' ')[0]; // Show first name only
                    group.appendChild(text);
                }
            } else {
                seat.classList.add('available');
                delete this.bookings[seatId];
            }
        }
    }

    updateAllSeats(bookings) {
        // Reset all seats
        this.bookings = {};
        const allSeats = this.svg.querySelectorAll('.seat, .meeting-room');
        allSeats.forEach(seat => {
            seat.classList.remove('booked', 'selected');
            seat.classList.add('available');
        });

        // Update booked seats
        bookings.forEach(booking => {
            this.updateSeatStatus(booking.seat_id, true, booking.user_name);
        });
    }

    getSelectedSeat() {
        return this.selectedSeat;
    }

    getSeatInfo(seatId) {
        const seatIdStr = String(seatId);
        if (seatIdStr.startsWith('M')) {
            const room = FLOOR_LAYOUT.meetingRooms.find(r => r.id === seatIdStr);
            return room ? { id: seatIdStr, name: room.name, type: 'meeting_room' } : null;
        } else {
            return { id: seatIdStr, name: `Desk ${seatIdStr}`, type: 'desk' };
        }
    }
}