// Initialize the invoice generator
document.addEventListener('DOMContentLoaded', function () {
    // Set default dates
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30);

    document.getElementById('invoiceDate').valueAsDate = today;
    document.getElementById('dueDate').valueAsDate = dueDate;

    // Initialize items
    initializeItems();

    // Set up event listeners
    setupEventListeners();

    // Generate initial preview
    updatePreview();

    // Calculate initial totals
    calculateTotals();

    // Show instructions modal on first visit
    setTimeout(() => {
        if (!localStorage.getItem('invoiceGeneratorSeen')) {
            document.getElementById('instructionsModal').classList.add('show');
        }
    }, 1000);
});

// Item management
let itemCounter = 0;

function initializeItems() {
    const itemsContainer = document.getElementById('itemsContainer');
    addItem(); // Add first item by default
}

function addItem() {
    itemCounter++;
    const itemsContainer = document.getElementById('itemsContainer');

    const itemDiv = document.createElement('div');
    itemDiv.className = 'item-row';
    itemDiv.id = `item-${itemCounter}`;
    itemDiv.dataset.itemId = itemCounter;

    itemDiv.innerHTML = `
        <input type="text" class="item-name" placeholder="Item description" value="Item ${itemCounter}">
        <input type="number" class="item-qty" placeholder="Quantity" value="1" min="0" step="1">
        <input type="number" class="item-rate" placeholder="Rate (LKR)" value="0" min="0" step="0.01">
        <input type="text" class="item-amount" placeholder="Amount" readonly>
        <button type="button" class="delete-item" onclick="removeItem(${itemCounter})">
            <i class="fas fa-trash"></i>
        </button>
    `;

    itemsContainer.appendChild(itemDiv);

    // Add event listeners for calculations
    const qtyInput = itemDiv.querySelector('.item-qty');
    const rateInput = itemDiv.querySelector('.item-rate');
    const amountInput = itemDiv.querySelector('.item-amount');

    const calculateAmount = () => {
        const qty = parseFloat(qtyInput.value) || 0;
        const rate = parseFloat(rateInput.value) || 0;
        const amount = qty * rate;
        amountInput.value = amount.toFixed(2);
        calculateTotals();
        updatePreview();
    };

    qtyInput.addEventListener('input', calculateAmount);
    rateInput.addEventListener('input', calculateAmount);

    // Initial calculation
    calculateAmount();
}

function removeItem(id) {
    const itemToRemove = document.getElementById(`item-${id}`);
    if (itemToRemove) {
        itemToRemove.remove();
        calculateTotals();
        updatePreview();
    }
}

function calculateTotals() {
    let subtotal = 0;
    const itemRows = document.querySelectorAll('.item-row');

    itemRows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const amount = qty * rate;
        subtotal += amount;
    });

    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    // Update display
    document.getElementById('subtotalDisplay').textContent = `LKR ${subtotal.toFixed(2)}`;
    document.getElementById('taxRateDisplay').textContent = taxRate;
    document.getElementById('taxDisplay').textContent = `LKR ${tax.toFixed(2)}`;
    document.getElementById('totalDisplay').textContent = `LKR ${total.toFixed(2)}`;

    return { subtotal, tax, total };
}

// Event listeners setup
function setupEventListeners() {
    // Add item button
    document.getElementById('addItemBtn').addEventListener('click', addItem);

    // Update preview button
    document.getElementById('updatePreviewBtn').addEventListener('click', updatePreview);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetForm);

    // Download PDF button
    document.getElementById('downloadBtn').addEventListener('click', generatePDF);

    // Tax rate change
    document.getElementById('taxRate').addEventListener('input', function () {
        calculateTotals();
        updatePreview();
    });

    // Auto-update preview on input changes
    const inputsToWatch = [
        'companyName', 'businessEmail', 'businessAddress', 'businessCity',
        'businessPhone', 'gstNumber', 'customerName', 'customerEmail',
        'customerAddress', 'customerCity', 'customerPhone', 'invoiceNumber',
        'invoiceDate', 'dueDate', 'notes'
    ];

    inputsToWatch.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });

    // Modal functionality
    const modal = document.getElementById('instructionsModal');
    const closeModal = document.getElementById('closeModal');
    const startCreatingBtn = document.getElementById('startCreatingBtn');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('show');
            localStorage.setItem('invoiceGeneratorSeen', 'true');
        });
    }

    if (startCreatingBtn) {
        startCreatingBtn.addEventListener('click', () => {
            modal.classList.remove('show');
            localStorage.setItem('invoiceGeneratorSeen', 'true');
            // Focus on first input
            document.getElementById('companyName').focus();
        });
    }

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            localStorage.setItem('invoiceGeneratorSeen', 'true');
        }
    });
}

// Update the preview with light cream color
function updatePreview() {
    const preview = document.getElementById('invoicePreview');
    const totals = calculateTotals();

    // Format dates
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Get current items
    const itemRows = document.querySelectorAll('.item-row');
    const itemsHTML = Array.from(itemRows).map((row, index) => {
        const name = row.querySelector('.item-name').value || `Item ${index + 1}`;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        const amount = qty * rate;

        return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e8dfd3;">${name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e8dfd3; text-align: center;">${qty}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e8dfd3; text-align: right;">LKR ${rate.toFixed(2)}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e8dfd3; text-align: right;">LKR ${amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;

    preview.innerHTML = `
        <div class="invoice-preview">
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px; padding-bottom: 25px; border-bottom: 2px solid #e8dfd3; position: relative;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
                    <!-- YOUR LOGO GOES HERE -->
                    <img src="logo.png" alt="ORO MANTRA Logo" style="width: 80px; height: 80px; object-fit: contain;">
                    
                    <div>
                        <h1 style="color: #b8860b; font-family: 'Georgia', 'Times New Roman', serif; font-size: 3.2rem; margin: 0; font-weight: 700; letter-spacing: 1.5px;">${document.getElementById('companyName').value || 'ORO MANTRA'}</h1>
                        <p style="color: #8b6914; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 1.4rem; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; margin: 15px 0 0 0; padding: 10px 0; border-top: 2px solid rgba(184, 134, 11, 0.2);">
                            Experience luxury in every day
                        </p>
                    </div>
                </div>
            </div>
            
            <!-- Invoice Meta -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding: 25px; background: linear-gradient(135deg, #f8f4e9, #fffdf6); border-radius: 10px; border: 1px solid #e8dfd3; border-left: 5px solid #b8860b;">
                <div>
                    <p style="margin: 8px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Invoice #:</strong> ${document.getElementById('invoiceNumber').value || 'INV-2602-220'}</p>
                    <p style="margin: 8px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Date:</strong> ${formatDate(document.getElementById('invoiceDate').value)}</p>
                    <p style="margin: 8px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Due Date:</strong> ${formatDate(document.getElementById('dueDate').value)}</p>
                </div>
                <div>
                    <p style="margin: 8px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">GST Number:</strong> ${document.getElementById('gstNumber').value || '22AAAAA0000A1Z5'}</p>
                    <p style="margin: 8px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Email:</strong> ${document.getElementById('businessEmail').value || 'hello@oromantra.com'}</p>
                </div>
            </div>
            
            <!-- Business & Customer Details -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #fdfaf5, #fffdf9); border-radius: 10px; border: 1px solid #e8dfd3;">
                <div>
                    <h3 style="color: #8b6914; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e8dfd3; font-family: 'Georgia', serif; font-size: 1.4rem; font-weight: 600;">Business Details</h3>
                    <p style="margin: 10px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1.05rem; line-height: 1.5;"><strong>${document.getElementById('companyName').value || 'ORO MANTRA'}</strong></p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('businessAddress').value || '123 Business Street'}</p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('businessCity').value || 'Mumbai, Maharashtra 400001'}</p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('businessPhone').value || '+91 98765 43210'}</p>
                </div>
                <div>
                    <h3 style="color: #8b6914; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e8dfd3; font-family: 'Georgia', serif; font-size: 1.4rem; font-weight: 600;">Bill To</h3>
                    <p style="margin: 10px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1.05rem; line-height: 1.5;"><strong>${document.getElementById('customerName').value || 'John Doe'}</strong></p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('customerAddress').value || '456 Customer Lane'}</p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('customerCity').value || 'Colombo, 00100'}</p>
                    <p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('customerPhone').value || '+94 11 234 5678'}</p>
                    ${document.getElementById('customerEmail').value ? `<p style="margin: 8px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 1rem; line-height: 1.5;">${document.getElementById('customerEmail').value}</p>` : ''}
                </div>
            </div>
            
            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 40px 0; border-radius: 8px; overflow: hidden; border: 1px solid #e8dfd3; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <thead>
                    <tr>
                        <th style="background: linear-gradient(135deg, #b8860b, #8b6914); color: white; padding: 18px; text-align: left; font-family: 'Georgia', serif; font-weight: 600; font-size: 1.1rem;">DESCRIPTION</th>
                        <th style="background: linear-gradient(135deg, #b8860b, #8b6914); color: white; padding: 18px; text-align: center; font-family: 'Georgia', serif; font-weight: 600; font-size: 1.1rem;">QTY</th>
                        <th style="background: linear-gradient(135deg, #b8860b, #8b6914); color: white; padding: 18px; text-align: right; font-family: 'Georgia', serif; font-weight: 600; font-size: 1.1rem;">RATE (LKR)</th>
                        <th style="background: linear-gradient(135deg, #b8860b, #8b6914); color: white; padding: 18px; text-align: right; font-family: 'Georgia', serif; font-weight: 600; font-size: 1.1rem;">AMOUNT (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <!-- Totals -->
            <div style="margin-top: 40px; padding: 30px; background: linear-gradient(135deg, #f8f4e9, #fffdf6); border-radius: 10px; border: 2px solid #e8dfd3;">
                <div style="display: flex; justify-content: space-between; margin: 15px 0; font-family: 'Georgia', serif; font-size: 1.3rem; padding: 12px 0; color: #5a4a42;">
                    <span>Subtotal:</span>
                    <span style="font-weight: 600;">LKR ${totals.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; font-family: 'Georgia', serif; font-size: 1.3rem; padding: 12px 0; color: #5a4a42;">
                    <span>Tax (${taxRate}%):</span>
                    <span style="font-weight: 600;">LKR ${totals.tax.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; font-family: 'Georgia', serif; font-size: 1.8rem; font-weight: 700; color: #b8860b; padding: 20px 0; border-top: 3px solid #b8860b;">
                    <span>Total Amount:</span>
                    <span>LKR ${totals.total.toFixed(2)}</span>
                </div>
            </div>
            
            <!-- Notes -->
            <div style="margin-top: 40px; padding: 25px; background: linear-gradient(135deg, #fff8e1, #fffef5); border-radius: 10px; border-left: 5px solid #ffc107; border: 1px solid #f0e6d3;">
                <h4 style="color: #8b6914; margin-bottom: 15px; font-family: 'Georgia', serif; font-size: 1.3rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-sticky-note"></i> Notes
                </h4>
                <p style="color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.6; margin: 0; font-size: 1.05rem;">${document.getElementById('notes').value || 'Thank you for your business! Please make payment within the due date.'}</p>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e8dfd3; text-align: center; color: #a89c91; font-size: 0.9rem;">
                <p>Generated by ORO MANTRA Invoice Generator • ${formatDate(new Date())}</p>
            </div>
        </div>
    `;
}

// Reset form
function resetForm() {
    if (confirm('Are you sure you want to reset all fields to default values?')) {
        // Reset form fields
        document.getElementById('companyName').value = 'ORO MANTRA';
        document.getElementById('businessEmail').value = 'hello@oromantra.com';
        document.getElementById('businessAddress').value = '123 Business Street';
        document.getElementById('businessCity').value = 'Mumbai, Maharashtra 400001';
        document.getElementById('businessPhone').value = '+91 98765 43210';
        document.getElementById('gstNumber').value = '22AAAAA0000A1Z5';
        document.getElementById('customerName').value = 'John Doe';
        document.getElementById('customerEmail').value = 'customer@email.com';
        document.getElementById('customerAddress').value = '456 Customer Lane';
        document.getElementById('customerCity').value = 'Colombo, 00100';
        document.getElementById('customerPhone').value = '+94 11 234 5678';

        // Generate new invoice number
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 1000);
        document.getElementById('invoiceNumber').value = `INV-${year}${month}-${randomNum}`;

        // Set dates
        document.getElementById('invoiceDate').valueAsDate = new Date();
        const due = new Date();
        due.setDate(due.getDate() + 30);
        document.getElementById('dueDate').valueAsDate = due;

        document.getElementById('taxRate').value = '18';
        document.getElementById('notes').value = 'Thank you for your business! Please make payment within the due date.';

        // Reset items
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = '';
        itemCounter = 0;
        addItem();

        // Update calculations and preview
        calculateTotals();
        updatePreview();

        // Show success message
        showNotification('Form reset successfully!', 'success');
    }
}

// Generate PDF with single invoice and light cream color
async function generatePDF() {
    const { jsPDF } = window.jspdf;

    // Show loading
    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;

    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;

    try {
        // Create a temporary div for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 800px;
            background: #fffaf0;
            color: #5a4a42;
            font-family: 'Arial', sans-serif;
            padding: 40px;
            box-sizing: border-box;
            opacity: 1;
        `;

        // Get invoice data
        const totals = calculateTotals();
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;

        // Format dates
        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        // Get items HTML
        const itemRows = document.querySelectorAll('.item-row');
        const itemsHTML = Array.from(itemRows).map((row, index) => {
            const name = row.querySelector('.item-name').value || `Item ${index + 1}`;
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amount = qty * rate;

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #d4c9b8;">${name}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #d4c9b8; text-align: center;">${qty}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #d4c9b8; text-align: right;">LKR ${rate.toFixed(2)}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #d4c9b8; text-align: right;">LKR ${amount.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        // Build PDF HTML with updated fonts and styling
        tempDiv.innerHTML = `
            <div id="pdfInvoice" style="width: 100%; background: #fffaf0; color: #5a4a42;">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #d4c9b8;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px;">
                        <!-- YOUR LOGO GOES HERE FOR PDF -->
                        <img src="logo.png" alt="ORO MANTRA Logo" style="width: 70px; height: 70px; object-fit: contain;">
                        
                        <div>
                            <h1 style="color: #b8860b; font-family: 'Georgia', 'Times New Roman', serif; font-size: 36px; margin: 0; font-weight: 700; letter-spacing: 1.5px;">${document.getElementById('companyName').value || 'ORO MANTRA'}</h1>
                            <p style="color: #8b6914; font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase; margin: 12px 0 0 0; padding: 8px 0; border-top: 2px solid rgba(184, 134, 11, 0.2);">
                                Experience luxury in every day
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Invoice Meta -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #f8f4e9; border-radius: 8px; border: 1px solid #d4c9b8; border-left: 5px solid #b8860b;">
                    <div>
                        <p style="margin: 5px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Invoice #:</strong> ${document.getElementById('invoiceNumber').value || 'INV-2602-220'}</p>
                        <p style="margin: 5px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Date:</strong> ${formatDate(document.getElementById('invoiceDate').value)}</p>
                        <p style="margin: 5px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Due Date:</strong> ${formatDate(document.getElementById('dueDate').value)}</p>
                    </div>
                    <div>
                        <p style="margin: 5px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px;"><strong style="color: #8b6914; font-family: 'Georgia', serif;">Email:</strong> ${document.getElementById('businessEmail').value || 'hello@oromantra.com'}</p>
                    </div>
                </div>
                
                <!-- Business & Customer Details -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; padding: 25px; background: #fdfaf5; border-radius: 8px; border: 1px solid #d4c9b8;">
                    <div>
                        <h3 style="color: #8b6914; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #d4c9b8; font-family: 'Georgia', serif; font-size: 18px; font-weight: 600;">Business Details</h3>
                        <p style="margin: 6px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px; line-height: 1.4;"><strong>${document.getElementById('companyName').value || 'ORO MANTRA'}</strong></p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('businessAddress').value || '123 Business Street'}</p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('businessCity').value || 'Mumbai, Maharashtra 400001'}</p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('businessPhone').value || '+91 98765 43210'}</p>
                    </div>
                    <div>
                        <h3 style="color: #8b6914; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #d4c9b8; font-family: 'Georgia', serif; font-size: 18px; font-weight: 600;">Bill To</h3>
                        <p style="margin: 6px 0; color: #5a4a42; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 14px; line-height: 1.4;"><strong>${document.getElementById('customerName').value || 'John Doe'}</strong></p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('customerAddress').value || '456 Customer Lane'}</p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('customerCity').value || 'Colombo, 00100'}</p>
                        <p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('customerPhone').value || '+94 11 234 5678'}</p>
                        ${document.getElementById('customerEmail').value ? `<p style="margin: 5px 0; color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 13px; line-height: 1.4;">${document.getElementById('customerEmail').value}</p>` : ''}
                    </div>
                </div>
                
                <!-- Items Table -->
                <table style="width: 100%; border-collapse: collapse; margin: 30px 0; border: 1px solid #d4c9b8; background: white;">
                    <thead>
                        <tr>
                            <th style="background: #b8860b; color: white; padding: 12px; text-align: left; font-family: 'Georgia', serif; font-weight: 600; font-size: 14px; border: 1px solid #a67c00;">DESCRIPTION</th>
                            <th style="background: #b8860b; color: white; padding: 12px; text-align: center; font-family: 'Georgia', serif; font-weight: 600; font-size: 14px; border: 1px solid #a67c00;">QTY</th>
                            <th style="background: #b8860b; color: white; padding: 12px; text-align: right; font-family: 'Georgia', serif; font-weight: 600; font-size: 14px; border: 1px solid #a67c00;">RATE (LKR)</th>
                            <th style="background: #b8860b; color: white; padding: 12px; text-align: right; font-family: 'Georgia', serif; font-weight: 600; font-size: 14px; border: 1px solid #a67c00;">AMOUNT (LKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                
                <!-- Totals -->
                <div style="margin-top: 30px; padding: 20px; background: #f8f4e9; border-radius: 8px; border: 2px solid #d4c9b8;">
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-family: 'Georgia', serif; font-size: 15px; padding: 8px 0; color: #5a4a42;">
                        <span>Subtotal:</span>
                        <span style="font-weight: 600;">LKR ${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-family: 'Georgia', serif; font-size: 15px; padding: 8px 0; color: #5a4a42;">
                        <span>Tax (${taxRate}%):</span>
                        <span style="font-weight: 600;">LKR ${totals.tax.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-family: 'Georgia', serif; font-size: 20px; font-weight: 700; color: #b8860b; padding: 12px 0; border-top: 3px solid #b8860b;">
                        <span>Total Amount:</span>
                        <span>LKR ${totals.total.toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Notes -->
                <div style="margin-top: 30px; padding: 20px; background: #fff8e1; border-radius: 8px; border-left: 5px solid #ffc107; border: 1px solid #f0e6d3;">
                    <h4 style="color: #8b6914; margin-bottom: 12px; font-family: 'Georgia', serif; font-size: 18px;">Notes</h4>
                    <p style="color: #7d6b5a; font-family: 'Arial', 'Helvetica', sans-serif; line-height: 1.5; margin: 0; font-size: 14px;">${document.getElementById('notes').value || 'Thank you for your business! Please make payment within the due date.'}</p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #d4c9b8; text-align: center; color: #a89c91; font-size: 11px;">
                    <p>Generated by ORO MANTRA Invoice Generator • ${formatDate(new Date())}</p>
                </div>
            </div>
        `;

        // Add to body temporarily
        document.body.appendChild(tempDiv);

        // Generate PDF
        const canvas = await html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#fffaf0',
            logging: false,
            onclone: (clonedDoc, element) => {
                // Ensure all elements have proper styling
                const allElements = element.querySelectorAll('*');
                allElements.forEach(el => {
                    el.style.backgroundColor = getComputedStyle(el).backgroundColor || '#fffaf0';
                    el.style.color = getComputedStyle(el).color || '#5a4a42';
                    el.style.opacity = '1';
                });
            }
        });

        // Remove temp div
        document.body.removeChild(tempDiv);

        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 20; // 10mm margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add to PDF
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

        // Save PDF
        const invoiceNumber = document.getElementById('invoiceNumber').value || 'invoice';
        const fileName = `ORO-MANTRA-Invoice-${invoiceNumber}.pdf`;
        pdf.save(fileName);

        showNotification('Invoice PDF downloaded successfully!', 'success');

    } catch (error) {
        console.error('PDF Generation Error:', error);
        showNotification('Error generating PDF. Please try again.', 'error');
    } finally {
        // Restore button
        downloadBtn.innerHTML = originalText;
        downloadBtn.disabled = false;
    }
}

// Utility function to show notifications
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        font-family: 'Poppins', sans-serif;
        font-size: 0.95rem;
    `;

    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function (e) {
    // Ctrl + S to update preview
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        updatePreview();
        showNotification('Preview updated!', 'info');
    }

    // Ctrl + D to download PDF
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        generatePDF();
    }

    // Ctrl + N to add new item
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        addItem();
        showNotification('New item added!', 'info');
    }
});