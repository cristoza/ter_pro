document.addEventListener('DOMContentLoaded', function() {
    const appointmentForm = document.getElementById('appointment-form');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(appointmentForm);
            const data = Object.fromEntries(formData.entries());

            fetch('/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Appointment created successfully!');
                    appointmentForm.reset();
                } else {
                    alert('Error creating appointment: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while creating the appointment.');
            });
        });
    }
});