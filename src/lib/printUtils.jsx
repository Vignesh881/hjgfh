/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PosBill from '../components/PosBill_clean.jsx';
import { loadSettings } from './localStorage.js';
import DenominationBill from '../components/DenominationBill.jsx';

const RENDER_DPI = 96; // DOM renders at roughly 96 DPI
const TARGET_PRINT_DPI = 203; // Typical thermal printer DPI
const TARGET_WIDTH_MM = 80;
const TARGET_HEIGHT_MM = 150;
const TARGET_CANVAS_WIDTH_PX = Math.round((TARGET_WIDTH_MM / 25.4) * RENDER_DPI);
const TARGET_PRINT_WIDTH_PX = Math.round((TARGET_WIDTH_MM / 25.4) * TARGET_PRINT_DPI);
const TARGET_PRINT_MAX_HEIGHT_PX = Math.round((TARGET_HEIGHT_MM / 25.4) * TARGET_PRINT_DPI);
const CANVAS_NORMALIZE_THRESHOLD = 0.02; // avoid resampling when less than 2% difference

// Attempt to resolve a default POS printer name for direct prints
const resolveDefaultPrinterName = () => {
    try {
        if (typeof window !== 'undefined') {
            if (window.__MOIBOOK_PRINTER__ && typeof window.__MOIBOOK_PRINTER__ === 'string') {
                return window.__MOIBOOK_PRINTER__.trim();
            }
            const stored = window.localStorage?.getItem?.('moibook_printer_name');
            if (stored && stored.trim()) return stored.trim();
        }
    } catch (err) {
        // ignore
    }
    return '';
};

const resolveApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return '';
        
    }

    const globalUrl = typeof window.__MOIBOOK_API_URL__ === 'string' ? window.__MOIBOOK_API_URL__ : null;
    if (globalUrl && globalUrl.trim().length) {
        return globalUrl.replace(/\/$/, '');
    }

    try {
        const stored = window.localStorage?.getItem?.('moibook_api_url');
        if (stored && stored.trim().length) {
            return stored.replace(/\/$/, '');
        }
    } catch (err) {
        // Ignore storage access issues (private mode, etc.)
    }

    return 'http://localhost:3001/api';
};

const arrayBufferToBase64 = (buffer) => {
    // Convert ArrayBuffer to base64 in manageable chunks to avoid stack issues.
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, offset + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }
    return window.btoa(binary);

};

const renderPosBillCanvas = async (entry, event) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('POS printing is only available in browser environments.');
    }

    if (!entry || !event) {
        throw new Error('Entry and event details are required to render the POS bill.');
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.width = `${TARGET_CANVAS_WIDTH_PX}px`;
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.zIndex = '-1';
    container.style.fontFamily = "'Noto Sans Tamil','Latha','TAMu_Kadambri',Arial,sans-serif";
    container.style.overflow = 'visible';
    document.body.appendChild(container);

    const root = createRoot(container);
    const settings = loadSettings ? loadSettings() : {};

    await new Promise((resolve) => {
        root.render(
            <div style={{ width: `${TARGET_CANVAS_WIDTH_PX}px` }}>
                <PosBill entry={entry} event={event} settings={settings} />
            </div>
        );
        setTimeout(resolve, 200);
    });

    const targetNode = container.firstElementChild || container;
    const elementRect = targetNode.getBoundingClientRect();
    const elementWidthPx = elementRect.width || TARGET_CANVAS_WIDTH_PX;
    const effectiveScale = 1;
    let canvas;

    try {
        canvas = await html2canvas(targetNode, {
            scale: effectiveScale,
            useCORS: true,
            logging: false,
            backgroundColor: null,
            width: elementWidthPx,
            windowWidth: elementWidthPx,
            windowHeight: targetNode.scrollHeight || undefined,
            scrollX: 0,
            scrollY: 0
        });
    } finally {
        root.unmount();
        document.body.removeChild(container);
    }

    if (!canvas) {
        throw new Error('Failed to render the POS bill for printing.');
    }

    return canvas;
};

// Resize the rendered canvas to 80mm width with a 150mm height ceiling at 203 DPI so thermal output matches paper.
const normalizeCanvasForPrint = (canvas) => {
    if (!canvas || !canvas.width || !canvas.height) {
        return canvas;
    }

    const currentWidth = canvas.width;
    const currentHeight = canvas.height;
    const widthScale = TARGET_PRINT_WIDTH_PX / currentWidth;

    let appliedScale = widthScale;
    let scaledWidth = Math.max(1, Math.round(currentWidth * appliedScale));
    let scaledHeight = Math.max(1, Math.round(currentHeight * appliedScale));

    if (scaledHeight > TARGET_PRINT_MAX_HEIGHT_PX) {
        const heightScale = TARGET_PRINT_MAX_HEIGHT_PX / scaledHeight;
        appliedScale *= heightScale;
        scaledWidth = Math.max(1, Math.round(currentWidth * appliedScale));
        scaledHeight = Math.max(1, Math.round(currentHeight * appliedScale));
    }

    if (appliedScale > 1 || Math.abs(appliedScale - 1) < CANVAS_NORMALIZE_THRESHOLD) {
        return canvas;
    }

    const scaledCanvas = document.createElement('canvas');
    const paddedWidth = Math.min(TARGET_PRINT_WIDTH_PX, scaledWidth);
    const paddedHeight = Math.min(TARGET_PRINT_MAX_HEIGHT_PX, scaledHeight);
    scaledCanvas.width = paddedWidth;
    scaledCanvas.height = paddedHeight;
    const ctx = scaledCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
    ctx.drawImage(canvas, 0, 0, paddedWidth, paddedHeight);
    return scaledCanvas;
};

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
        if (blob) {
            resolve(blob);
        } else {
            reject(new Error('Failed to convert POS bill to image blob.'));
        }
    }, 'image/png', 1);
});

// Render denomination bill to canvas for direct POS printing
const renderDenominationBillCanvas = async ({ denominations, totalAmount, eventInfo = {}, receiptNumber = null }) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        throw new Error('POS printing is only available in browser environments.');
    }

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-10000px';
    container.style.top = '-10000px';
    container.style.width = `${TARGET_CANVAS_WIDTH_PX}px`;
    container.style.padding = '0';
    container.style.margin = '0';
    container.style.background = '#ffffff';
    container.style.zIndex = '-1';
    container.style.fontFamily = "'Noto Sans Tamil','Latha','TAMu_Kadambri',Arial,sans-serif";
    container.style.overflow = 'visible';
    document.body.appendChild(container);

    const root = createRoot(container);

    const receiptId = receiptNumber || `DN-${Date.now().toString().slice(-6)}`;

    await new Promise((resolve) => {
        root.render(
            <div style={{ width: `${TARGET_CANVAS_WIDTH_PX}px`, background: '#ffffff' }}>
                <DenominationBill
                    denominations={denominations}
                    totalAmount={totalAmount}
                    event={eventInfo}
                    receiptNumber={receiptId}
                />
            </div>
        );
        setTimeout(resolve, 200);
    });

    const targetNode = container.firstElementChild || container;
    const elementRect = targetNode.getBoundingClientRect();
    const elementWidthPx = elementRect.width || TARGET_CANVAS_WIDTH_PX;
    const effectiveScale = Math.min(2.5, Math.max(window.devicePixelRatio || 1, TARGET_PRINT_DPI / RENDER_DPI));
    let canvas;

    try {
        canvas = await html2canvas(targetNode, {
            scale: effectiveScale,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: elementWidthPx,
            windowWidth: elementWidthPx,
            windowHeight: targetNode.scrollHeight || undefined,
            scrollX: 0,
            scrollY: 0
        });
    } finally {
        root.unmount();
        document.body.removeChild(container);
    }

    if (!canvas) {
        throw new Error('Failed to render the denomination bill for printing.');
    }

    return canvas;
};

const createDenominationPrintAssets = async ({ denominations, totalAmount, eventInfo, receiptNumber }) => {
    const canvas = await renderDenominationBillCanvas({ denominations, totalAmount, eventInfo, receiptNumber });
    const normalizedCanvas = normalizeCanvasForPrint(canvas) || canvas;
    const imageBlob = await canvasToBlob(normalizedCanvas);
    return { imageBlob, mimeType: 'image/png' };
};

const canvasToPdfBase64 = (canvas) => {
    const dataUrl = canvas.toDataURL('image/png');
    const pdfWidthMm = 70;
    const aspectRatio = canvas.height && canvas.width ? canvas.height / canvas.width : 1.0;
    const calculatedHeight = aspectRatio * pdfWidthMm;
    const pdfHeightMm = Math.max(40, Math.min(TARGET_HEIGHT_MM, calculatedHeight));

    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidthMm, pdfHeightMm]
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);
    const pdfDataUri = pdf.output('datauristring');
    const base64Part = typeof pdfDataUri === 'string' ? pdfDataUri.split(',')[1] : '';
    return base64Part || '';
};

export const createPosBillPrintAssets = async (entry, event) => {
    const canvas = await renderPosBillCanvas(entry, event);
    const normalizedCanvas = normalizeCanvasForPrint(canvas) || canvas;
    const imageBlob = await canvasToBlob(normalizedCanvas);
    const pdfBase64 = canvasToPdfBase64(normalizedCanvas);

    return {
        imageBlob,
        pdfBase64,
        mimeType: 'image/png'
    };
};

export const createPosBillImageBlob = async (entry, event) => {
    const { imageBlob } = await createPosBillPrintAssets(entry, event);
    return imageBlob;
};

export const sendImageToPrinter = async ({ printerName, imageBlob = null, pdfBase64 = null, mimeType = null, jobLabel = null }) => {
    if (!printerName || typeof printerName !== 'string' || !printerName.trim()) {
        throw new Error('Printer name is required for direct print');
    }

    const apiBase = resolveApiBaseUrl();
    if (!apiBase) {
        throw new Error('API base URL not configured for printer service.');
    }

    const sanitizedBase = apiBase.replace(/\/+$/, '');
    const endpointBase = sanitizedBase.endsWith('/api') ? sanitizedBase : `${sanitizedBase}/api`;
    const endpoint = `${endpointBase}/printers/print`;

    const payload = {
        printerName: printerName.trim(),
        jobLabel: jobLabel || null
    };

    const hasPdf = typeof pdfBase64 === 'string' && pdfBase64.trim().length;
    const imageMime = typeof mimeType === 'string' ? mimeType.toLowerCase() : '';
    const preferImage = imageBlob instanceof Blob && (!imageMime || imageMime.includes('png') || imageMime.includes('jpg'));

    if (preferImage) {
        const arrayBuffer = await imageBlob.arrayBuffer();
        const resolvedMime = imageBlob.type && imageBlob.type.trim().length
            ? imageBlob.type
            : 'image/png';
        payload.imageBase64 = arrayBufferToBase64(arrayBuffer);
        payload.mimeType = resolvedMime;
    } else if (hasPdf) {
        payload.pdfBase64 = pdfBase64.trim();
        payload.mimeType = mimeType || 'application/pdf';
    } else {
        throw new Error('Valid imageBlob or pdfBase64 is required for direct print');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let details = null;
        let message = 'Printer request failed';
        try {
            const payload = await response.json();
            if (payload.error) {
                message = payload.error;
            }
            if (payload.details) {
                details = payload.details;
            }
        } catch (err) {
            // Ignore JSON parse errors and fall back to status text
            if (response.statusText) {
                message = response.statusText;
            }
        }

        const error = new Error(message);
        if (details) {
            error.details = details;
        }
        throw error;
    }

    return response.json();
};

// Batch print all entries for an event (sequential to avoid overloading printer)
export const batchPrintAllBills = async ({ entries = [], event = null, printerName = '', onProgress = () => {} }) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Entries are required for batch print');
    }
    if (!event) {
        throw new Error('Event is required for batch print');
    }
    if (!printerName || !printerName.trim()) {
        throw new Error('Printer name is required for batch print');
    }

    const results = [];
    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        try {
            const { imageBlob, pdfBase64, mimeType } = await createPosBillPrintAssets(entry, event);
            await sendImageToPrinter({ printerName, imageBlob, pdfBase64, mimeType, jobLabel: `Moi-${entry.memberId || entry.id || i + 1}` });
            results.push({ entryId: entry.id, status: 'ok' });
            onProgress({ current: i + 1, total: entries.length, entry });
        } catch (err) {
            results.push({ entryId: entry.id, status: 'error', error: err.message });
            onProgress({ current: i + 1, total: entries.length, entry, error: err });
        }
        // Small delay between jobs to keep printer stable
        await new Promise(res => setTimeout(res, 150));
    }
    return results;
};

export const printMoiReceipt = (entry, event) => {
    // Check if entry and event objects are valid to prevent errors
    if (!entry || !event) {
        console.error("Print Error: Invalid entry or event data provided.");
        return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Print Frame'); // for accessibility

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <html>
            <head>
                <title>Moi Receipt - 80mm POS</title>
                <meta charset="utf-8">
                <style>
                    /* 80mm Thermal Printer Optimized Styles */
                    @page {
                        size: 80mm 150mm;
                        margin: 0;
                        padding: 0;
                    }
                    
                    @media print {
                        body { 
                            margin: 0;
                            padding: 0;
                            font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace;
                            width: 80mm;
                            max-width: 302px;
                        }
                        
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                    
                    body {
                        font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace;
                        font-size: 9px;
                        line-height: 1.2;
                        margin: 0;
                        padding: 0;
                        background: white;
                        width: 80mm;
                        max-width: 302px;
                    }
                    
                    /* Ensure borders print */
                    .bordered {
                        border: 2px solid #000 !important;
                        background: white !important;
                    }
                    
                    /* Color preservation for headers */
                    .colored-bg {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    
                    .green-bg {
                        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%) !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    
                    .blue-bg {
                        background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%) !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                </style>
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div id="print-root"></div>
            </body>
        </html>
    `);
    iframeDoc.close();

    const printRoot = iframe.contentWindow.document.getElementById('print-root');
    const root = createRoot(printRoot);
    
    // Use a promise to ensure rendering completes before printing
    const renderPromise = new Promise(resolve => {
        root.render(<PosBill entry={entry} event={event} />);
        // A short timeout can help ensure styles are applied
        setTimeout(resolve, 300); 
    });

    renderPromise.then(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Clean up the iframe after a delay
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    });
};

// Print denomination bill for 80mm POS printer
export const printDenominationBill = async (denominations, totalAmount, eventInfo = null, receiptNumber = null) => {
    // Check if denominations object is valid
    if (!denominations || typeof denominations !== 'object') {
        console.error("Print Error: Invalid denominations data provided.");
        return;
    }

    const receiptId = receiptNumber || `DN-${Date.now().toString().slice(-6)}`;
    const printerName = resolveDefaultPrinterName();

    // Try direct print to configured POS printer if available
    if (printerName) {
        try {
            const { imageBlob, mimeType } = await createDenominationPrintAssets({
                denominations,
                totalAmount,
                eventInfo: eventInfo || {},
                receiptNumber: receiptId
            });
            await sendImageToPrinter({
                printerName,
                imageBlob,
                mimeType,
                jobLabel: receiptId
            });
            return;
        } catch (err) {
            console.warn('Direct denomination POS print failed, falling back to browser print', err);
        }
    }

    // Fallback to browser print dialog
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Denomination Print Frame');

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
        <html>
            <head>
                <title>Denomination Bill - 80mm POS</title>
                <meta charset="utf-8">
                <style>
                    /* 80mm Thermal Printer Optimized Styles */
                    @page {
                        size: 80mm auto;
                        margin: 0;
                        padding: 0;
                    }
                    
                    @media print {
                        body { 
                            margin: 0;
                            padding: 0;
                            font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace;
                            width: 80mm;
                            max-width: 302px;
                        }
                        
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                    }
                    
                    body {
                        font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', monospace;
                        font-size: 10px;
                        line-height: 1.2;
                        margin: 0;
                        padding: 0;
                        background: white;
                        width: 80mm;
                        max-width: 302px;
                    }
                    
                    /* Color preservation for headers */
                    .colored-bg {
                        background: #f8f9fa !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                    
                    .blue-bg {
                        background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%) !important;
                        color: white !important;
                        -webkit-print-color-adjust: exact;
                        color-adjust: exact;
                    }
                </style>
                <link
                    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <div id="print-root"></div>
            </body>
        </html>
    `);
    iframeDoc.close();

    const printRoot = iframe.contentWindow.document.getElementById('print-root');
    const root = createRoot(printRoot);
    
    const renderPromise = new Promise(resolve => {
        root.render(
            <DenominationBill 
                denominations={denominations}
                totalAmount={totalAmount}
                event={eventInfo}
                receiptNumber={receiptId}
            />
        );
        setTimeout(resolve, 300); 
    });

    renderPromise.then(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Clean up the iframe after a delay
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    });
};