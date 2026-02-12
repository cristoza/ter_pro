// Consolidated admin client for therapists, patients, appointments and availability.
// Keeps cedula-check, auto-fill and series creation behavior.

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

// --- Therapists ---
async function loadTherapists() {
  const list = document.querySelector('#therapists-table tbody');
  if (!list) return;
  try {
    const therapists = await api('/therapists');
    list.innerHTML = therapists.map(t => `
      <tr>
        <td>${escapeHtml(t.id)}</td>
        <td>${escapeHtml(t.name)}</td>
        <td>${escapeHtml(t.specialty || 'Físico')}</td>
        <td>${escapeHtml(t.email)}</td>
        <td>${escapeHtml(t.phone || '')}</td>
        <td>
          <button data-id="${t.id}" class="edit-therapist">Edit</button>
          <button data-id="${t.id}" class="delete-therapist">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

async function createOrUpdateTherapist(form) {
  const data = Object.fromEntries(new FormData(form));
  const editId = form.dataset.editId;
  if (editId && !data.password) delete data.password;
  if (editId) {
    await api(`/therapists/${editId}`, 'PUT', data);
    delete form.dataset.editId;
  } else {
    await api('/therapists', 'POST', data);
  }
  form.reset();
  await loadTherapists();
}

// --- Patients ---
async function loadPatients() {
  const list = document.querySelector('#patients-table tbody');
  if (!list) return;
  try {
    const patients = await api('/patients');
    list.innerHTML = patients.map(p => `
      <tr>
        <td>${escapeHtml(p.id)}</td>
        <td>${escapeHtml(p.cedula || '')}</td>
        <td>${escapeHtml(p.name || '')}</td>
        <td>${escapeHtml(p.dob || '')}</td>
        <td>${escapeHtml(p.contact || '')}</td>
        <td>
          <button data-id="${p.id}" class="edit-patient">Edit</button>
          <button data-id="${p.id}" class="delete-patient">Delete</button>
        </td>
      </tr>`).join('');
  } catch (err) { console.error(err); }
}

async function createOrUpdatePatient(form) {
  const data = Object.fromEntries(new FormData(form));
  const editId = form.dataset.editId;
  if (editId) {
    await api(`/patients/${editId}`, 'PUT', data);
    delete form.dataset.editId;
  } else {
    await api('/patients', 'POST', data);
  }
  form.reset();
  await loadPatients();
}

// Store newly created appointment IDs for highlighting
let newAppointmentIds = new Set();

function resetFormState(form) {
  form.reset();
  delete form.dataset.editId;
  const btn = form.querySelector('button[type="submit"]');
  if (btn) btn.textContent = 'Crear Cita';
  
  const cancelBtn = form.querySelector('.cancel-edit-btn');
  if (cancelBtn) cancelBtn.remove();
}

// --- Appointments ---
async function loadAppointments(highlightIds = []) {
  const table = document.querySelector('#appointments-table');
  const list = document.querySelector('#appointments-table tbody');
  if (!list) return;
  
  // Check if this is doctor role (read-only)
  const isDoctor = table && table.dataset.role === 'doctor';
  
  try {
    let appts = await api('/api/appointments');
    
    // For doctor view, limit to 10 most recent (already sorted by creation DESC from server)
    if (isDoctor) {
      appts = appts.slice(0, 10);
    }
    
    if (isDoctor) {
      // Doctor view: no actions column, with highlighting
      list.innerHTML = appts.map(a => {
        const isNew = highlightIds.includes(a.id) || newAppointmentIds.has(a.id);
        const highlightClass = isNew ? ' class="highlight-new"' : '';
        return `
        <tr${highlightClass} data-id="${a.id}">
          <td>${escapeHtml(a.id)}</td>
          <td>${escapeHtml(a.date)}</td>
          <td>${escapeHtml(a.time)}</td>
          <td>${escapeHtml(a.patientName || '')}</td>
          <td>${escapeHtml(a.patientContact || '')}</td>
          <td>${escapeHtml(a.therapist ? a.therapist.name : 'Sin asignar')}</td>
        </tr>`;
      }).join('');
    } else {
      // Admin view: with actions
      list.innerHTML = appts.map(a => {
        const isNew = highlightIds.includes(a.id) || newAppointmentIds.has(a.id);
        const highlightClass = isNew ? ' class="highlight-new"' : '';
        return `
        <tr${highlightClass} data-id="${a.id}">
          <td>${escapeHtml(a.id)}</td>
          <td>${escapeHtml(a.creationDate || '')}</td>
          <td>${escapeHtml(a.date)}</td>
          <td>${escapeHtml(a.time)}</td>
          <td>${escapeHtml(a.patientName || '')}</td>
          <td>${escapeHtml(a.patientContact || '')}</td>
          <td>${escapeHtml(a.therapist ? a.therapist.name : 'Sin asignar')}</td>
          <td>
            <button data-id="${a.id}" class="edit-appointment">Editar</button>
            <button data-id="${a.id}" class="delete-appointment">Eliminar</button>
          </td>
        </tr>`;
      }).join('');
    }
    
    // Remove highlight after animation
    if (highlightIds.length > 0) {
      setTimeout(() => {
        highlightIds.forEach(id => newAppointmentIds.delete(id));
      }, 3000);
    }
  } catch (err) { console.error(err); }
}

async function createOrUpdateAppointment(form) {
  const data = Object.fromEntries(new FormData(form));
  const editId = form.dataset.editId;
  if (editId) {
    await api(`/api/appointments/${editId}`, 'PUT', data);
    delete form.dataset.editId;
  } else {
    try {
      // if a cedula is provided, verify the patient exists first (server enforces this on create)
      if (data.patientCedula) {
        try {
          const p = await api(`/patients/cedula/${encodeURIComponent(data.patientCedula)}`);
          if (p) {
            data.patientName = data.patientName || p.name;
            data.patientContact = data.patientContact || p.contact;
          }
        } catch (err) {
          alert(`No patient found with cédula ${data.patientCedula}. Please create the patient first.`);
          return;
        }
      }

      const occ = Number(data.occurrences) || 0;
      
      // Ensure time format includes seconds
      if (data.time && !data.time.includes(':00:')) {
        data.time = data.time + ':00';
      }
      
      let result;
      if (occ > 1) {
        // Build series request - only include date/time if provided
        const seriesData = {
          occurrences: occ,
          durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
          patientName: data.patientName,
          patientContact: data.patientContact,
          patientCedula: data.patientCedula || data.cedula || undefined,
        };
        
        // Only include startDate and time if they exist (admin has these fields, doctor doesn't)
        if (data.date) seriesData.startDate = data.date;
        if (data.time) seriesData.time = data.time;
        
        result = await api('/api/appointments/series', 'POST', seriesData);
      } else {
        result = await api('/api/appointments', 'POST', data);
      }
      
      // Track new appointment IDs for highlighting
      const newIds = [];
      if (Array.isArray(result)) {
        // Series result
        result.forEach(appt => {
          newAppointmentIds.add(appt.id);
          newIds.push(appt.id);
        });
      } else if (result && result.created) {
        // Single appointment result
        newAppointmentIds.add(result.created.id);
        newIds.push(result.created.id);
      }
      
      resetFormState(form);
      await loadAppointments(newIds);
      return;
    } catch (err) {
      // show server error to user for easier debugging
      alert('Error creating appointment: ' + (err.message || String(err)));
      console.error('Create appointment error', err);
      return;
    }
  }
  resetFormState(form);
  await loadAppointments();
}

// --- Availability ---
async function loadAvailability() {
  const listEl = document.querySelector('#availability-table tbody');
  if (!listEl) return [];
  const list = await api('/availability');
  const therapists = await api('/therapists');
  listEl.innerHTML = list.map(a => `
    <tr>
      <td>${escapeHtml(a.id)}</td>
      <td>${escapeHtml(therapists.find(t => t.id === a.therapistId)?.name || a.therapistId)}</td>
      <td>${escapeHtml(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][a.dayOfWeek])}</td>
      <td>${escapeHtml(a.startTime)}</td>
      <td>${escapeHtml(a.endTime)}</td>
      <td><button data-id="${a.id}" class="edit-availability">Edit</button>
          <button data-id="${a.id}" class="delete-availability">Delete</button></td>
    </tr>`).join('');
  return list;
}

async function createOrUpdateAvailability(form) {
  const data = Object.fromEntries(new FormData(form));
  const editId = form.dataset.editId;
  if (editId) {
    await api(`/availability/${editId}`, 'PUT', data);
    delete form.dataset.editId;
  } else {
    await api('/availability', 'POST', data);
  }
  form.reset();
  await loadAvailability();
}

// --- UI wiring ---
document.addEventListener('DOMContentLoaded', async () => {
  // Therapists form
  const tForm = document.querySelector('#therapist-form');
  if (tForm) {
    tForm.addEventListener('submit', e => { e.preventDefault(); createOrUpdateTherapist(tForm); });
    document.addEventListener('click', async e => {
      if (e.target.matches('.delete-therapist')) {
        const id = e.target.dataset.id; await api(`/therapists/${id}`, 'DELETE'); await loadTherapists();
      }
      if (e.target.matches('.edit-therapist')) {
        const id = e.target.dataset.id; const t = await api(`/therapists/${id}`);
        tForm.name.value = t.name || ''; tForm.email.value = t.email || ''; tForm.phone.value = t.phone || '';
        if (tForm.specialty) tForm.specialty.value = t.specialty || 'Físico';
        tForm.dataset.editId = t.id;
      }
    });
    await loadTherapists();
  }

  // Patients form
  const pForm = document.querySelector('#patient-form');
  if (pForm) {
    pForm.addEventListener('submit', e => { e.preventDefault(); createOrUpdatePatient(pForm); });
    document.addEventListener('click', async e => {
      if (e.target.matches('.delete-patient')) { const id = e.target.dataset.id; await api(`/patients/${id}`, 'DELETE'); await loadPatients(); }
      if (e.target.matches('.edit-patient')) {
        const id = e.target.dataset.id; const p = await api(`/patients/${id}`);
        pForm.cedula.value = p.cedula || ''; pForm.name.value = p.name || ''; pForm.dob.value = p.dob || ''; pForm.contact.value = p.contact || ''; pForm.notes.value = p.notes || '';
        pForm.dataset.editId = p.id;
      }
    });
    await loadPatients();
  }

  // Appointments form
  const aForm = document.querySelector('#appointment-form');
  if (aForm) {
    aForm.addEventListener('submit', e => { e.preventDefault(); createOrUpdateAppointment(aForm); });
    
    // Only add edit/delete handlers if not doctor role
    const table = document.querySelector('#appointments-table');
    const isDoctor = table && table.dataset.role === 'doctor';
    
    if (!isDoctor) {
      document.addEventListener('click', async e => {
        if (e.target.matches('.delete-appointment')) { 
          if (!confirm('¿Está seguro que desea eliminar esta cita?')) return;
          const id = e.target.dataset.id; 
          await api(`/api/appointments/${id}`, 'DELETE'); 
          await loadAppointments(); 
        }
        if (e.target.matches('.edit-appointment')) { 
          const id = e.target.dataset.id; 
          const a = await api(`/api/appointments/${id}`);
          if (aForm.date) aForm.date.value = a.date || ''; 
          if (aForm.time) aForm.time.value = a.time || ''; 
          aForm.patientName.value = a.patientName || ''; 
          aForm.patientContact.value = a.patientContact || '';
          if (aForm.patientCedula) aForm.patientCedula.value = a.patientCedula || '';
          aForm.dataset.editId = a.id;

          // UI Updates
          const submitBtn = aForm.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.textContent = 'Actualizar Cita';

          let cancelBtn = aForm.querySelector('.cancel-edit-btn');
          if (!cancelBtn) {
             cancelBtn = document.createElement('button');
             cancelBtn.type = 'button';
             cancelBtn.className = 'btn btn-secondary cancel-edit-btn';
             cancelBtn.textContent = 'Cancelar';
             cancelBtn.style.marginLeft = '10px';
             cancelBtn.onclick = () => {
                 resetFormState(aForm);
             };
             if (submitBtn) submitBtn.parentNode.appendChild(cancelBtn);
          }
        }
      });
    }
    
    await loadAppointments();
  }

  // Availability form
  const avForm = document.querySelector('#availability-form');
  if (avForm) {
    // populate therapist select
    const therapistSelect = document.querySelector('#avail-therapist');
    const therapists = await api('/therapists');
    therapistSelect.innerHTML = therapists.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    avForm.addEventListener('submit', async e => { e.preventDefault(); await createOrUpdateAvailability(avForm); });
    document.addEventListener('click', async e => {
      if (e.target.matches('.delete-availability')) { const id = e.target.dataset.id; await api(`/availability/${id}`, 'DELETE'); await loadAvailability(); }
      if (e.target.matches('.edit-availability')) { const id = e.target.dataset.id; const av = await api(`/availability/${id}`); avForm.dataset.editId = av.id; avForm.therapistId.value = av.therapistId; avForm.dayOfWeek.value = av.dayOfWeek; avForm.startTime.value = av.startTime.substring(0,5); avForm.endTime.value = av.endTime.substring(0,5); }
    });
    await loadAvailability();
  }
});

// auto-lookup patient by cedula when typing in appointment form - DISABLED per request
// document.addEventListener('input', async (e) => {
//   if (e.target.matches('input[name="patientCedula"]')) {
//     const val = e.target.value.trim();
//     const form = e.target.closest('form'); if (!form) return;
//     const nameInput = form.querySelector('input[name="patientName"]');
//     const contactInput = form.querySelector('input[name="patientContact"]');
//     if (!val) return;
//     try {
//       const p = await api(`/patients/cedula/${encodeURIComponent(val)}`);
//       if (p) {
//         if (nameInput && !nameInput.value) nameInput.value = p.name || '';
//         if (contactInput && !contactInput.value) contactInput.value = p.contact || '';
//       }
//     } catch (_) {
//       // not found: do nothing
//     }
//   }
// });

// delegated click handler for the "Check" button next to cedula fields
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
