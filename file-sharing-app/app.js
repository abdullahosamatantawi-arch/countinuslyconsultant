/* ============================================================
   FILE SHARING APP — Application Logic
   دائرة الشؤون الإسلامية بالشارقة
   ============================================================ */

// ── Department Configuration ──────────────────────────────────
const DEPARTMENTS = {
    head: { name: 'مكتب رئيس الدائرة', short: 'رد', color: '#6366f1', password: 'head123', email: 'head@iauae.ae' },
    it: { name: 'مكتب تقنية المعلومات', short: 'تم', color: '#3b82f6', password: 'it123', email: 'it@iauae.ae' },
    engineering: { name: 'مكتب القسم الهندسي', short: 'هن', color: '#10b981', password: 'eng123', email: 'engineering@iauae.ae' },
    finance: { name: 'مكتب القسم المالي', short: 'مل', color: '#f59e0b', password: 'fin123', email: 'finance@iauae.ae' },
    procurement: { name: 'قسم المشتريات', short: 'مش', color: '#8b5cf6', password: 'proc123', email: 'procurement@iauae.ae' }
};

const WEBHOOK_URL = 'https://n8n.srv968918.hstgr.cloud/webhook-test/share_files_app';

// ── State ─────────────────────────────────────────────────────
let currentUser = null;
let currentView = 'inbox';
let messages = [];
let attachedFilesBuffer = [];
let currentEditingMessageId = null;
let currentEditingFileIndex = null;

// ── Initialize ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    setupEventListeners();
    checkLoginState();
});

function loadState() {
    const saved = localStorage.getItem('fileShareMessages');
    if (saved) {
        try { messages = JSON.parse(saved); } catch (e) { messages = []; }
    }
    const user = localStorage.getItem('fileShareUser');
    if (user) {
        try { currentUser = JSON.parse(user); } catch (e) { currentUser = null; }
    }
}

function saveState() {
    localStorage.setItem('fileShareMessages', JSON.stringify(messages));
    if (currentUser) {
        localStorage.setItem('fileShareUser', JSON.stringify(currentUser));
    }
}

function checkLoginState() {
    if (currentUser) showMainApp();
}

// ── Event Listeners ───────────────────────────────────────────
function setupEventListeners() {
    // Login — no employee name, just department + password
    const deptSelect = document.getElementById('departmentSelect');
    const loginPassword = document.getElementById('loginPassword');
    const loginBtn = document.getElementById('loginBtn');

    const validateLogin = () => {
        loginBtn.disabled = !(deptSelect.value && loginPassword.value.trim());
        document.getElementById('loginError').classList.add('hidden');
    };

    deptSelect.addEventListener('change', validateLogin);
    loginPassword.addEventListener('input', validateLogin);
    loginBtn.addEventListener('click', handleLogin);

    loginPassword.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !loginBtn.disabled) handleLogin();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => switchView(item.dataset.view));
    });

    // Compose
    document.getElementById('composeBtn').addEventListener('click', openComposeModal);
    document.getElementById('closeCompose').addEventListener('click', () => closeModal('composeModal'));
    document.getElementById('cancelCompose').addEventListener('click', () => closeModal('composeModal'));
    document.getElementById('sendMessage').addEventListener('click', handleSendMessage);

    // File Upload
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('fileInput');

    fileUploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('dragover');
    });
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('dragover');
    });
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('dragover');
        handleFilesDrop(e.dataTransfer.files);
    });

    // Editor
    document.getElementById('closeEditor').addEventListener('click', () => closeModal('editorModal'));
    document.getElementById('cancelEdit').addEventListener('click', () => closeModal('editorModal'));
    document.getElementById('saveEdit').addEventListener('click', handleSaveEdit);
}

// ── Login/Logout ──────────────────────────────────────────────
function handleLogin() {
    const dept = document.getElementById('departmentSelect').value;
    const password = document.getElementById('loginPassword').value.trim();
    if (!dept || !password) return;

    const deptConfig = DEPARTMENTS[dept];
    if (password !== deptConfig.password) {
        const errorEl = document.getElementById('loginError');
        errorEl.classList.remove('hidden');
        document.getElementById('loginErrorText').textContent = 'كلمة المرور غير صحيحة';
        errorEl.style.animation = 'none';
        errorEl.offsetHeight;
        errorEl.style.animation = '';
        return;
    }

    // Use department name as the user name
    currentUser = { department: dept, name: deptConfig.name };
    saveState();
    showMainApp();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('fileShareUser');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('departmentSelect').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginError').classList.add('hidden');
}

function showMainApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');

    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userDept').textContent = DEPARTMENTS[currentUser.department].name;
    document.getElementById('userAvatar').textContent = DEPARTMENTS[currentUser.department].short;

    switchView('inbox');
}

// ── Navigation ────────────────────────────────────────────────
function switchView(view) {
    currentView = view;

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));

    const titles = {
        inbox: 'الوارد',
        sent: 'الصادر',
        routing: 'التحويلات',
        files: 'الملفات'
    };

    document.getElementById('viewTitle').textContent = titles[view] || 'الوارد';

    if (view === 'inbox') {
        document.getElementById('inboxView').classList.add('active');
        renderInbox();
    } else if (view === 'sent') {
        document.getElementById('sentView').classList.add('active');
        renderSent();
    } else if (view === 'routing') {
        document.getElementById('routingView').classList.add('active');
        renderRouting();
    } else if (view === 'files') {
        document.getElementById('filesView').classList.add('active');
        renderFiles();
    }

    updateBadges();
}

// ── Message Rendering ─────────────────────────────────────────
function renderInbox() {
    const list = document.getElementById('inboxList');
    const inbox = messages.filter(m => m.recipient === currentUser.department);

    if (inbox.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
                <p>لا توجد رسائل واردة</p>
            </div>`;
        document.getElementById('messageCount').textContent = '';
        return;
    }

    document.getElementById('messageCount').textContent = `${inbox.length} رسالة`;
    list.innerHTML = inbox.map(m => renderMessageCard(m, true)).join('');
    list.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', () => openMessageDetail(card.dataset.id));
    });
}

function renderSent() {
    const list = document.getElementById('sentList');
    const sent = messages.filter(m => m.sender.department === currentUser.department);

    if (sent.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                <p>لا توجد رسائل صادرة</p>
            </div>`;
        document.getElementById('messageCount').textContent = '';
        return;
    }

    document.getElementById('messageCount').textContent = `${sent.length} رسالة`;
    list.innerHTML = sent.map(m => renderMessageCard(m, false)).join('');
    list.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', () => openMessageDetail(card.dataset.id));
    });
}

function renderRouting() {
    const list = document.getElementById('routingList');
    const routing = messages.filter(m =>
        m.sender.department === currentUser.department || m.recipient === currentUser.department
    );

    if (routing.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/></svg>
                <p>لا توجد تحويلات</p>
            </div>`;
        document.getElementById('messageCount').textContent = '';
        return;
    }

    document.getElementById('messageCount').textContent = `${routing.length} تحويل`;
    list.innerHTML = routing.map(m => renderMessageCard(m, false)).join('');
    list.querySelectorAll('.message-card').forEach(card => {
        card.addEventListener('click', () => openMessageDetail(card.dataset.id));
    });
}

function renderMessageCard(msg, showUnread = false) {
    const senderDept = DEPARTMENTS[msg.sender.department];
    const recipientDept = DEPARTMENTS[msg.recipient];
    const isUnread = showUnread && !msg.readBy?.includes(currentUser.department);
    const timeStr = formatTime(msg.createdAt);

    let metaHtml = '';
    if (msg.priority === 'high') {
        metaHtml += '<span class="msg-tag tag-priority-high">مستعجل</span>';
    } else if (msg.priority === 'urgent') {
        metaHtml += '<span class="msg-tag tag-priority-urgent">عاجل جداً</span>';
    }

    if (msg.files && msg.files.length > 0) {
        metaHtml += `<span class="msg-tag tag-files">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
            ${msg.files.length} ملف
        </span>`;
    }

    const flowText = `من ${senderDept.name} إلى ${recipientDept.name}`;

    return `
        <div class="message-card ${isUnread ? 'unread' : ''}" data-id="${msg.id}">
            <div class="msg-avatar dept-${msg.sender.department}">${senderDept.short}</div>
            <div class="msg-body-content">
                <div class="msg-header">
                    <span class="msg-sender">${senderDept.name}</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-subject">${escapeHtml(msg.subject)}</div>
                <div class="msg-preview" style="color:var(--accent-light);font-weight:500;margin-bottom:2px">${flowText}</div>
                <div class="msg-preview">${escapeHtml(msg.body.substring(0, 100))}</div>
                ${metaHtml ? `<div class="msg-meta">${metaHtml}</div>` : ''}
            </div>
        </div>`;
}

// ── Message Detail ────────────────────────────────────────────
function openMessageDetail(id) {
    const msg = messages.find(m => m.id === id);
    if (!msg) return;

    if (!msg.readBy) msg.readBy = [];
    if (!msg.readBy.includes(currentUser.department)) {
        msg.readBy.push(currentUser.department);
        saveState();
    }

    const senderDept = DEPARTMENTS[msg.sender.department];
    const recipientDept = DEPARTMENTS[msg.recipient];
    const detail = document.getElementById('messageDetail');

    let attachmentsHtml = '';
    if (msg.files && msg.files.length > 0) {
        attachmentsHtml = `
            <div class="detail-attachments">
                <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                    المرفقات (${msg.files.length})
                </h3>
                <div class="attachment-list">
                    ${msg.files.map((f, i) => renderAttachmentItem(f, i, msg.id)).join('')}
                </div>
            </div>`;
    }

    detail.innerHTML = `
        <button class="detail-back" id="backToList">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            <span>العودة للقائمة</span>
        </button>
        <div class="detail-card">
            <div class="detail-header">
                <div class="msg-avatar dept-${msg.sender.department}" style="width:48px;height:48px;font-size:1rem;">${senderDept.short}</div>
                <div class="detail-info">
                    <div class="detail-subject">${escapeHtml(msg.subject)}</div>
                    <div class="detail-sender-info">من: ${senderDept.name}</div>
                    <div class="detail-sender-info" style="color:var(--accent-light)">إلى: ${recipientDept.name}</div>
                </div>
                <div class="detail-date">${formatDate(msg.createdAt)}</div>
            </div>
            <div class="detail-body">${escapeHtml(msg.body)}</div>
            ${attachmentsHtml}
        </div>
    `;

    document.querySelectorAll('.content-view').forEach(v => v.classList.remove('active'));
    document.getElementById('messageDetailView').classList.add('active');
    document.getElementById('viewTitle').textContent = msg.subject;
    document.getElementById('messageCount').textContent = '';

    document.getElementById('backToList').addEventListener('click', () => switchView(currentView));

    // Attachment download buttons
    detail.querySelectorAll('.att-btn-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadFile(btn.dataset.msgId, parseInt(btn.dataset.fileIndex));
        });
    });

    // Attachment edit buttons
    detail.querySelectorAll('.att-btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const ext = btn.dataset.fileExt;
            if (isWordFile(ext)) {
                downloadFileForEdit(btn.dataset.msgId, parseInt(btn.dataset.fileIndex));
            } else {
                openFileEditor(btn.dataset.msgId, parseInt(btn.dataset.fileIndex));
            }
        });
    });

    // Attachment preview buttons (show inline)
    detail.querySelectorAll('.att-btn-preview').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewFile(btn.dataset.msgId, parseInt(btn.dataset.fileIndex));
        });
    });

    updateBadges();
}

function renderAttachmentItem(file, index, msgId) {
    const ext = getFileExtension(file.name);
    const iconClass = getFileIconClass(ext);
    const iconSvg = getFileIconSvg(ext);
    const canEdit = isTextFile(ext) || isWordFile(ext);
    const canPreview = isPreviewable(ext);
    const editLabel = isWordFile(ext) ? 'تحميل للتعديل في Word' : 'تعديل';
    const editIcon = isWordFile(ext)
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

    return `
        <div class="attachment-item">
            <div class="att-icon ${iconClass}">${iconSvg}</div>
            <div class="att-info">
                <div class="att-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                <div class="att-size">${formatFileSize(file.size)}</div>
            </div>
            <div class="att-actions">
                ${canPreview ? `
                <button class="att-btn att-btn-preview" data-msg-id="${msgId}" data-file-index="${index}" title="عرض">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>` : ''}
                <button class="att-btn att-btn-download" data-msg-id="${msgId}" data-file-index="${index}" title="تحميل">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                ${canEdit ? `
                <button class="att-btn att-btn-edit" data-msg-id="${msgId}" data-file-index="${index}" data-file-ext="${ext}" title="${editLabel}">
                    ${editIcon}
                </button>` : ''}
            </div>
        </div>
        <div class="att-preview-container hidden" id="preview-${msgId}-${index}"></div>`;
}

// ── File Preview ──────────────────────────────────────────────
function previewFile(msgId, fileIndex) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.files[fileIndex]) return;

    const file = msg.files[fileIndex];
    const ext = getFileExtension(file.name);
    const container = document.getElementById(`preview-${msgId}-${fileIndex}`);

    // Toggle preview
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    let previewHtml = '';
    const actionsHtml = `
        <div class="preview-actions">
            <button class="preview-btn" onclick="openInNewWindow('${msgId}', ${fileIndex})">
                <i data-lucide="external-link" style="width:14px;height:14px;"></i>
                فتح في نافذة جديدة
            </button>
        </div>
    `;

    if (isImageFile(ext)) {
        previewHtml = `
            <div class="preview-wrapper">
                ${actionsHtml}
                <img src="${file.data}" class="preview-img" alt="${escapeHtml(file.name)}" onclick="showLightbox('${file.data}')">
            </div>`;
    } else if (isTextFile(ext)) {
        try {
            const base64Data = file.data.split(',')[1];
            const textContent = decodeURIComponent(escape(atob(base64Data)));
            previewHtml = `
                <div class="preview-wrapper">
                    ${actionsHtml}
                    <pre style="background:var(--bg-secondary);padding:14px;border-radius:8px;margin-top:8px;white-space:pre-wrap;font-size:0.85rem;color:var(--text-secondary);max-height:300px;overflow-y:auto;border:1px solid var(--border);">${escapeHtml(textContent)}</pre>
                </div>`;
        } catch (e) {
            previewHtml = '<p style="color:var(--text-muted);margin-top:8px">لا يمكن عرض هذا الملف</p>';
        }
    } else if (ext === 'pdf') {
        previewHtml = `
            <div class="preview-wrapper">
                ${actionsHtml}
                <iframe src="${file.data}" style="width:100%;height:400px;border:none;border-radius:8px;margin-top:8px;"></iframe>
            </div>`;
    }

    container.innerHTML = previewHtml;
    container.classList.remove('hidden');
    lucide.createIcons();
}

function showLightbox(imgSrc) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <div class="lightbox-content">
            <button class="lightbox-close" onclick="this.parentElement.parentElement.remove()">
                <i data-lucide="x" style="width:32px;height:32px;"></i>
            </button>
            <img src="${imgSrc}" class="lightbox-img" onclick="event.stopPropagation()">
        </div>
    `;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
    lucide.createIcons();
}

function openInNewWindow(msgId, fileIndex) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.files[fileIndex]) return;
    const file = msg.files[fileIndex];

    const win = window.open();
    if (win) {
        win.document.write(`
            <html>
                <head>
                    <title>${file.name}</title>
                    <style>
                        body { margin: 0; background: #1a1a1a; display: flex; align-items: center; justify-content: center; height: 100vh; }
                        img { max-width: 100%; max-height: 100%; }
                        pre { color: white; padding: 20px; white-space: pre-wrap; font-family: monospace; }
                    </style>
                </head>
                <body>
                    ${isImageFile(getFileExtension(file.name))
                ? `<img src="${file.data}">`
                : (getFileExtension(file.name) === 'pdf'
                    ? `<iframe src="${file.data}" style="width:100%;height:100%;border:none;"></iframe>`
                    : `<pre>${escapeHtml(decodeURIComponent(escape(atob(file.data.split(',')[1]))))}</pre>`)}
                </body>
            </html>
        `);
        win.document.close();
    }
}

// ── Compose Modal ─────────────────────────────────────────────
function openComposeModal() {
    const select = document.getElementById('msgRecipient');
    select.value = '';
    Array.from(select.options).forEach(opt => {
        if (opt.value === currentUser.department) {
            opt.disabled = true;
            opt.textContent = DEPARTMENTS[opt.value].name + ' (قسمك)';
        } else if (opt.value && DEPARTMENTS[opt.value]) {
            opt.disabled = false;
            opt.textContent = DEPARTMENTS[opt.value].name;
        }
    });

    // Reset form
    attachedFilesBuffer = [];
    document.getElementById('attachedFiles').innerHTML = '';
    document.getElementById('msgSubject').value = '';
    document.getElementById('msgBody').value = '';
    document.getElementById('msgPriority').value = 'normal';
    document.getElementById('sendToEmail').checked = false;

    openModal('composeModal');
}

// ── Send Message ──────────────────────────────────────────────
function handleSendMessage() {
    const recipient = document.getElementById('msgRecipient').value;
    const subject = document.getElementById('msgSubject').value.trim();
    const body = document.getElementById('msgBody').value.trim();
    const priority = document.getElementById('msgPriority').value;

    const sendToEmail = document.getElementById('sendToEmail').checked;

    if (!recipient) {
        showToast('يرجى اختيار القسم المرسل إليه', 'error');
        return;
    }
    if (!subject) {
        showToast('يرجى إدخال موضوع الرسالة', 'error');
        return;
    }
    if (!body) {
        showToast('يرجى كتابة نص الرسالة', 'error');
        return;
    }

    const message = {
        id: generateId(),
        subject,
        body,
        priority,
        sender: { department: currentUser.department, name: DEPARTMENTS[currentUser.department].name },
        recipient: recipient,
        sendToEmail,
        files: [...attachedFilesBuffer],
        readBy: [currentUser.department],
        createdAt: new Date().toISOString()
    };

    messages.unshift(message);
    saveState();

    // Reset form
    document.getElementById('msgRecipient').value = '';
    document.getElementById('msgSubject').value = '';
    document.getElementById('msgBody').value = '';
    document.getElementById('msgPriority').value = 'normal';
    document.getElementById('sendToEmail').checked = false;
    attachedFilesBuffer = [];
    document.getElementById('attachedFiles').innerHTML = '';

    closeModal('composeModal');

    const recipientName = DEPARTMENTS[recipient].name;
    const recipientEmail = DEPARTMENTS[recipient].email;

    // Show the sent message detail with attachments preview
    showToast(`تم إرسال الرسالة إلى ${recipientName}`, 'success');

    // Always sync to database/n8n
    syncMessageToDatabase({
        ...message,
        recipientEmail: recipientEmail,
        senderName: currentUser.name,
        triggerEmail: sendToEmail // Flag for n8n to decide if email should be sent
    }).then(success => {
        if (success) {
            if (sendToEmail) {
                showToast(`تم إرسال نسخة إلى البريد الإلكتروني بنجاح`, 'success');
            }
        } else {
            showToast(`خطأ في مزامنة البيانات مع قاعدة البيانات`, 'error');
        }
    });

    // Open the sent message to show its content and attachments
    switchView('sent');
    setTimeout(() => openMessageDetail(message.id), 200);
}

// ── Webhook/Database Integration ─────────────────────────────
async function syncMessageToDatabase(payload) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Webhook rejected the request');
        return true;
    } catch (e) {
        console.error('Database sync failed:', e);
        return false;
    }
}

// ── File Handling ─────────────────────────────────────────────
function handleFileSelect(e) {
    handleFilesDrop(e.target.files);
    e.target.value = '';
}

function handleFilesDrop(fileList) {
    Array.from(fileList).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            attachedFilesBuffer.push({
                name: file.name,
                size: file.size,
                type: file.type,
                data: e.target.result
            });
            renderAttachedFiles();
        };
        reader.readAsDataURL(file);
    });
}

function renderAttachedFiles() {
    const container = document.getElementById('attachedFiles');
    container.innerHTML = attachedFilesBuffer.map((f, i) => {
        const ext = getFileExtension(f.name);
        const isImg = isImageFile(ext);
        const previewHtml = isImg
            ? `<div class="compose-preview"><img src="${f.data}" alt="${escapeHtml(f.name)}" style="max-width:120px;max-height:80px;border-radius:6px;margin-top:4px;"></div>`
            : '';

        return `
            <div class="attached-file">
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span>${escapeHtml(f.name)}</span>
                        <span style="color:var(--text-muted);font-size:0.7rem">${formatFileSize(f.size)}</span>
                    </div>
                    ${previewHtml}
                </div>
                <button class="remove-file" data-index="${i}">✕</button>
            </div>`;
    }).join('');

    container.querySelectorAll('.remove-file').forEach(btn => {
        btn.addEventListener('click', () => {
            attachedFilesBuffer.splice(parseInt(btn.dataset.index), 1);
            renderAttachedFiles();
        });
    });
}

function downloadFile(msgId, fileIndex) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.files[fileIndex]) return;

    const file = msg.files[fileIndex];
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`تم تحميل ${file.name}`, 'success');
}

function downloadFileForEdit(msgId, fileIndex) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.files[fileIndex]) return;

    const file = msg.files[fileIndex];
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`تم تحميل "${file.name}" — افتحه في Word للتعديل ثم أعد إرفاقه`, 'info');
}

function openFileEditor(msgId, fileIndex) {
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !msg.files[fileIndex]) return;

    const file = msg.files[fileIndex];

    try {
        const base64Data = file.data.split(',')[1];
        const textContent = decodeURIComponent(escape(atob(base64Data)));

        currentEditingMessageId = msgId;
        currentEditingFileIndex = fileIndex;

        document.getElementById('editorTitle').textContent = `تعديل: ${file.name}`;
        document.getElementById('fileEditorContent').value = textContent;
        openModal('editorModal');
    } catch (e) {
        showToast('لا يمكن تعديل هذا الملف', 'error');
    }
}

function handleSaveEdit() {
    if (currentEditingMessageId === null || currentEditingFileIndex === null) return;

    const msg = messages.find(m => m.id === currentEditingMessageId);
    if (!msg) return;

    const newContent = document.getElementById('fileEditorContent').value;
    const encoded = btoa(unescape(encodeURIComponent(newContent)));
    const file = msg.files[currentEditingFileIndex];

    file.data = `data:${file.type || 'text/plain'};base64,${encoded}`;
    file.size = new Blob([newContent]).size;

    saveState();
    closeModal('editorModal');
    showToast('تم حفظ التعديلات بنجاح', 'success');

    openMessageDetail(currentEditingMessageId);

    currentEditingMessageId = null;
    currentEditingFileIndex = null;
}

// ── Files View ────────────────────────────────────────────────
function renderFiles() {
    const container = document.getElementById('filesList');
    let allFiles = [];

    messages.forEach(msg => {
        const isRelevant = msg.sender.department === currentUser.department ||
            msg.recipient === currentUser.department;

        if (isRelevant && msg.files) {
            msg.files.forEach((file, index) => {
                allFiles.push({
                    ...file,
                    messageId: msg.id,
                    fileIndex: index,
                    sender: msg.sender,
                    recipient: msg.recipient,
                    date: msg.createdAt
                });
            });
        }
    });

    if (allFiles.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p>لا توجد ملفات</p>
            </div>`;
        document.getElementById('messageCount').textContent = '';
        return;
    }

    document.getElementById('messageCount').textContent = `${allFiles.length} ملف`;

    container.innerHTML = allFiles.map(f => {
        const ext = getFileExtension(f.name);
        const iconClass = getFileIconClass(ext);
        const iconSvg = getFileIconSvg(ext);
        const canEdit = isTextFile(ext) || isWordFile(ext);
        const editLabel = isWordFile(ext) ? 'تحميل للتعديل' : 'تعديل';
        const editAction = isWordFile(ext)
            ? `downloadFileForEdit('${f.messageId}', ${f.fileIndex})`
            : `openFileEditor('${f.messageId}', ${f.fileIndex})`;

        const fromTo = `من ${DEPARTMENTS[f.sender.department].name} إلى ${DEPARTMENTS[f.recipient].name}`;

        return `
            <div class="file-card">
                <div class="file-card-icon ${iconClass}">${iconSvg}</div>
                <div class="file-card-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</div>
                <div class="file-card-info">${formatFileSize(f.size)} — ${fromTo}</div>
                <div class="file-card-actions">
                    <button class="file-action-btn" onclick="downloadFile('${f.messageId}', ${f.fileIndex})">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        تحميل
                    </button>
                    ${canEdit ? `
                    <button class="file-action-btn" onclick="${editAction}">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        ${editLabel}
                    </button>` : ''}
                </div>
            </div>`;
    }).join('');
}

// ── Badges ────────────────────────────────────────────────────
function updateBadges() {
    if (!currentUser) return;

    const inboxCount = messages.filter(m =>
        m.recipient === currentUser.department && !m.readBy?.includes(currentUser.department)
    ).length;

    const inboxBadge = document.getElementById('inboxBadge');
    if (inboxCount > 0) {
        inboxBadge.textContent = inboxCount;
        inboxBadge.classList.add('show');
    } else {
        inboxBadge.classList.remove('show');
    }

    const routingCount = messages.filter(m =>
        (m.sender.department === currentUser.department || m.recipient === currentUser.department) &&
        !m.readBy?.includes(currentUser.department)
    ).length;

    const routingBadge = document.getElementById('routingBadge');
    if (routingCount > 0) {
        routingBadge.textContent = routingCount;
        routingBadge.classList.add('show');
    } else {
        routingBadge.classList.remove('show');
    }
}

// ── Modals ────────────────────────────────────────────────────
function openModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const icons = {
        success: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ── Utilities ─────────────────────────────────────────────────
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-AE');
}

function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('ar-AE', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (!bytes) return '0 ب';
    const sizes = ['ب', 'ك.ب', 'م.ب', 'ج.ب'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

function getFileIconClass(ext) {
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'doc';
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'img';
    if (['txt', 'csv', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) return 'txt';
    return 'other';
}

function getFileIconSvg(ext) {
    if (['pdf'].includes(ext)) {
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    }
    if (['doc', 'docx'].includes(ext)) {
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    }
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
}

function isTextFile(ext) {
    return ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'md', 'log'].includes(ext);
}

function isWordFile(ext) {
    return ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
}

function isImageFile(ext) {
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(ext);
}

function isPreviewable(ext) {
    return isImageFile(ext) || isTextFile(ext) || ext === 'pdf';
}
