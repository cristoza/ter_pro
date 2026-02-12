document.addEventListener('DOMContentLoaded', function() {
    // Highlight active nav link
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        // Check if the href matches the start of the current path (for sub-pages)
        // or exact match for root admin
        const href = link.getAttribute('href');
        if (href === '/admin' && currentPath === '/admin') {
            link.classList.add('active');
        } else if (href !== '/admin' && currentPath.startsWith(href)) {
            link.classList.add('active');
        }
    });

    const appointmentForm = document.getElementById('appointment-form');

    if (appointmentForm) {
        appointmentForm.addEventListener('submit', function(event) {
            event.preventDefault();

            const formData = new FormData(appointmentForm);
            const data = Object.fromEntries(formData.entries());
            
            // Call preview endpoint
            fetch('/api/appointments/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            .then(response => {
                if (!response.ok) return response.json().then(err => { throw new Error(err.message || 'Error generating preview'); });
                return response.json();
            })
            .then(previewData => {
                showPreviewModal(previewData, data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error: ' + error.message);
            });
        });
    }
});

function showPreviewModal(previewData, originalData) {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: '10000', backdropFilter: 'blur(4px)'
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        backgroundColor: 'white', padding: '32px', borderRadius: '16px',
        textAlign: 'center', maxWidth: '600px', width: '90%', maxHeight: '90%', overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        display: 'flex', flexDirection: 'column'
    });

    // Header
    const header = document.createElement('div');
    header.style.marginBottom = '24px';
    
    const icon = document.createElement('div');
    icon.textContent = '';
    icon.style.fontSize = '48px';
    icon.style.marginBottom = '16px';
    
    const title = document.createElement('h2');
    title.textContent = 'Confirmar Citas';
    title.style.margin = '0 0 8px 0';
    title.style.color = '#1e293b';
    title.style.fontSize = '24px';

    const subtitle = document.createElement('p');
    subtitle.textContent = `Se crearán ${previewData.length} cita(s) para ${previewData[0].patientName}`;
    subtitle.style.margin = '0';
    subtitle.style.color = '#64748b';

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(subtitle);

    // List Container
    const listContainer = document.createElement('div');
    listContainer.style.flex = '1';
    listContainer.style.overflowY = 'auto';
    listContainer.style.border = '1px solid #e2e8f0';
    listContainer.style.borderRadius = '8px';
    listContainer.style.marginBottom = '24px';
    listContainer.style.backgroundColor = '#f8fafc';

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.textAlign = 'left';

    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr style="background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0;">
            <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">#</th>
            <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Fecha</th>
            <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Hora</th>
            <th style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Terapista</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    previewData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e2e8f0';
        tr.style.backgroundColor = 'white';
        tr.innerHTML = `
            <td style="padding: 12px 16px; color: #64748b;">${idx + 1}</td>
            <td style="padding: 12px 16px; font-weight: 500; color: #334155;">${item.date}</td>
            <td style="padding: 12px 16px; font-family: monospace; color: #334155;">${item.time.substring(0,5)}</td>
            <td style="padding: 12px 16px; color: #334155;">${item.therapistName}</td>
        `;
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    listContainer.appendChild(table);

    // Buttons
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '12px';
    btnContainer.style.justifyContent = 'flex-end';
    btnContainer.style.paddingTop = '16px';
    btnContainer.style.borderTop = '1px solid #e2e8f0';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.className = 'btn';
    cancelBtn.style.backgroundColor = 'white';
    cancelBtn.style.color = '#64748b';
    cancelBtn.style.border = '1px solid #cbd5e1';
    cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#f1f5f9';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = 'white';
    cancelBtn.onclick = () => document.body.removeChild(modalOverlay);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '✅ Confirmar y Crear';
    confirmBtn.className = 'btn';
    confirmBtn.style.backgroundColor = '#10b981'; // Emerald 500
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = 'none';
    confirmBtn.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)';
    confirmBtn.onclick = () => {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Creando...';
        confirmBtn.style.opacity = '0.7';
        createAppointments(originalData, modalOverlay);
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);

    modalContent.appendChild(header);
    modalContent.appendChild(listContainer);
    modalContent.appendChild(btnContainer);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
}

function createAppointments(data, previewModal) {
    const occurrences = parseInt(data.occurrences) || 1;
    const url = occurrences > 1 ? '/api/appointments/series' : '/api/appointments';
    const appointmentForm = document.getElementById('appointment-form');

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.message || 'Error creating appointment'); });
        return response.json();
    })
    .then(result => {
        if (document.body.contains(previewModal)) {
            document.body.removeChild(previewModal);
        }
        
        let appointments = [];
        if (Array.isArray(result)) {
            appointments = result;
        } else if (result.created) {
            appointments = [result.created];
        } else {
            appointments = [result];
        }
        
        showQRCodeModal(appointments);
        if (appointmentForm) {
            appointmentForm.reset();
            const resultEl = appointmentForm.querySelector('.cedula-result');
            if (resultEl) resultEl.innerHTML = '';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error: ' + error.message);
        if (previewModal && document.body.contains(previewModal)) {
             document.body.removeChild(previewModal);
        }
    });
}

// --- Helper Functions & Cedula Check ---

async function api(path, method = 'GET', body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('click', async (e) => {
  if (!e.target.matches('button.check-patient')) return;
  const btn = e.target;
  const form = btn.closest('form');
  if (!form) return;
  const cedInput = form.querySelector('input[name="patientCedula"]');
  const resultEl = form.querySelector('.cedula-result');
  const ced = cedInput ? cedInput.value.trim() : '';
  if (!ced) {
    if (resultEl) resultEl.textContent = 'Please enter a cédula to check.';
    return;
  }
  try {
    if (resultEl) resultEl.textContent = 'Checking...';
    const p = await api(`/patients/cedula/${encodeURIComponent(ced)}`);
    form.dataset.patientExists = '1';
    if (resultEl) resultEl.innerHTML = `<span style="color:green">Found: ${escapeHtml(p.name)} ${escapeHtml(p.contact || '')}</span>`;
    const nameInput = form.querySelector('input[name="patientName"]');
    const contactInput = form.querySelector('input[name="patientContact"]');
    if (nameInput) nameInput.value = p.name || '';
    if (contactInput) contactInput.value = p.contact || '';
  } catch (err) {
    form.dataset.patientExists = '0';
    if (resultEl) resultEl.innerHTML = `<span style="color:crimson">No patient found with cédula ${escapeHtml(ced)}</span>`;
  }
});

function showQRCodeModal(appointments) {
    // Create modal elements
    const modalOverlay = document.createElement('div');
    Object.assign(modalOverlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center',
        alignItems: 'center', zIndex: '10000'
    });

    const modalContent = document.createElement('div');
    Object.assign(modalContent.style, {
        backgroundColor: 'white', padding: '24px', borderRadius: '12px',
        textAlign: 'center', maxWidth: '90%', maxHeight: '90%', overflow: 'auto',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    });

    const title = document.createElement('h2');
    title.textContent = '✅ Cita(s) Creada(s)';
    title.style.marginBottom = '12px';
    title.style.color = '#10b981';

    const text = document.createElement('p');
    text.textContent = 'Escanee este código para guardar los detalles:';
    text.style.marginBottom = '20px';
    text.style.color = '#64748b';

    const canvas = document.createElement('canvas');
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Cerrar';
    closeBtn.className = 'btn'; 
    closeBtn.style.marginTop = '12px';
    closeBtn.style.width = '100%';
    closeBtn.onclick = () => document.body.removeChild(modalOverlay);

    modalContent.appendChild(title);
    modalContent.appendChild(text);
    modalContent.appendChild(canvas);
    modalContent.appendChild(document.createElement('br'));
    
    // Add PDF Download Button
    const patientPublicId = appointments[0].patientPublicId;
    const batchId = appointments[0].batchId;
    
    if (patientPublicId) {
        const pdfBtn = document.createElement('a');
        // Use batchId if available, otherwise fallback to created date
        if (batchId) {
            pdfBtn.href = `/portal/patient/${patientPublicId}/pdf?batchId=${batchId}`;
        } else {
            const today = new Date().toLocaleDateString('en-CA');
            pdfBtn.href = `/portal/patient/${patientPublicId}/pdf?created=${today}`;
        }
        
        pdfBtn.target = '_blank';
        pdfBtn.className = 'btn';
        pdfBtn.style.display = 'block';
        pdfBtn.style.marginTop = '16px';
        pdfBtn.style.backgroundColor = '#ef4444'; // Red for PDF
        pdfBtn.style.color = 'white';
        pdfBtn.style.textDecoration = 'none';
        pdfBtn.textContent = '📄 Descargar PDF';
        modalContent.appendChild(pdfBtn);
    }

    modalContent.appendChild(closeBtn);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Generate QR Content
    let qrText = "";

    if (patientPublicId) {
        if (batchId) {
            qrText = `${window.location.origin}/portal/patient/${patientPublicId}?batchId=${batchId}`;
        } else {
            const today = new Date().toLocaleDateString('en-CA');
            qrText = `${window.location.origin}/portal/patient/${patientPublicId}?created=${today}`;
        }
        text.textContent = 'Escanee este código o descargue el PDF:';
    } else {
        qrText = "HOSPITAL DEL ADULTO MAYOR - CITAS:\n\n";
        appointments.forEach((app, index) => {
            // app.date is YYYY-MM-DD, app.time is HH:MM:SS
            const date = app.date;
            const time = app.time ? app.time.substring(0, 5) : '??:??';
            qrText += `${index + 1}. ${date} a las ${time}\n`;
        });
        qrText += `\nPaciente: ${appointments[0].patientName}`;
    }

    if (window.QRCode) {
        QRCode.toCanvas(canvas, qrText, { width: 200, margin: 2 }, function (error) {
            if (error) console.error(error);
        });
    } else {
        text.textContent = 'Error: Librería QR no cargada.';
    }
}