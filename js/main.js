// ============================================
// PIXEL + CARTOON ID MAKER - MAIN SCRIPT
// ============================================

// ---------- STATE ----------
let currentSide = 'front';
let selectedField = null;
let fieldIdCounter = 0;
let isFlipped = false;

// Drag state (single instance)
let dragState = null;

// Default fields
const defaultFrontFields = [
    { id: 'f1', label: 'Name', value: 'PLAYER 1', x: 20, y: 30, w: 160, h: 40 },
    { id: 'f2', label: 'Age', value: '25', x: 20, y: 80, w: 100, h: 30 },
    { id: 'f3', label: 'Sex', value: 'M', x: 130, y: 80, w: 80, h: 30 },
    { id: 'f4', label: 'Position', value: '⭐ HERO', x: 20, y: 120, w: 160, h: 30 },
    { id: 'f5', label: 'Email', value: 'p1@game.com', x: 20, y: 160, w: 180, h: 30 },
    { id: 'f6', label: 'Contact', value: '+123 456 789', x: 20, y: 200, w: 180, h: 30 },
    { id: 'f7', label: 'Address', value: '123 Pixel St', x: 20, y: 240, w: 180, h: 30 },
];

const defaultBackFields = [
    { id: 'b1', label: 'Meme', value: "IT'S DONE BRO 😎", x: 20, y: 30, w: 200, h: 50 },
];

let fields = {
    front: JSON.parse(JSON.stringify(defaultFrontFields)),
    back: JSON.parse(JSON.stringify(defaultBackFields)),
};

// ---------- DOM REFS ----------
const homePage = document.getElementById('home-page');
const creatorPage = document.getElementById('creator-page');
const homeCard = document.getElementById('homeCard');
const backHomeBtn = document.getElementById('backHomeBtn');

const frontSideEl = document.getElementById('frontSide');
const backSideEl = document.getElementById('backSide');
const card3d = document.getElementById('card3d');

const themeSelect = document.getElementById('themeSelect');
const sideBtns = document.querySelectorAll('.side-btn');
const addFieldBtn = document.getElementById('addFieldBtn');
const newFieldLabel = document.getElementById('newFieldLabel');
const newFieldValue = document.getElementById('newFieldValue');
const imageUpload = document.getElementById('imageUpload');
const addQrBtn = document.getElementById('addQrBtn');
const cardBgColor = document.getElementById('cardBgColor');
const cardTextColor = document.getElementById('cardTextColor');
const fontSelect = document.getElementById('fontSelect');
const cardStyleSelect = document.getElementById('cardStyleSelect');
const removeSelectedBtn = document.getElementById('removeSelectedBtn');
const memeLineInput = document.getElementById('memeLineInput');

const exportFrontBtn = document.getElementById('exportFrontBtn');
const exportBackBtn = document.getElementById('exportBackBtn');
const exportBothBtn = document.getElementById('exportBothBtn');
const printBtn = document.getElementById('printBtn');

// ---------- QR CODE GENERATION (REAL QR) ----------
function generateQRCode(text, size = 100) {
    try {
        // Try using QRCode.js library
        const container = document.createElement('div');
        container.style.width = size + 'px';
        container.style.height = size + 'px';

        new QRCode(container, {
            text: text || 'ID MAKER',
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        const canvas = container.querySelector('canvas');
        if (canvas) {
            return canvas;
        }
        return container;
    } catch (e) {
        // Fallback: Simple QR-like pattern
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';

        const moduleSize = size / 25;

        function drawPositionMarker(x, y) {
            ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + 3 * moduleSize, y + 3 * moduleSize, moduleSize, moduleSize);
            ctx.fillStyle = '#000000';
        }

        drawPositionMarker(0, 0);
        drawPositionMarker(size - 7 * moduleSize, 0);
        drawPositionMarker(0, size - 7 * moduleSize);

        const seed = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let pseudoRandom = seed;
        for (let row = 0; row < 25; row++) {
            for (let col = 0; col < 25; col++) {
                if ((row < 9 && col < 9) || (row < 9 && col > 16) || (row > 16 && col < 9)) continue;
                pseudoRandom = (pseudoRandom * 9301 + 49297) % 233280;
                if (pseudoRandom % 2 === 0) {
                    ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
                }
            }
        }
        return canvas;
    }
}

// ---------- GLOBAL DRAG HANDLERS (SINGLE INSTANCE) ----------
function handleDragStart(e) {
    const target = e.target.closest('.field-item');
    if (!target) return;
    if (e.target.classList.contains('resize-handle')) return;
    if (e.target.classList.contains('remove-field-btn')) return;

    const fieldId = target.dataset.fieldId;
    const side = target.dataset.side;
    const field = fields[side].find(f => f.id === fieldId);
    if (!field) return;

    selectField(fieldId, side);

    const parentRect = target.parentElement.getBoundingClientRect();

    dragState = {
        field: field,
        element: target,
        side: side,
        startX: e.clientX,
        startY: e.clientY,
        origX: field.x,
        origY: field.y,
        isDragging: true
    };

    target.style.cursor = 'grabbing';
    target.style.zIndex = 100;
    e.preventDefault();
}

function handleDragMove(e) {
    if (!dragState || !dragState.isDragging) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const parentRect = dragState.element.parentElement.getBoundingClientRect();
    const maxX = parentRect.width - dragState.field.w;
    const maxY = parentRect.height - dragState.field.h;

    dragState.field.x = Math.max(0, Math.min(maxX, dragState.origX + dx));
    dragState.field.y = Math.max(0, Math.min(maxY, dragState.origY + dy));
    dragState.element.style.left = dragState.field.x + 'px';
    dragState.element.style.top = dragState.field.y + 'px';
}

function handleDragEnd(e) {
    if (dragState && dragState.isDragging) {
        dragState.element.style.cursor = 'grab';
        dragState.element.style.zIndex = 10;
        dragState.isDragging = false;
        dragState = null;
    }
}

// ---------- GLOBAL RESIZE HANDLERS (SINGLE INSTANCE) ----------
let resizeState = null;

function handleResizeStart(e) {
    const handle = e.target.closest('.resize-handle');
    if (!handle) return;

    const element = handle.closest('.field-item');
    const fieldId = element.dataset.fieldId;
    const side = element.dataset.side;
    const field = fields[side].find(f => f.id === fieldId);
    if (!field) return;

    resizeState = {
        field: field,
        element: element,
        side: side,
        startX: e.clientX,
        startY: e.clientY,
        origW: field.w,
        origH: field.h
    };

    e.stopPropagation();
    e.preventDefault();
}

function handleResizeMove(e) {
    if (!resizeState) return;

    const dx = e.clientX - resizeState.startX;
    const dy = e.clientY - resizeState.startY;
    const parentRect = resizeState.element.parentElement.getBoundingClientRect();

    resizeState.field.w = Math.max(30, Math.min(parentRect.width - resizeState.field.x, resizeState.origW + dx));
    resizeState.field.h = Math.max(20, Math.min(parentRect.height - resizeState.field.y, resizeState.origH + dy));
    resizeState.element.style.width = resizeState.field.w + 'px';
    resizeState.element.style.height = resizeState.field.h + 'px';
}

function handleResizeEnd(e) {
    resizeState = null;
}

// ---------- ATTACH GLOBAL EVENT LISTENERS (ONCE) ----------
document.addEventListener('mousedown', handleDragStart);
document.addEventListener('mousemove', handleDragMove);
document.addEventListener('mouseup', handleDragEnd);

document.addEventListener('mousedown', handleResizeStart);
document.addEventListener('mousemove', handleResizeMove);
document.addEventListener('mouseup', handleResizeEnd);

// ---------- NAVIGATION ----------
homeCard.addEventListener('click', () => {
    homePage.style.display = 'none';
    creatorPage.style.display = 'block';
    renderAll();
});

backHomeBtn.addEventListener('click', () => {
    dragState = null;
    resizeState = null;
    selectedField = null;
    card3d.classList.remove('flipped');
    currentSide = 'front';

    creatorPage.style.display = 'none';
    homePage.style.display = 'block';
});

// ---------- SIDE TOGGLE ----------
sideBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        sideBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSide = btn.dataset.side;
        updateCardFlip();
        renderAll();
    });
});

function updateCardFlip() {
    if (currentSide === 'back') {
        card3d.classList.add('flipped');
        isFlipped = true;
    } else {
        card3d.classList.remove('flipped');
        isFlipped = false;
    }
}

// ---------- RENDER ----------
function renderAll() {
    renderSide('front', frontSideEl);
    renderSide('back', backSideEl);
    applyTheme();
    applyColors();
    applyFont();
    applyCardStyle();
    updateMemeLine();
}

function renderSide(side, container) {
    container.innerHTML = '';
    const sideFields = fields[side] || [];

    // Get container dimensions for clamping
    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width || 400;
    const containerHeight = rect.height || 500;

    sideFields.forEach(f => {
        // Clamp positions to container
        f.x = Math.max(0, Math.min(f.x, containerWidth - f.w - 10));
        f.y = Math.max(0, Math.min(f.y, containerHeight - f.h - 10));
        f.w = Math.max(30, Math.min(f.w, containerWidth - 20));
        f.h = Math.max(20, Math.min(f.h, containerHeight - 20));

        const el = createFieldElement(f, side);
        container.appendChild(el);
    });

    if (selectedField && selectedField.side === side) {
        const el = container.querySelector(`[data-field-id="${selectedField.id}"]`);
        if (el) el.classList.add('selected');
    }
}

function createFieldElement(field, side) {
    const div = document.createElement('div');
    div.className = 'field-item';
    div.dataset.fieldId = field.id;
    div.dataset.side = side;

    div.style.left = field.x + 'px';
    div.style.top = field.y + 'px';
    div.style.width = field.w + 'px';
    div.style.height = field.h + 'px';

    // Image field
    if (field.type === 'image') {
        div.style.background = '#f0f0f0';
        div.style.border = '3px dashed #222';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.overflow = 'hidden';
        div.style.padding = '0';

        if (field.src) {
            const img = document.createElement('img');
            img.src = field.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            div.appendChild(img);
        } else {
            div.innerHTML = '<span style="font-size:0.5rem;">🖼️ IMAGE</span>';
        }

        addResizeHandle(div);
        addSelection(div, field, side);
        return div;
    }

    // QR field - Generate REAL QR code
    if (field.type === 'qr') {
        div.style.background = '#fff';
        div.style.border = '3px solid #222';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.padding = '0';
        div.style.overflow = 'hidden';

        // Generate QR code with proper library
        const qrElement = generateQRCode(field.qrData || 'ID MAKER', 100);
        div.appendChild(qrElement);

        addResizeHandle(div);
        addSelection(div, field, side);
        return div;
    }

    // Text field
    const labelSpan = document.createElement('span');
    labelSpan.className = 'field-label';
    labelSpan.textContent = field.label + ':';

    const valueSpan = document.createElement('span');
    valueSpan.className = 'field-value';
    valueSpan.textContent = field.value || '';

    div.appendChild(labelSpan);
    div.appendChild(valueSpan);

    // Remove button
    const removeBtn = document.createElement('div');
    removeBtn.className = 'remove-field-btn';
    removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeField(field.id, side);
    });
    div.appendChild(removeBtn);

    addResizeHandle(div);
    addSelection(div, field, side);

    // Double click to edit
    div.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const newVal = prompt('Edit value:', field.value);
        if (newVal !== null) {
            field.value = newVal;
            renderAll();
        }
    });

    return div;
}

function addResizeHandle(element) {
    const handle = document.createElement('div');
    handle.className = 'resize-handle';
    element.appendChild(handle);
}

function addSelection(element, field, side) {
    element.addEventListener('click', (e) => {
        e.stopPropagation();
        selectField(field.id, side);
    });
}

// ---------- SELECTION ----------
function selectField(id, side) {
    document.querySelectorAll('.field-item').forEach(el => el.classList.remove('selected'));
    selectedField = { id, side };
    const el = document.querySelector(`[data-field-id="${id}"]`);
    if (el) el.classList.add('selected');
}

function removeField(id, side) {
    if (fields[side].length <= 1) {
        alert('Keep at least one field on the card!');
        return;
    }
    fields[side] = fields[side].filter(f => f.id !== id);
    if (selectedField && selectedField.id === id) {
        selectedField = null;
    }
    renderAll();
}

// ---------- ADD FIELD ----------
addFieldBtn.addEventListener('click', () => {
    const label = newFieldLabel.value.trim() || 'New';
    const value = newFieldValue.value.trim() || '...';
    const newField = {
        id: 'c' + (++fieldIdCounter),
        label: label,
        value: value,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        w: 120,
        h: 30,
    };
    fields[currentSide].push(newField);
    newFieldLabel.value = '';
    newFieldValue.value = '';
    renderAll();
});

// ---------- IMAGE UPLOAD ----------
imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const imgField = {
            id: 'img' + (++fieldIdCounter),
            type: 'image',
            src: ev.target.result,
            x: 20,
            y: 280,
            w: 200,
            h: 200,
        };
        fields[currentSide].push(imgField);
        renderAll();
    };
    reader.readAsDataURL(file);
    imageUpload.value = '';
});

// ---------- QR CODE ----------
// ---------- QR CODE ----------
addQrBtn.addEventListener('click', () => {
    const qrField = {
        id: 'qr' + (++fieldIdCounter),
        type: 'qr',
        qrData: 'ID MAKER - ' + Date.now(),
        x: 20,
        y: 280,
        w: 100,
        h: 100,
    };
    // ALWAYS add to BACK side
    fields.back.push(qrField);
    renderAll();
    // Switch to back view to see it
    card3d.classList.add('flipped');
    currentSide = 'back';
    sideBtns.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.side === 'back') b.classList.add('active');
    });
});

// ---------- THEME ----------
themeSelect.addEventListener('change', applyTheme);

function applyTheme() {
    const theme = themeSelect.value;
    const front = frontSideEl;
    const back = backSideEl;

    front.style.background = '';
    back.style.background = '';
    front.style.color = '';
    back.style.color = '';
    front.style.border = '6px solid #222';
    back.style.border = '6px solid #222';

    document.querySelectorAll('.field-item').forEach(el => {
        el.style.color = '';
        el.style.background = 'rgba(255, 255, 255, 0.85)';
        el.style.border = '3px solid #222';
    });

    switch (theme) {
        case 'pixel':
            front.style.background = '#b3d9f9';
            back.style.background = '#f9e7b3';
            front.style.border = '8px solid #222';
            back.style.border = '8px solid #222';
            break;
        case 'cartoon':
            front.style.background = '#ffd966';
            back.style.background = '#ffb3b3';
            front.style.border = '6px solid #ff6b6b';
            back.style.border = '6px solid #ff6b6b';
            break;
        case 'meme':
            front.style.background = '#f5e6ca';
            back.style.background = '#c7e9c0';
            front.style.border = '6px dotted #ff4500';
            back.style.border = '6px dotted #ff4500';
            break;
        case 'arcade':
            front.style.background = '#1a1a2e';
            back.style.background = '#16213e';
            front.style.color = '#fff';
            back.style.color = '#fff';
            front.style.border = '6px solid #e94560';
            back.style.border = '6px solid #e94560';
            document.querySelectorAll('.field-item').forEach(el => {
                el.style.color = '#fff';
                el.style.background = 'rgba(0,0,0,0.6)';
                el.style.border = '3px solid #e94560';
            });
            break;
        case 'futuristic':
            front.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
            back.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
            front.style.color = '#0ff';
            back.style.color = '#0ff';
            front.style.border = '6px solid #0ff';
            back.style.border = '6px solid #0ff';
            document.querySelectorAll('.field-item').forEach(el => {
                el.style.color = '#0ff';
                el.style.background = 'rgba(0,255,255,0.1)';
                el.style.border = '2px solid #0ff';
            });
            break;
    }
}

// ---------- COLORS ----------
cardBgColor.addEventListener('input', applyColors);
cardTextColor.addEventListener('input', applyColors);

function applyColors() {
    const bg = cardBgColor.value;
    const text = cardTextColor.value;

    if (!['arcade', 'futuristic'].includes(themeSelect.value)) {
        frontSideEl.style.background = bg;
        backSideEl.style.background = bg;
    }

    document.querySelectorAll('.field-item .field-value, .field-item .field-label').forEach(el => {
        el.style.color = text;
    });
}

// ---------- FONT ----------
fontSelect.addEventListener('change', applyFont);

function applyFont() {
    const font = fontSelect.value;
    document.querySelectorAll('.field-item').forEach(el => {
        el.style.fontFamily = font;
    });
}

// ---------- CARD STYLE ----------
cardStyleSelect.addEventListener('change', applyCardStyle);

function applyCardStyle() {
    const style = cardStyleSelect.value;
    [frontSideEl, backSideEl].forEach(el => {
        el.style.backgroundImage = '';
        if (style === 'gradient' && !['arcade', 'futuristic'].includes(themeSelect.value)) {
            el.style.background = 'linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)';
        } else if (style === 'dotted') {
            el.style.background = 'repeating-linear-gradient(45deg, #ddd 0px, #ddd 4px, transparent 4px, transparent 8px)';
        } else if (style === 'striped') {
            el.style.background = 'repeating-linear-gradient(0deg, #f0f0f0 0px, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)';
        } else if (style === 'solid') {
            el.style.background = cardBgColor.value;
        }
    });
}

// ---------- MEME LINE ----------
memeLineInput.addEventListener('input', updateMemeLine);

function updateMemeLine() {
    const val = memeLineInput.value || "IT'S DONE BRO 😎";
    const backFields = fields.back;
    let memeField = backFields.find(f => f.label === 'Meme' || f.id === 'b1');

    if (memeField) {
        memeField.value = val;
    } else {
        backFields.push({
            id: 'b1',
            label: 'Meme',
            value: val,
            x: 20,
            y: 30,
            w: 200,
            h: 50,
        });
    }
    if (currentSide === 'back') {
        renderAll();
    }
}

// ---------- REMOVE SELECTED ----------
removeSelectedBtn.addEventListener('click', () => {
    if (selectedField) {
        removeField(selectedField.id, selectedField.side);
        selectedField = null;
    } else {
        alert('Select a field first! Click on any field to select it.');
    }
});

// ---------- EXPORT ----------
// ---------- EXPORT ----------
function exportCard(side) {
    const container = side === 'front' ? frontSideEl : backSideEl;
    const canvas = document.getElementById('exportCanvas');
    const rect = container.getBoundingClientRect();

    const scale = 2;
    canvas.width = Math.max(100, rect.width * scale);
    canvas.height = Math.max(100, rect.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Draw background with rounded corners
    const bgColor = getComputedStyle(container).backgroundColor || '#f9e7b3';
    const radius = 30; // Match card border-radius

    // Create rounded rect path
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(rect.width - radius, 0);
    ctx.quadraticCurveTo(rect.width, 0, rect.width, radius);
    ctx.lineTo(rect.width, rect.height - radius);
    ctx.quadraticCurveTo(rect.width, rect.height, rect.width - radius, rect.height);
    ctx.lineTo(radius, rect.height);
    ctx.quadraticCurveTo(0, rect.height, 0, rect.height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();

    // Draw border with rounded corners
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw each field
    const items = container.querySelectorAll('.field-item');
    items.forEach(el => {
        const style = getComputedStyle(el);
        const x = parseFloat(el.style.left) || 0;
        const y = parseFloat(el.style.top) || 0;
        const w = parseFloat(el.style.width) || 100;
        const h = parseFloat(el.style.height) || 40;
        const fieldRadius = 16; // Match field border-radius

        // Check if it's an image
        const img = el.querySelector('img');
        if (img) {
            // Clip image with rounded corners
            ctx.beginPath();
            ctx.moveTo(x + fieldRadius, y);
            ctx.lineTo(x + w - fieldRadius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + fieldRadius);
            ctx.lineTo(x + w, y + h - fieldRadius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - fieldRadius, y + h);
            ctx.lineTo(x + fieldRadius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - fieldRadius);
            ctx.lineTo(x, y + fieldRadius);
            ctx.quadraticCurveTo(x, y, x + fieldRadius, y);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(img, x, y, w, h);

            // Reset clip
            ctx.restore();
            ctx.save();

            // Draw border with rounded corners
            ctx.beginPath();
            ctx.moveTo(x + fieldRadius, y);
            ctx.lineTo(x + w - fieldRadius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + fieldRadius);
            ctx.lineTo(x + w, y + h - fieldRadius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - fieldRadius, y + h);
            ctx.lineTo(x + fieldRadius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - fieldRadius);
            ctx.lineTo(x, y + fieldRadius);
            ctx.quadraticCurveTo(x, y, x + fieldRadius, y);
            ctx.closePath();

            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // Check if it's a QR code (canvas)
        const qrCanvas = el.querySelector('canvas');
        if (qrCanvas) {
            // Clip QR with rounded corners
            ctx.beginPath();
            ctx.moveTo(x + fieldRadius, y);
            ctx.lineTo(x + w - fieldRadius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + fieldRadius);
            ctx.lineTo(x + w, y + h - fieldRadius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - fieldRadius, y + h);
            ctx.lineTo(x + fieldRadius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - fieldRadius);
            ctx.lineTo(x, y + fieldRadius);
            ctx.quadraticCurveTo(x, y, x + fieldRadius, y);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(qrCanvas, x, y, w, h);

            ctx.restore();
            ctx.save();

            // Draw border with rounded corners
            ctx.beginPath();
            ctx.moveTo(x + fieldRadius, y);
            ctx.lineTo(x + w - fieldRadius, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + fieldRadius);
            ctx.lineTo(x + w, y + h - fieldRadius);
            ctx.quadraticCurveTo(x + w, y + h, x + w - fieldRadius, y + h);
            ctx.lineTo(x + fieldRadius, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - fieldRadius);
            ctx.lineTo(x, y + fieldRadius);
            ctx.quadraticCurveTo(x, y, x + fieldRadius, y);
            ctx.closePath();

            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // Regular text field - draw with rounded corners
        ctx.beginPath();
        ctx.moveTo(x + fieldRadius, y);
        ctx.lineTo(x + w - fieldRadius, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + fieldRadius);
        ctx.lineTo(x + w, y + h - fieldRadius);
        ctx.quadraticCurveTo(x + w, y + h, x + w - fieldRadius, y + h);
        ctx.lineTo(x + fieldRadius, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - fieldRadius);
        ctx.lineTo(x, y + fieldRadius);
        ctx.quadraticCurveTo(x, y, x + fieldRadius, y);
        ctx.closePath();

        ctx.fillStyle = style.backgroundColor || 'rgba(255,255,255,0.8)';
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Text content
        const labelEl = el.querySelector('.field-label');
        const valueEl = el.querySelector('.field-value');
        let text = '';
        if (labelEl) text += labelEl.textContent + ' ';
        if (valueEl) text += valueEl.textContent;

        if (text) {
            ctx.fillStyle = style.color || '#222';
            ctx.font = '10px "Press Start 2P", cursive';  // Smaller font
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Better word wrap with character limit
            const maxWidth = w - 12;
            let lines = [];
            let currentLine = '';

            // Split text into characters (for better wrapping)
            for (let i = 0; i < text.length; i++) {
                const testLine = currentLine + text[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = text[i];
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            // Draw each line
            let yOffset = 6;
            const lineHeight = 14;
            lines.forEach(line => {
                if (yOffset + lineHeight > h - 6) return; // Stop if out of bounds
                ctx.fillText(line, x + 6, y + yOffset);
                yOffset += lineHeight;
            });
        }
    });

    // Download
    const link = document.createElement('a');
    link.download = `id-${side}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

exportFrontBtn.addEventListener('click', () => exportCard('front'));
exportBackBtn.addEventListener('click', () => exportCard('back'));

exportBothBtn.addEventListener('click', () => {
    exportCard('front');
    setTimeout(() => exportCard('back'), 1000);
});

printBtn.addEventListener('click', () => {
    window.print();
});

// ---------- GLOBAL CLICK TO DESELECT ----------
document.addEventListener('click', (e) => {
    if (!e.target.closest('.field-item') && !e.target.closest('.pixel-btn')) {
        document.querySelectorAll('.field-item').forEach(el => el.classList.remove('selected'));
        selectedField = null;
    }
});

// ---------- INIT ----------
function init() {
    if (!fields.back.find(f => f.label === 'Meme')) {
        fields.back.push({
            id: 'b1',
            label: 'Meme',
            value: "IT'S DONE BRO 😎",
            x: 20,
            y: 30,
            w: 200,
            h: 50,
        });
    }
    renderAll();
    console.log('🎮 Pixel + Cartoon ID Maker ready!');
}

init();