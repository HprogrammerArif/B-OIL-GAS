/**
 * BOGCL OneOps — Enterprise Operations & Governance Prototype Engine
 * Bashundhara Oil and Gas Company Limited (BOGCL)
 */

// Application State
const state = {
  currentRole: 'chairman',
  currentView: 'dashboard',
  lang: 'en', // 'en' | 'bn'
  notes: [
    {
      id: 1,
      author: 'Engr. Tariqul Islam',
      role: 'Chief Mechanical Engineer, Keraniganj Plant',
      date: '16 Oct 2026, 09:15 AM',
      text: 'Paragraph 1: Technical audit for high-pressure safety relief valve batch completed. Replacement required prior to DoE statutory inspection.',
      approved: true,
      chairman: false
    },
    {
      id: 2,
      author: 'Farida Begum',
      role: 'Head of Finance & Accounts',
      date: '16 Oct 2026, 11:30 AM',
      text: 'Paragraph 2: Proposed expenditure of ৳48,50,000 verified against FY26 Q4 Capex allocation for plant safety. Recommended for Chairman sign-off.',
      approved: true,
      chairman: false
    }
  ],
  licenses: [
    { id: 'L1', name: 'DoE Refinery Storage License', authority: 'Dept. of Explosives', stage: 1, daysLeft: 84, cost: '৳2,50,000' },
    { id: 'L2', name: 'BSTI Bitumen 60/70 Quality Cert', authority: 'BSTI Dhaka', stage: 2, daysLeft: 42, cost: '৳1,80,000' },
    { id: 'L3', name: 'Environmental Clearance (ECC)', authority: 'Dept. of Environment', stage: 3, daysLeft: 28, cost: '৳3,20,000' },
    { id: 'L4', name: 'Fire Safety Clearance Certificate', authority: 'Fire Service & Civil Defence', stage: 4, daysLeft: 12, cost: '৳95,000' },
    { id: 'L5', name: 'BIWTA River Jetty Mooring Permit', authority: 'BIWTA Riverine Division', stage: 5, daysLeft: 365, cost: '৳4,10,000' }
  ],
  busSeats: {
    total: 20,
    allocated: 20,
    route: 'Route 04: Uttara / Mirpur ➔ Keraniganj Bitumen Refinery',
    waitlist: [
      { rank: 1, name: 'Md. Al-Amin', dept: 'Lab QC', appliedDate: '12 Sep 2026', status: 'WAITLISTED' },
      { rank: 2, name: 'Sayed Shakil', dept: 'Procurement', appliedDate: '15 Sep 2026', status: 'WAITLISTED' },
      { rank: 3, name: 'Mustafizur Rahman', dept: 'Maintenance', appliedDate: '28 Sep 2026', status: 'WAITLISTED' }
    ]
  },
  parcels: [
    { id: 'BOGCL-EXP-9081', from: 'Keraniganj Lab', to: 'Baridhara HQ - Chairman Office', item: 'Refinery Bitumen Core Lab Specimen', status: 'IN_TRANSIT', holder: 'Pool Driver: Rafiqul Islam (CHA-11-2045)' },
    { id: 'BOGCL-EXP-9082', from: 'Finance Dept', to: 'BSTI Head Office, Tejgaon', item: 'Statutory Chalan & Renewal Dossier', status: 'DELIVERED', holder: 'Delivered (OTP Signed)' }
  ],
  incidents: [
    { id: 'INC-2026-041', title: 'LPG Transfer Pump Minor Seal Weep', severity: 'L2: Minor', plant: 'Keraniganj Unit-2', status: 'CAPA In Progress', reportedBy: 'Shift Supervisor Karim' },
    { id: 'INC-2026-039', title: 'Forklift Near-Miss at Warehouse Gate 3', severity: 'L1: Near Miss', plant: 'Central Depot', status: 'Resolved / Closed', reportedBy: 'Safety Officer Munir' }
  ]
};

// Role Metadata Definitions
const ROLES = {
  chairman: {
    name: 'Ahmed Akbar Sobhan',
    dept: "Chairman's Office",
    initials: 'AAS',
    title: 'Executive Command Center',
    subtitle: 'Real-time enterprise intelligence & multi-tier operational governance'
  },
  plant_gm: {
    name: 'Engr. Md. Harunur Rashid',
    dept: 'Keraniganj Bitumen Refinery',
    initials: 'HR',
    title: 'Plant Operations & Reliability Console',
    subtitle: 'Production continuous throughput, equipment calibration & HSE oversight'
  },
  transport_admin: {
    name: 'Md. Kamruzzaman',
    dept: 'Fleet & Logistics Division',
    initials: 'KZ',
    title: 'Transport Logistics Command',
    subtitle: 'Fleet allocation, commuter bus FIFO waitlist & vehicle telemetry'
  },
  hod: {
    name: 'Farida Begum',
    dept: 'Finance & Accounts Department',
    initials: 'FB',
    title: 'Department Governance Hub',
    subtitle: 'Multi-tier approval inbox, budget verification & note-sheet authorizations'
  },
  employee: {
    name: 'Tanvir Ahmed',
    dept: 'Sales & Distribution, Dhaka',
    initials: 'TA',
    title: 'Staff Self-Service Portal',
    subtitle: 'Personal attendance, bus seat requests, document tracking & travel claims'
  }
};

// Translations Dictionary
const I18N = {
  en: {
    broadcastBtn: 'Chairman Broadcast',
    langToggle: 'বাংলা',
    activeRole: 'Active Role',
    govSection: 'Governance & Command',
    opsSection: 'Operations & Logistics',
    safetySection: 'Workforce & Safety'
  },
  bn: {
    broadcastBtn: 'চেয়ারম্যান বার্তা',
    langToggle: 'English',
    activeRole: 'সক্রিয় ভূমিকা',
    govSection: 'গভর্ন্যান্স ও নেতৃত্ব',
    opsSection: 'অপারেশন ও লজিস্টিক্স',
    safetySection: 'কর্মীবাহিনী ও নিরাপত্তা'
  }
};

// Initialize DOM on Load
document.addEventListener('DOMContentLoaded', () => {
  initRoleSwitcher();
  initNavigation();
  initSignaturePad();
  renderCurrentView();
});

// Role Switcher Setup
function initRoleSwitcher() {
  document.querySelectorAll('.role-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedRole = btn.getAttribute('data-role');
      if (!selectedRole || !ROLES[selectedRole]) return;

      document.querySelectorAll('.role-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      state.currentRole = selectedRole;
      updateUserProfile();
      renderCurrentView();
      showToast(`Persona switched to: ${ROLES[selectedRole].name} (${ROLES[selectedRole].dept})`, 'info');
    });
  });
}

// Navigation Setup
function initNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      if (!view) return;

      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      state.currentView = view;
      renderCurrentView();
    });
  });
}

// Update User Profile in Topbar & Sidebar
function updateUserProfile() {
  const meta = ROLES[state.currentRole];
  const userAvatar = document.getElementById('user-avatar-initials');
  const userName = document.getElementById('user-display-name');
  const userDept = document.getElementById('user-display-dept');
  const currentRoleName = document.getElementById('current-role-name');

  if (userAvatar) userAvatar.textContent = meta.initials;
  if (userName) userName.textContent = meta.name;
  if (userDept) userDept.textContent = meta.dept;
  if (currentRoleName) currentRoleName.textContent = meta.name;
}

// Language Toggle
function toggleLanguage() {
  state.lang = state.lang === 'en' ? 'bn' : 'en';
  const label = document.getElementById('lang-label');
  if (label) label.textContent = I18N[state.lang].langToggle;
  showToast(state.lang === 'en' ? 'Language switched to English' : 'ভাষা পরিবর্তন: বাংলা সক্রিয়', 'info');
  renderCurrentView();
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function openBroadcastModal() {
  openModal('modal-broadcast');
}

function submitBroadcast() {
  const title = document.getElementById('broadcast-title-input')?.value || 'Milestone Announcement';
  closeModal('modal-broadcast');
  showToast(`Executive Broadcast Transmitted: "${title}" pushed to 1,240 employees`, 'gold');
}

function openCryptoCertModal() {
  openModal('modal-crypto-cert');
}

// Toast Notification Engine
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-card ${type === 'gold' ? 'toast-gold' : type === 'success' ? 'toast-success' : 'toast-info'}`;
  toast.style.cssText = `
    background: ${type === 'gold' ? 'linear-gradient(135deg, #0B132B 0%, #1E293B 100%)' : '#0B132B'};
    color: #FFFFFF;
    border-left: 4px solid ${type === 'gold' ? '#D4AF37' : type === 'success' ? '#059669' : '#A51C30'};
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    margin-top: 10px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
  `;
  toast.innerHTML = `<span>${type === 'gold' ? '👑' : type === 'success' ? '✓' : 'ℹ'}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Main Viewport Renderer
function renderCurrentView() {
  const container = document.getElementById('main-viewport');
  const pageTitle = document.getElementById('page-title');
  const pageSub = document.getElementById('page-subtitle');
  if (!container) return;

  switch (state.currentView) {
    case 'dashboard':
      if (pageTitle) pageTitle.textContent = ROLES[state.currentRole].title;
      if (pageSub) pageSub.textContent = ROLES[state.currentRole].subtitle;
      renderDashboardView(container);
      break;
    case 'notesheet':
      if (pageTitle) pageTitle.textContent = 'Digital Note-Sheet & Cryptographic E-Sign';
      if (pageSub) pageSub.textContent = 'DocuSign-grade file routing with SHA-256 seal & running departmental commentary';
      renderNotesheetView(container);
      break;
    case 'compliance':
      if (pageTitle) pageTitle.textContent = 'BSTI & Statutory Regulatory Compliance Pipeline';
      if (pageSub) pageSub.textContent = '5-Stage visual tracking: Fund Approval ➔ Application ➔ Inspection ➔ Audit ➔ License';
      renderComplianceView(container);
      break;
    case 'fleet':
      if (pageTitle) pageTitle.textContent = 'Fleet Operations & Vehicle Pooling Dispatch';
      if (pageSub) pageSub.textContent = 'Official travel requisitions, pool car assignment & smart passenger ride matching';
      renderFleetView(container);
      break;
    case 'bus':
      if (pageTitle) pageTitle.textContent = 'Employee Shuttle Bus Seat FIFO Waitlist';
      if (pageSub) pageSub.textContent = 'Transparent queue-based seat allocation with automated trickle-down vacancy cascade';
      renderBusView(container);
      break;
    case 'parcel':
      if (pageTitle) pageTitle.textContent = 'Chain-of-Custody Material & Parcel Tracker';
      if (pageSub) pageSub.textContent = 'Tamper-proof physical transit tracking from origin dispatcher to recipient OTP delivery';
      renderParcelView(container);
      break;
    case 'attendance':
      if (pageTitle) pageTitle.textContent = 'Geofenced Mobile Attendance & Shift Roster';
      if (pageSub) pageSub.textContent = 'Strict Haversine coordinate validation & anti-mock GPS enforcement';
      renderAttendanceView(container);
      break;
    case 'incident':
      if (pageTitle) pageTitle.textContent = 'HSE Incident Management & OSHA CAPA Register';
      if (pageSub) pageSub.textContent = 'Immediate safety hazard triage, 5-Why root cause analysis & corrective actions';
      renderIncidentView(container);
      break;
    default:
      renderDashboardView(container);
  }
}

// 1. Dashboard View
function renderDashboardView(container) {
  container.innerHTML = `
    <!-- Executive Alert Ribbon -->
    <div class="executive-alert-ribbon">
      <div class="alert-message-content">
        <span class="alert-icon-gold">👑</span>
        <div class="alert-text-body">
          <h4>Chairman's Priority Directive: Zero-Accident Milestone Commendation</h4>
          <p>Keraniganj Bitumen Refinery complex achieves 180 consecutive days without Lost-Time Injury (LTI). Compliance bonuses released.</p>
        </div>
      </div>
      <button class="alert-action-btn" onclick="openCryptoCertModal()">View Signed Memo</button>
    </div>

    <!-- 4 Key Stat Cards -->
    <div class="stats-grid">
      <div class="stat-card gold">
        <div class="stat-top">
          <span class="stat-label">Pending E-Sign Documents</span>
          <span class="stat-icon" style="color:var(--brand-gold);">📋</span>
        </div>
        <div class="stat-value">5</div>
        <div class="stat-subtext"><span class="stat-trend-up">৳48.5L</span> highest Capex authorization</div>
      </div>

      <div class="stat-card">
        <div class="stat-top">
          <span class="stat-label">BSTI & Regulatory Health</span>
          <span class="stat-icon" style="color:var(--brand-crimson);">🛡️</span>
        </div>
        <div class="stat-value">100%</div>
        <div class="stat-subtext">5 of 5 statutory licenses in active green status</div>
      </div>

      <div class="stat-card green">
        <div class="stat-top">
          <span class="stat-label">Keraniganj Plant Headcount</span>
          <span class="stat-icon" style="color:var(--status-success);">👥</span>
        </div>
        <div class="stat-value">482 / 510</div>
        <div class="stat-subtext"><span class="stat-trend-up">94.5%</span> geofenced verified presence</div>
      </div>

      <div class="stat-card blue">
        <div class="stat-top">
          <span class="stat-label">Fleet Pool Cars Active</span>
          <span class="stat-icon" style="color:var(--status-info);">🚚</span>
        </div>
        <div class="stat-value">18 / 22</div>
        <div class="stat-subtext">4 pool vehicles on Keraniganj highway route</div>
      </div>
    </div>

    <!-- Two Columns Layout -->
    <div class="dashboard-columns">
      <!-- Left: Recent Note-Sheets for Approval -->
      <div class="surface-card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Urgent Inter-Office File Notes & Approvals</h3>
            <p>Documents requiring your digital signature or concurrence</p>
          </div>
          <button class="btn-secondary" onclick="document.getElementById('nav-notesheet').click()">Open Note-Sheet</button>
        </div>
        <div class="card-body">
          <table class="doc-itemized-table">
            <thead>
              <tr>
                <th>File No</th>
                <th>Subject</th>
                <th>Initiator</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="doc-file-number">BOGCL/PROC/2026/0894</span></td>
                <td><strong>Keraniganj High-Pressure Safety Valves Batch</strong></td>
                <td>Engr. Tariqul Islam</td>
                <td><strong>৳48,50,000</strong></td>
                <td><button class="btn-primary-crimson" style="padding:4px 10px; font-size:11px;" onclick="document.getElementById('nav-notesheet').click()">Review & E-Sign</button></td>
              </tr>
              <tr>
                <td><span class="doc-file-number">BOGCL/COMP/2026/0112</span></td>
                <td>BSTI Bitumen 60/70 Annual Audit Fund Disbursement</td>
                <td>Farida Begum (Finance)</td>
                <td><strong>৳1,80,000</strong></td>
                <td><button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="showToast('File forwarded to Compliance Officer', 'info')">Forward</button></td>
              </tr>
              <tr>
                <td><span class="doc-file-number">BOGCL/HSE/2026/0045</span></td>
                <td>Refinery Flare Stack Sensor Calibration Requisition</td>
                <td>Plant GM Harunur Rashid</td>
                <td><strong>৳8,20,000</strong></td>
                <td><button class="btn-secondary" style="padding:4px 10px; font-size:11px;" onclick="showToast('Approved & dispatched to procurement', 'success')">Approve</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right: Chairman Inner Circle Real-Time Roster -->
      <div class="surface-card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Inner Circle Presence</h3>
            <p>Executive leadership live operational status</p>
          </div>
          <span style="font-size:10px; color:var(--brand-gold); font-weight:700;">LIVE DCS</span>
        </div>
        <div class="card-body">
          <div class="inner-circle-list">
            <div class="presence-item">
              <div class="presence-person">
                <div class="presence-avatar" style="background:#A51C30;">AAS</div>
                <div class="presence-details">
                  <div class="name">Ahmed Akbar Sobhan</div>
                  <div class="role">Chairman & Managing Director</div>
                </div>
              </div>
              <span class="status-badge present">HQ Command</span>
            </div>

            <div class="presence-item">
              <div class="presence-person">
                <div class="presence-avatar" style="background:#0284C7;">HR</div>
                <div class="presence-details">
                  <div class="name">Engr. Md. Harunur Rashid</div>
                  <div class="role">Plant General Manager</div>
                </div>
              </div>
              <span class="status-badge present">Keraniganj Plant</span>
            </div>

            <div class="presence-item">
              <div class="presence-person">
                <div class="presence-avatar" style="background:#7C3AED;">FB</div>
                <div class="presence-details">
                  <div class="name">Farida Begum</div>
                  <div class="role">Head of Finance & Accounts</div>
                </div>
              </div>
              <span class="status-badge meeting">In Board Meeting</span>
            </div>

            <div class="presence-item">
              <div class="presence-person">
                <div class="presence-avatar" style="background:#059669;">KZ</div>
                <div class="presence-details">
                  <div class="name">Md. Kamruzzaman</div>
                  <div class="role">Transport & Admin Supervisor</div>
                </div>
              </div>
              <span class="status-badge travel">Plant Transit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 2. Note-Sheet & E-Sign View
function renderNotesheetView(container) {
  const notesHtml = state.notes.map(n => `
    <div class="note-paragraph ${n.approved ? 'approved' : ''} ${n.chairman ? 'chairman-note' : ''}">
      <div class="note-meta">
        <div>
          <span class="note-author">${n.author}</span>
          <span class="note-author-role"> • ${n.role}</span>
        </div>
        <span class="note-date">${n.date}</span>
      </div>
      <div class="note-text">${n.text}</div>
      <div class="note-signature-seal">
        <span>✓ Digitally Endorsed with SHA-256 Seal</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="notesheet-container">
      <!-- Left: Official Document Preview -->
      <div class="surface-card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Procurement Requisition Dossier</h3>
            <p>File No: BOGCL/PROC/2026/0894</p>
          </div>
          <button class="btn-secondary" onclick="openCryptoCertModal()">View Legal Certificate</button>
        </div>
        <div class="card-body">
          <div class="document-preview-box">
            <div class="doc-official-letterhead">
              <div class="letterhead-title">
                <h3>BASHUNDHARA OIL AND GAS COMPANY LIMITED</h3>
                <p>Engineering & Plant Procurement Wing — Keraniganj Bitumen Refinery</p>
              </div>
              <span class="doc-file-number">BOGCL/PROC/2026/0894</span>
            </div>

            <div class="doc-body-text">
              <strong>SUBJECT: Requisition for Emergency High-Pressure Safety Relief Valves for Bitumen Blending Unit-02</strong>
              <p style="margin-top:8px;">
                As per the mandatory bi-annual industrial safety protocol and Department of Explosives (DoE) statutory compliance guidelines, the high-pressure relief valves installed on Bitumen Blending Reactor Line-2 have achieved 92% of operational service life. Replacement is urgently mandated prior to the upcoming DoE statutory inspection.
              </p>
            </div>

            <table class="doc-itemized-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Spec / Rating</th>
                  <th>Qty</th>
                  <th>Est. Cost (BDT)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Safety Relief Valve DN50</td>
                  <td>Class 300 / ASME B16.34</td>
                  <td>4 Units</td>
                  <td>৳28,00,000</td>
                </tr>
                <tr>
                  <td>Hydrostatic Calibration Gaskets</td>
                  <td>Spiral Wound SS316</td>
                  <td>12 Sets</td>
                  <td>৳4,50,000</td>
                </tr>
                <tr>
                  <td>Certified Calibration Inspection</td>
                  <td>Bureau Veritas / BSTI</td>
                  <td>1 Lot</td>
                  <td>৳16,00,000</td>
                </tr>
                <tr style="font-weight:700; background:var(--brand-slate-100);">
                  <td colspan="3" style="text-align:right;">Total Financial Outlay:</td>
                  <td style="color:var(--brand-crimson);">৳48,50,000</td>
                </tr>
              </tbody>
            </table>

            <div class="crypto-certificate-pill" onclick="openCryptoCertModal()" style="cursor:pointer;">
              <span>🛡️</span>
              <div>
                <strong>Cryptographic SHA-256 Tamper-Proof Seal:</strong>
                <div class="crypto-hash-text">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Departmental Running Note-Sheet Commentary & E-Sign -->
      <div class="surface-card">
        <div class="card-header">
          <div class="card-title-group">
            <h3>Departmental Note-Sheet & E-Signature</h3>
            <p>Chronological running commentary from reviewing officers</p>
          </div>
          <span style="font-size:11px; color:var(--status-success); font-weight:700;">2 Signatures Affixed</span>
        </div>
        <div class="card-body">
          <div class="notesheet-trail" id="notes-trail-box">
            ${notesHtml}
          </div>

          <!-- Signature Pad Area -->
          <div class="signature-action-area">
            <label style="font-size:12px; font-weight:700; color:var(--brand-slate-800); display:block;">
              Affix Your Digital Signature as: <span style="color:var(--brand-crimson);">${ROLES[state.currentRole].name}</span>
            </label>
            <div class="sig-canvas-wrapper">
              <canvas id="signature-canvas"></canvas>
              <span class="sig-placeholder-hint" id="sig-hint">Sign here using mouse or touchscreen...</span>
            </div>

            <div style="margin-bottom:12px;">
              <input type="text" id="new-note-text" placeholder="Add your paragraph observations (e.g., 'Approved. Proceed with procurement')..." style="width:100%; padding:8px 12px; border:1px solid var(--brand-slate-200); border-radius:6px; font-size:12px;">
            </div>

            <div class="sig-controls">
              <button class="btn-secondary" onclick="clearSignatureCanvas()">Clear Signature</button>
              <button class="btn-primary-crimson" onclick="submitNoteAndSign()">Affix E-Signature & Endorse</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(initSignaturePad, 50);
}

// Signature Canvas Utilities
let canvasRef = null;
let isDrawing = false;

function initSignaturePad() {
  const canvas = document.getElementById('signature-canvas');
  if (!canvas) return;
  canvasRef = canvas;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  ctx.strokeStyle = '#0B132B';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';

  const hint = document.getElementById('sig-hint');

  const startDraw = (e) => {
    isDrawing = true;
    if (hint) hint.style.display = 'none';
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => { isDrawing = false; };

  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDraw);
  canvas.addEventListener('mouseleave', stopDraw);

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    isDrawing = true;
    if (hint) hint.style.display = 'none';
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  });
  canvas.addEventListener('touchend', stopDraw);
}

function clearSignatureCanvas() {
  if (!canvasRef) return;
  const ctx = canvasRef.getContext('2d');
  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  const hint = document.getElementById('sig-hint');
  if (hint) hint.style.display = 'block';
}

function submitNoteAndSign() {
  const noteInput = document.getElementById('new-note-text');
  const text = noteInput?.value.trim() || `Approved and endorsed by ${ROLES[state.currentRole].name}.`;

  const newNote = {
    id: state.notes.length + 1,
    author: ROLES[state.currentRole].name,
    role: ROLES[state.currentRole].dept,
    date: 'Just now',
    text: `Paragraph ${state.notes.length + 1}: ${text}`,
    approved: true,
    chairman: state.currentRole === 'chairman'
  };

  state.notes.push(newNote);
  showToast(`E-Signature Affixed! Note-Sheet updated with SHA-256 seal.`, 'success');
  renderNotesheetView(document.getElementById('main-viewport'));
}

// 3. 5-Stage BSTI Compliance View
function renderComplianceView(container) {
  const stages = [
    { num: 1, name: '1. Fund Approval' },
    { num: 2, name: '2. Application Filed' },
    { num: 3, name: '3. Inspection Scheduled' },
    { num: 4, name: '4. Audit & Chalan' },
    { num: 5, name: '5. Renewed & Sealed' }
  ];

  const columnsHtml = stages.map(st => {
    const cards = state.licenses.filter(l => l.stage === st.num);
    return `
      <div class="kanban-column">
        <div class="kanban-col-header">
          <h4>${st.name}</h4>
          <span class="col-count-pill">${cards.length}</span>
        </div>
        <div class="kanban-card-list">
          ${cards.map(c => `
            <div class="license-kanban-card">
              <span class="license-card-tag" style="background:var(--brand-slate-200); color:var(--brand-slate-800);">${c.authority}</span>
              <h4 style="font-size:13px; font-weight:700; margin:6px 0 4px; color:var(--brand-slate-900);">${c.name}</h4>
              <div style="font-size:11px; color:var(--brand-slate-400); margin-bottom:8px;">Fees: <strong style="color:var(--brand-crimson);">${c.cost}</strong></div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:700; color:${c.daysLeft < 30 ? 'var(--status-danger)' : 'var(--brand-gold-dark)'};">
                  ⏱ ${c.daysLeft} days left
                </span>
                <button class="btn-secondary" style="padding:2px 8px; font-size:10px;" onclick="advanceLicenseStage('${c.id}')">Advance ➔</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div>
        <h3 style="font-size:16px; font-weight:700; color:var(--brand-slate-900);">5-Step Statutory License Renewal Pipeline</h3>
        <p style="font-size:12px; color:var(--brand-slate-400);">Automated cascade: Fund Approval ➔ Application ➔ Site Inspection ➔ Audit ➔ Issuance</p>
      </div>
      <button class="btn-primary-crimson" onclick="addNewLicensePrompt()">+ Register New Statutory Permit</button>
    </div>
    <div class="kanban-board-container">
      ${columnsHtml}
    </div>
  `;
}

function advanceLicenseStage(id) {
  const lic = state.licenses.find(l => l.id === id);
  if (!lic) return;
  if (lic.stage < 5) {
    lic.stage += 1;
    showToast(`${lic.name} advanced to Stage ${lic.stage}!`, 'success');
  } else {
    showToast(`${lic.name} is already renewed & officially sealed!`, 'info');
  }
  renderComplianceView(document.getElementById('main-viewport'));
}

function addNewLicensePrompt() {
  const name = prompt('Enter Statutory License / Permit Name (e.g. BSTI Calibration Certificate):');
  if (!name) return;
  state.licenses.push({
    id: 'L' + (state.licenses.length + 1),
    name,
    authority: 'Government Directorate',
    stage: 1,
    daysLeft: 90,
    cost: '৳1,50,000'
  });
  showToast(`Registered new permit: ${name} (Stage 1: Fund Approval)`, 'success');
  renderComplianceView(document.getElementById('main-viewport'));
}

// 4. Fleet View
function renderFleetView(container) {
  container.innerHTML = `
    <div class="surface-card">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Official Fleet Requisition & Ride-Pooling Dispatch</h3>
          <p>Book pool cars or view available vehicles and driver assignments</p>
        </div>
        <button class="btn-primary-crimson" onclick="submitRequisitionPrompt()">+ Request Pool Car</button>
      </div>
      <div class="card-body">
        <table class="doc-itemized-table">
          <thead>
            <tr>
              <th>Vehicle Plate</th>
              <th>Model / Type</th>
              <th>Assigned Driver</th>
              <th>Status</th>
              <th>Current Route / Mission</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>ঢাকা মেট্রো-চ-১১-২০৪৫</strong></td>
              <td>Toyota HiAce (14 Seater)</td>
              <td>Md. Rafiqul Islam (+880 1712-112233)</td>
              <td><span class="status-badge travel">In Transit</span></td>
              <td>Baridhara HQ ➔ Keraniganj Bitumen Refinery (Pooled: 4 Officers)</td>
              <td><button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="showToast('GPS Telemetry: 42 km/h on Postogola Bridge', 'info')">Track GPS</button></td>
            </tr>
            <tr>
              <td><strong>ঢাকা মেট্রো-ঘ-১৪-৮৮৯২</strong></td>
              <td>Toyota Corolla Altis</td>
              <td>Kalam Hossain (+880 1718-445566)</td>
              <td><span class="status-badge present">Available Pool</span></td>
              <td>Stationed at Baridhara Corporate Garage</td>
              <td><button class="btn-primary-crimson" style="padding:4px 8px; font-size:11px;" onclick="showToast('Vehicle allocated to your mission', 'success')">Assign Car</button></td>
            </tr>
            <tr>
              <td><strong>ঢাকা মেট্রো-ট-১৮-৩৪০১</strong></td>
              <td>Isuzu 5-Ton Material Truck</td>
              <td>Jahangir Alam (+880 1819-223344)</td>
              <td><span class="status-badge meeting">Loading Refinery</span></td>
              <td>Keraniganj Depot ➔ Chittagong Coastal Terminal</td>
              <td><button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="showToast('Manifest: 25 Drums Asphalt Grade 60/70', 'info')">Manifest</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function submitRequisitionPrompt() {
  const dest = prompt('Enter Destination & Official Purpose (e.g., Keraniganj Plant - Site Inspection):');
  if (!dest) return;
  showToast(`Vehicle Requisition Submitted for: "${dest}". Transport Admin notified.`, 'success');
}

// 5. Bus Seat FIFO Waitlist View
function renderBusView(container) {
  const seatsGrid = Array.from({ length: 20 }, (_, i) => {
    const isOccupied = i < 19;
    return `
      <div style="padding:10px; border-radius:6px; text-align:center; background:${isOccupied ? 'var(--brand-slate-100)' : '#ECFDF5'}; border:1px solid ${isOccupied ? 'var(--brand-slate-200)' : '#059669'};">
        <div style="font-size:10px; color:var(--brand-slate-400);">Seat #${i + 1}</div>
        <div style="font-size:12px; font-weight:700; color:${isOccupied ? 'var(--brand-slate-800)' : '#059669'};">${isOccupied ? 'Occupied' : 'VACANT'}</div>
      </div>
    `;
  }).join('');

  const waitlistHtml = state.busSeats.waitlist.map(w => `
    <tr>
      <td><strong>#${w.rank}</strong></td>
      <td>${w.name}</td>
      <td>${w.dept}</td>
      <td>${w.appliedDate}</td>
      <td><span class="status-badge travel">${w.status}</span></td>
      <td>
        ${w.rank === 1 ? `<button class="btn-primary-crimson" style="padding:3px 8px; font-size:11px;" onclick="simulateCascade()">Allocate Vacant Seat</button>` : `<span style="font-size:11px; color:var(--brand-slate-400);">Queued</span>`}
      </td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="surface-card" style="margin-bottom:24px;">
      <div class="card-header">
        <div class="card-title-group">
          <h3>${state.busSeats.route}</h3>
          <p>Capacity: 20 Seats | Active Commuters: 19 | Waitlist Queue: ${state.busSeats.waitlist.length}</p>
        </div>
        <button class="btn-secondary" onclick="joinBusWaitlistPrompt()">+ Apply for Route Seat</button>
      </div>
      <div class="card-body">
        <div style="display:grid; grid-template-columns:repeat(10, 1fr); gap:10px; margin-bottom:24px;">
          ${seatsGrid}
        </div>
      </div>
    </div>

    <div class="surface-card">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Transparent FIFO Application Waitlist</h3>
          <p>Strict timestamp-based queue with automated trickle-down reallocation on vacancy</p>
        </div>
      </div>
      <div class="card-body">
        <table class="doc-itemized-table">
          <thead>
            <tr>
              <th>Queue Rank</th>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Application Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${waitlistHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function simulateCascade() {
  const top = state.busSeats.waitlist.shift();
  if (!top) return;
  showToast(`Seat #20 officially assigned to ${top.name} (Rank #1 FIFO)! Next in line updated.`, 'gold');
  renderBusView(document.getElementById('main-viewport'));
}

function joinBusWaitlistPrompt() {
  const name = prompt('Enter your name to join Route 04 Waitlist Queue:');
  if (!name) return;
  state.busSeats.waitlist.push({
    rank: state.busSeats.waitlist.length + 1,
    name,
    dept: ROLES[state.currentRole].dept,
    appliedDate: 'Just now',
    status: 'WAITLISTED'
  });
  showToast(`Added to waitlist! Your position is #${state.busSeats.waitlist.length}`, 'success');
  renderBusView(document.getElementById('main-viewport'));
}

// 6. Parcel Tracking View
function renderParcelView(container) {
  const list = state.parcels.map(p => `
    <tr>
      <td><span class="doc-file-number">${p.id}</span></td>
      <td>${p.item}</td>
      <td>${p.from}</td>
      <td>${p.to}</td>
      <td><strong>${p.holder}</strong></td>
      <td><span class="status-badge ${p.status === 'DELIVERED' ? 'present' : 'travel'}">${p.status}</span></td>
      <td><button class="btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="showToast('Chain of Custody verified for ${p.id}', 'info')">QR Audit</button></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="surface-card">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Chain-of-Custody Material & Document Parcel Tracker</h3>
          <p>Scan checkpoints from dispatch origin to final recipient OTP confirmation</p>
        </div>
        <button class="btn-primary-crimson" onclick="newParcelPrompt()">+ Dispatch New Parcel</button>
      </div>
      <div class="card-body">
        <table class="doc-itemized-table">
          <thead>
            <tr>
              <th>Tracking ID</th>
              <th>Package Contents</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Current Custodian</th>
              <th>Status</th>
              <th>Audit</th>
            </tr>
          </thead>
          <tbody>
            ${list}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function newParcelPrompt() {
  const item = prompt('Enter item name or confidential file description:');
  if (!item) return;
  state.parcels.push({
    id: `BOGCL-EXP-${Math.floor(1000 + Math.random() * 9000)}`,
    from: 'Baridhara HQ',
    to: 'Keraniganj Plant',
    item,
    status: 'DISPATCHED',
    holder: 'Reception Mailroom Runner'
  });
  showToast(`New parcel registered! QR label generated.`, 'success');
  renderParcelView(document.getElementById('main-viewport'));
}

// 7. Attendance View
function renderAttendanceView(container) {
  container.innerHTML = `
    <div class="surface-card">
      <div class="card-header">
        <div class="card-title-group">
          <h3>Geofenced Mobile Attendance Terminal</h3>
          <p>Haversine formula GPS validation (23.6821° N, 90.3541° E)</p>
        </div>
        <button class="btn-primary-crimson" onclick="simulateGeoPunch()">📍 Simulate Punch In</button>
      </div>
      <div class="card-body">
        <div style="background:#FAFAFC; border:1px solid var(--brand-slate-200); padding:20px; border-radius:8px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-size:11px; color:var(--brand-slate-400); text-transform:uppercase; font-weight:700;">Designated Geofence Perimeter</div>
            <div style="font-size:15px; font-weight:700; color:var(--brand-slate-900);">Keraniganj Bitumen Refinery & HQ Campus</div>
            <div style="font-size:12px; color:var(--status-success); margin-top:4px;">✓ Current GPS Distance: 34 meters (Within 100m Allowed Perimeter)</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:24px; font-weight:800; color:var(--brand-crimson);" id="clock-display">09:42 AM</div>
            <span class="status-badge present">Anti-Spoof GPS Verified</span>
          </div>
        </div>

        <table class="doc-itemized-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Check-In Time</th>
              <th>Punch Method</th>
              <th>GPS Accuracy</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Engr. Md. Harunur Rashid</td>
              <td>Plant General Manager</td>
              <td>08:14 AM</td>
              <td>Geofenced Mobile App</td>
              <td>± 4 meters</td>
              <td><span class="status-badge present">On Duty</span></td>
            </tr>
            <tr>
              <td>Sayed Shakil</td>
              <td>Senior Chemist, Refinery Lab</td>
              <td>08:32 AM</td>
              <td>Biometric Gate Terminal</td>
              <td>Plant Entrance #1</td>
              <td><span class="status-badge present">On Duty</span></td>
            </tr>
            <tr>
              <td>Tanvir Ahmed</td>
              <td>Sales Specialist</td>
              <td>09:05 AM</td>
              <td>Field Duty (OD) Mode</td>
              <td>Approved Client Site</td>
              <td><span class="status-badge travel">Field Duty</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function simulateGeoPunch() {
  showToast(`Attendance Verified! Punch In recorded at 23.6821° N, 90.3541° E (Keraniganj Refinery).`, 'success');
}

// 8. Incident View
function renderIncidentView(container) {
  const incs = state.incidents.map(i => `
    <tr>
      <td><span class="doc-file-number">${i.id}</span></td>
      <td><strong>${i.title}</strong></td>
      <td><span class="status-badge ${i.severity.includes('L2') ? 'leave' : 'present'}">${i.severity}</span></td>
      <td>${i.plant}</td>
      <td>${i.reportedBy}</td>
      <td><span class="status-badge travel">${i.status}</span></td>
      <td><button class="btn-secondary" style="padding:3px 8px; font-size:11px;" onclick="showToast('CAPA Action Plan: Replaced mechanical seal ring and inspected gaskets', 'info')">CAPA Details</button></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="surface-card">
      <div class="card-header">
        <div class="card-title-group">
          <h3>HSE Incident Reporting & OSHA CAPA Register</h3>
          <p>Zero-Harm safety enforcement with 5-Why root cause analysis</p>
        </div>
        <button class="btn-primary-crimson" onclick="reportIncidentPrompt()">+ Report Safety Incident</button>
      </div>
      <div class="card-body">
        <table class="doc-itemized-table">
          <thead>
            <tr>
              <th>Incident No</th>
              <th>Incident Title</th>
              <th>Severity Grade</th>
              <th>Location</th>
              <th>Reported By</th>
              <th>Investigation Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${incs}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function reportIncidentPrompt() {
  const title = prompt('Enter brief incident description (e.g., Minor chemical splash during lab sampling):');
  if (!title) return;
  state.incidents.unshift({
    id: `INC-2026-0${Math.floor(50 + Math.random() * 50)}`,
    title,
    severity: 'L1: Near Miss',
    plant: 'Keraniganj Bitumen Refinery',
    status: 'Triage Pending',
    reportedBy: ROLES[state.currentRole].name
  });
  showToast(`HSE Incident logged! Plant Safety Officer alerted for immediate triage.`, 'gold');
  renderIncidentView(document.getElementById('main-viewport'));
}
