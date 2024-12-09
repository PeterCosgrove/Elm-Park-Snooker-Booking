const backendUrl = "https://scheduling-tool-for-snooker.onrender.com"; // Replace with your backend URL

// Modal Elements
const modal = document.getElementById('bookingModal');
const closeModal = document.querySelector('.close');
const confirmBooking = document.getElementById('confirmBooking');
const bookingNameInput = document.getElementById('bookingName');

// Date Navigation Elements
const currentDateElement = document.getElementById('currentDate');
const prevDayButton = document.getElementById('prevDay');
const nextDayButton = document.getElementById('nextDay');
const dateInput = document.getElementById('date');

// Helper function to update the day name based on the selected date
const updateDayName = (selectedDate) => {
    const date = new Date(selectedDate);
    const options = { weekday: 'long' };
    const dayName = new Intl.DateTimeFormat('en-GB', options).format(date);
    document.getElementById('dayName').textContent = dayName;
};

// Helper function to format a date for display
const formatDate = (date) => new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
}).format(date);

// Update the current date and refresh bookings
const updateCurrentDate = (newDate) => {
    selectedDate = newDate.toISOString().split('T')[0];
    currentDateElement.textContent = formatDate(newDate);
    updateDayName(selectedDate);
    dateInput.value = selectedDate; // Sync with the date input
    loadBookings();
};

// Event listener for changes to the date input
dateInput.addEventListener('change', () => {
    const newDate = new Date(dateInput.value);
    updateCurrentDate(newDate);
});

// Default to today's date
const today = new Date();
const updateDate = (date) => {
    dateInput.value = date.toISOString().split('T')[0];
    currentDateElement.textContent = formatDate(date);
};
updateDate(today);

let selectedDate = today.toISOString().split('T')[0];
let currentSlot = null;

// Event listeners for navigation buttons
prevDayButton.addEventListener('click', () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    updateCurrentDate(newDate);
});

nextDayButton.addEventListener('click', () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    updateCurrentDate(newDate);
});

// Handle Edit Slot
const handleEditSlot = (tableId, time) => {
    const newBookingName = prompt(`Enter snooker match for ${time}:`);
    if (newBookingName) {
        addBooking(time, tableId === 'table1' ? 'Snooker Table 1' : 'Snooker Table 2', newBookingName);
    }
};

// Handle Delete Slot
const handleDeleteSlot = (tableId, time) => {
    const slot = document.querySelector(`#${tableId} .slot[data-time="${time}"]`);
    const timeText = slot.querySelector('span');

    if (confirm(`Are you sure you want to clear the booking for ${time}?`)) {
        // Set the booking name to a space
        const placeholderBooking = " ";

        // Update the text content and UI
        timeText.textContent = `${time} - ${placeholderBooking}`;
        slot.classList.remove('booked');

        // Update the backend with the placeholder booking name
        fetch(`${backendUrl}/bookings`, {
            method: 'POST', // Use POST to update the booking
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date: selectedDate,
                time,
                table: tableId === 'table1' ? 'Snooker Table 1' : 'Snooker Table 2',
                booking: placeholderBooking,
            }),
        }).catch((error) => {
            console.error('Error updating booking:', error);
        });
    }
};




// Populate time slots with inline editing
const populateTimeSlots = () => {
    const timeSlots = ['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
    const calendars = ['table1', 'table2'];

    calendars.forEach((calendarId) => {
        const slotsContainer = document.querySelector(`#${calendarId} .time-slots`);
        slotsContainer.innerHTML = ""; // Clear existing slots

        timeSlots.forEach((time) => {
            const slot = document.createElement('div');
            slot.classList.add('slot');
            slot.setAttribute('data-time', time);

            const timeText = document.createElement('span');
            timeText.textContent = time;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'booking-input';
            input.placeholder = 'Enter snooker match';

            const saveButton = document.createElement('button');
            saveButton.textContent = 'Save';
            saveButton.className = 'save-btn';
            saveButton.addEventListener('click', () => {
                const bookingName = input.value.trim();
                if (bookingName) {
                    addBooking(time, calendarId === 'table1' ? 'Snooker Table 1' : 'Snooker Table 2', bookingName);
                }
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-btn';
            deleteButton.addEventListener('click', () => handleDeleteSlot(calendarId, time));

            slot.appendChild(timeText);
            slot.appendChild(input);
            slot.appendChild(saveButton);
            slot.appendChild(deleteButton);
            slotsContainer.appendChild(slot);
        });
    });
};


// Add booking modal functionality
const addBooking = async (time, table, booking) => {
    try {
        await fetch(`${backendUrl}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: selectedDate, time, table, booking }),
        });
        loadBookings();
    } catch (error) {
        console.error('Error adding booking:', error);
    }
};

// Update bookings in real-time
const loadBookings = async () => {
    try {
        const response = await fetch(`${backendUrl}/bookings`);
        const bookings = await response.json();

        document.querySelectorAll('.slot').forEach((slot) => {
            const timeText = slot.querySelector('span');
            const input = slot.querySelector('.booking-input');
            const time = slot.getAttribute('data-time');

            timeText.textContent = time;
            input.value = "";
            slot.classList.remove('booked');
        });

        bookings
            .filter((booking) => booking.date === selectedDate)
            .forEach(({ time, table, booking }) => {
                const calendarId = table === "Snooker Table 1" ? "table1" : "table2";
                const slot = document.querySelector(`#${calendarId} .slot[data-time="${time}"]`);
                if (slot) {
                    const input = slot.querySelector('.booking-input');
                    input.value = booking;
                    slot.classList.add('booked');
                }
            });
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
};


// Initialize time slots and load bookings
populateTimeSlots();
loadBookings();
