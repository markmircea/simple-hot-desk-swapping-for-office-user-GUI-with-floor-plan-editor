// Configuration
const CONFIG = {
    API_URL: 'api/',
    SEATS: {
        ROWS: 7,
        COLS: 6,
        TOTAL: 42
    },
    MEETING_ROOMS: 2,
    SEAT_SIZE: 40,
    SEAT_SPACING: 50,
    SVG_PADDING: 40
};

// Seat layout configuration
const FLOOR_LAYOUT = {
    desks: [
        // Row 1
        { id: 1, x: 0, y: 0 },
        { id: 2, x: 1, y: 0 },
        { id: 3, x: 2, y: 0 },
        { id: 4, x: 3, y: 0 },
        { id: 5, x: 4, y: 0 },
        { id: 6, x: 5, y: 0 },
        // Row 2
        { id: 7, x: 0, y: 1 },
        { id: 8, x: 1, y: 1 },
        { id: 9, x: 2, y: 1 },
        { id: 10, x: 3, y: 1 },
        { id: 11, x: 4, y: 1 },
        { id: 12, x: 5, y: 1 },
        // Row 3
        { id: 13, x: 0, y: 2 },
        { id: 14, x: 1, y: 2 },
        { id: 15, x: 2, y: 2 },
        { id: 16, x: 3, y: 2 },
        { id: 17, x: 4, y: 2 },
        { id: 18, x: 5, y: 2 },
        // Row 4
        { id: 19, x: 0, y: 3 },
        { id: 20, x: 1, y: 3 },
        { id: 21, x: 2, y: 3 },
        { id: 22, x: 3, y: 3 },
        { id: 23, x: 4, y: 3 },
        { id: 24, x: 5, y: 3 },
        // Row 5
        { id: 25, x: 0, y: 4 },
        { id: 26, x: 1, y: 4 },
        { id: 27, x: 2, y: 4 },
        { id: 28, x: 3, y: 4 },
        { id: 29, x: 4, y: 4 },
        { id: 30, x: 5, y: 4 },
        // Row 6
        { id: 31, x: 0, y: 5 },
        { id: 32, x: 1, y: 5 },
        { id: 33, x: 2, y: 5 },
        { id: 34, x: 3, y: 5 },
        { id: 35, x: 4, y: 5 },
        { id: 36, x: 5, y: 5 },
        // Row 7
        { id: 37, x: 0, y: 6 },
        { id: 38, x: 1, y: 6 },
        { id: 39, x: 2, y: 6 },
        { id: 40, x: 3, y: 6 },
        { id: 41, x: 4, y: 6 },
        { id: 42, x: 5, y: 6 }
    ],
    meetingRooms: [
        { id: 'M1', name: 'Meeting Room 1', x: 7, y: 1, width: 2, height: 2 },
        { id: 'M2', name: 'Meeting Room 2', x: 7, y: 4, width: 2, height: 2 }
    ]
};