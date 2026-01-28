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
                
                // Add array for labels if not exists
                if (!FLOOR_LAYOUT.labels) {
                    FLOOR_LAYOUT.labels = [];
                }
                
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
                    } else if (seat.seat_type === 'label') {
                        FLOOR_LAYOUT.labels.push({
                            id: seat.id,
                            text: seat.seat_number,
                            x: parseInt(seat.x_position),
                            y: parseInt(seat.y_position)
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
        // Make SVG large enough to show all content including meeting rooms and corner desks
        // Add extra padding to ensure corner desks are visible
        const svgWidth = 1200;
        const svgHeight = 600;

        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', `-20 -20 ${svgWidth} ${svgHeight}`); // Add negative offset for better visibility
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
        // Draw area labels first (background layer)
        if (FLOOR_LAYOUT.labels) {
            FLOOR_LAYOUT.labels.forEach(label => {
                this.drawAreaLabel(label);
            });
        }

        // Draw desks
        FLOOR_LAYOUT.desks.forEach(desk => {
            this.drawSeat(desk);
        });

        // Draw meeting rooms
        FLOOR_LAYOUT.meetingRooms.forEach(room => {
            this.drawMeetingRoom(room);
        });
    }

    drawAreaLabel(label) {
        const x = parseInt(label.x) * 50 + 20;
        const y = parseInt(label.y) * 50 + 20;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('class', 'area-label-display');
        text.style.fontSize = '18px';
        text.style.fontWeight = 'bold';
        text.style.fill = '#7f8c8d';
        text.style.pointerEvents = 'none';
        text.style.userSelect = 'none';
        text.textContent = label.text;
        
        this.svg.appendChild(text);
    }

    drawSeat(desk) {
        // Use the same coordinate system as the editor (gridSize * 2 = 50)
        const x = parseInt(desk.x) * 50 + 20;
        const y = parseInt(desk.y) * 50 + 20;

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

        // Create seat label (will show seat number or user name)
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + CONFIG.SEAT_SIZE / 2);
        text.setAttribute('y', y + CONFIG.SEAT_SIZE / 2 + 3);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('class', 'seat-label');
        text.setAttribute('data-seat-id', desk.id);
        text.textContent = desk.id; // Default to seat number

        group.appendChild(rect);
        group.appendChild(text);
        this.svg.appendChild(group);

        // Add click handler
        rect.addEventListener('click', () => this.handleSeatClick(desk.id));
    }

    drawMeetingRoom(room) {
        // Use the same coordinate system as the editor
        const x = parseInt(room.x) * 50 + 20;
        const y = parseInt(room.y) * 50 + 20;
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
        const label = group ? group.querySelector('.seat-label') : null;
        
        if (seat) {
            seat.classList.remove('available', 'booked', 'selected');
            
            if (isBooked) {
                seat.classList.add('booked');
                this.bookings[seatId] = userName;
                
                // Update the seat label to show user name
                if (label && userName) {
                    // Show first name only (or initials if name is long)
                    const firstName = userName.split(' ')[0];
                    if (firstName.length > 8) {
                        // Show initials for long names
                        const names = userName.split(' ');
                        label.textContent = names.map(n => n[0]).join('').toUpperCase();
                    } else {
                        label.textContent = firstName;
                    }
                    label.style.fontSize = '9px';
                    label.style.fontWeight = 'bold';
                }
            } else {
                seat.classList.add('available');
                delete this.bookings[seatId];
                
                // Restore the seat number
                if (label) {
                    label.textContent = seatId;
                    label.style.fontSize = '10px';
                    label.style.fontWeight = 'normal';
                }
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