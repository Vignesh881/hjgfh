/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Export utilities for MoiBook - CSP-Safe Version with MoiReport Component Integration
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import React from 'react';
import ReactDOM from 'react-dom/client';
import MoiReport from '../components/MoiReport';

/**
 * Export Professional Moi Report as Tamil PDF (Using Browser Print Dialog)
 * Opens the full MoiReport component in a print preview window
 * @param {Array} moiEntries - All moi entries
 * @param {Object} event - Event details
 * @param {string} fileName - Optional filename (without extension)
 */
export const exportTamilPdf = async (moiEntries, event, fileName) => {
    try {
        // Filter only moi entries
        const moiOnlyEntries = moiEntries.filter(e => !e.type);
        
        if (moiOnlyEntries.length === 0) {
            alert('மொய் பதிவுகள் இல்லை / No Moi entries to export');
            return;
        }
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'pdf-loading-indicator';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px 60px;
            border-radius: 15px;
            font-size: 20px;
            z-index: 10000;
            font-family: "Noto Sans Tamil", Arial, sans-serif;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
            <div>PDF உருவாக்கப்படுகிறது...</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Preparing report...</div>
        `;
        document.body.appendChild(loadingDiv);
        
        // Create a temporary container for MoiReport rendering
        const printContainer = document.createElement('div');
        printContainer.id = 'moi-report-print-container';
        printContainer.style.cssText = `
            position: fixed;
            top: -20000px;
            left: 0;
            width: 210mm;
            background: white;
            font-family: "Noto Sans Tamil", "Latha", "TAMu_Kadambri", Arial, sans-serif;
        `;
        document.body.appendChild(printContainer);
        
        // Render MoiReport component into the container
        const root = ReactDOM.createRoot(printContainer);
        
        // Wait for component to render
        await new Promise((resolve) => {
            root.render(
                React.createElement(MoiReport, {
                    moiEntries: moiOnlyEntries,
                    event: event,
                    includeEventDetails: true,
                    includeTableOfContents: true
                })
            );
            
            // Give React time to render
            setTimeout(resolve, 4000);
        });
        
        // Wait additional time for all content to settle
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get all pages from the rendered report
        const pages = printContainer.querySelectorAll('.page');
        
        console.log(`📄 Found ${pages.length} pages to export`);
        
        if (pages.length === 0) {
            throw new Error('No pages found to export');
        }
        
        // Update loading
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
            <div>PDF உருவாக்கப்படுகிறது...</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Processing ${pages.length} pages...</div>
        `;
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Process each page
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const originalFilter = page.style.filter;
            const originalColor = page.style.color;
            const originalWebkitPrintColorAdjust = page.style.webkitPrintColorAdjust;
            const originalPrintColorAdjust = page.style.printColorAdjust;

            // Make pages after the first grayscale/black
            if (i > 0) {
                page.style.filter = 'grayscale(100%)';
                page.style.color = '#000000';
                page.style.webkitPrintColorAdjust = 'economy';
                page.style.printColorAdjust = 'economy';
            }
            
            // Update progress
            loadingDiv.innerHTML = `
                <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
                <div>PDF உருவாக்கப்படுகிறது...</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Processing page ${i + 1} of ${pages.length}...</div>
            `;
            
            // Convert page to canvas (lower scale to reduce size)
            const canvas = await html2canvas(page, {
                scale: 1.2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            // Use JPEG with compression to keep PDF under ~10MB
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Restore original styles
            page.style.filter = originalFilter;
            page.style.color = originalColor;
            page.style.webkitPrintColorAdjust = originalWebkitPrintColorAdjust;
            page.style.printColorAdjust = originalPrintColorAdjust;

            if (i > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, pageHeight);
        }
        
        // Clean up
        root.unmount();
        document.body.removeChild(printContainer);
        document.body.removeChild(loadingDiv);
        
        // Save PDF
        const pdfFileName = fileName ? `${fileName}.pdf` : 'MoiReport.pdf';
        pdf.save(pdfFileName);
        
        alert(`✅ PDF சேமிக்கப்பட்டது!\n\n${pdfFileName}\n\n${pages.length} pages exported successfully!`);
        
    } catch (error) {
        console.error('PDF export error:', error);
        alert('PDF உருவாக்குவதில் பிழை ஏற்பட்டது: ' + error.message);
        
        // Clean up on error
        const loadingDiv = document.getElementById('pdf-loading-indicator');
        if (loadingDiv) document.body.removeChild(loadingDiv);
        
        const printContainer = document.getElementById('moi-report-print-container');
        if (printContainer) document.body.removeChild(printContainer);
    }
};

/**
 * Generate Moi Report PDF as Blob for sharing
 * @returns {Promise<{blob: Blob, fileName: string, pageCount: number}>}
 */
export const exportTamilPdfForShare = async (moiEntries, event, fileName) => {
    try {
        const moiOnlyEntries = moiEntries.filter(e => !e.type);

        if (moiOnlyEntries.length === 0) {
            alert('மொய் பதிவுகள் இல்லை / No Moi entries to export');
            return null;
        }

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'pdf-loading-indicator';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 40px 60px;
            border-radius: 15px;
            font-size: 20px;
            z-index: 10000;
            font-family: "Noto Sans Tamil", Arial, sans-serif;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        `;
        loadingDiv.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
            <div>PDF உருவாக்கப்படுகிறது...</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Preparing report...</div>
        `;
        document.body.appendChild(loadingDiv);

        const printContainer = document.createElement('div');
        printContainer.id = 'moi-report-print-container';
        printContainer.style.cssText = `
            position: fixed;
            top: -20000px;
            left: 0;
            width: 210mm;
            background: white;
            font-family: "Noto Sans Tamil", "Latha", "TAMu_Kadambri", Arial, sans-serif;
        `;
        document.body.appendChild(printContainer);

        const root = ReactDOM.createRoot(printContainer);

        await new Promise((resolve) => {
            root.render(
                React.createElement(MoiReport, {
                    moiEntries: moiOnlyEntries,
                    event: event,
                    includeEventDetails: true,
                    includeTableOfContents: true
                })
            );
            setTimeout(resolve, 4000);
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        const pages = printContainer.querySelectorAll('.page');

        if (pages.length === 0) {
            throw new Error('No pages found to export');
        }

        loadingDiv.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
            <div>PDF உருவாக்கப்படுகிறது...</div>
            <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Processing ${pages.length} pages...</div>
        `;

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const originalFilter = page.style.filter;
            const originalColor = page.style.color;
            const originalWebkitPrintColorAdjust = page.style.webkitPrintColorAdjust;
            const originalPrintColorAdjust = page.style.printColorAdjust;

            if (i > 0) {
                page.style.filter = 'grayscale(100%)';
                page.style.color = '#000000';
                page.style.webkitPrintColorAdjust = 'economy';
                page.style.printColorAdjust = 'economy';
            }

            loadingDiv.innerHTML = `
                <div style="margin-bottom: 15px; font-size: 24px;">📄</div>
                <div>PDF உருவாக்கப்படுகிறது...</div>
                <div style="font-size: 14px; margin-top: 10px; opacity: 0.8;">Processing page ${i + 1} of ${pages.length}...</div>
            `;

            const canvas = await html2canvas(page, {
                scale: 1.2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            page.style.filter = originalFilter;
            page.style.color = originalColor;
            page.style.webkitPrintColorAdjust = originalWebkitPrintColorAdjust;
            page.style.printColorAdjust = originalPrintColorAdjust;

            if (i > 0) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, pageHeight);
        }

        const blob = pdf.output('blob');
        const pdfFileName = fileName ? `${fileName}.pdf` : 'MoiReport.pdf';

        root.unmount();
        document.body.removeChild(printContainer);
        document.body.removeChild(loadingDiv);

        return { blob, fileName: pdfFileName, pageCount: pages.length };
    } catch (error) {
        console.error('PDF export error:', error);
        alert('PDF உருவாக்குவதில் பிழை ஏற்பட்டது: ' + error.message);

        const loadingDiv = document.getElementById('pdf-loading-indicator');
        if (loadingDiv) document.body.removeChild(loadingDiv);

        const printContainer = document.getElementById('moi-report-print-container');
        if (printContainer) document.body.removeChild(printContainer);

        return null;
    }
};

/**
 * Export Town-based PDF Report (Uses same MoiReport component)
 */
export const exportTownBasedPdf = async (moiEntries, event, fileName) => {
    return exportTamilPdf(moiEntries, event, fileName);
};

/**
 * Export to Excel with Tamil support
 */
export const exportToExcel = (entries, event, fileName) => {
    try {
        const moiOnlyEntries = entries.filter(e => !e.type);
        
        if (moiOnlyEntries.length === 0) {
            alert('மொய் பதிவுகள் இல்லை / No Moi entries to export');
            return;
        }
        
        // Prepare data for export
        const data = moiOnlyEntries.map((entry, index) => ({
            'வரிசை எண்': index + 1,
            'ஊர்': entry.town || '',
            'தெரு/ இருப்பு': entry.street || '',
            'பெயர்': `${entry.relationship || ''} ${entry.name || ''}${entry.isMaternalUncle ? ' (*)' : ''}`.trim(),
            'கல்வி': entry.education || '',
            'தொழில்': entry.profession || '',
            'தொலைபேசி': entry.phone || '',
            'தொகை': entry.amount || 0,
            'குறிப்பு': entry.note || ''
        }));
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 10 }, // வரிசை எண்
            { wch: 15 }, // ஊர்
            { wch: 15 }, // தெரு
            { wch: 25 }, // பெயர்
            { wch: 15 }, // கல்வி
            { wch: 15 }, // தொழில்
            { wch: 15 }, // தொலைபேசி
            { wch: 12 }, // தொகை
            { wch: 30 }  // குறிப்பு
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, 'மொய் பதிவுகள்');
        
        // Generate filename
        const excelFileName = fileName ? `${fileName}.xlsx` : 'MoiReport.xlsx';
        
        // Save file
        XLSX.writeFile(wb, excelFileName);
        
        console.log(`✅ Excel exported successfully as: ${excelFileName}`);
        
    } catch (error) {
        console.error('Excel export error:', error);
        alert('Excel உருவாக்கம் தோல்வியடைந்தது / Excel export failed');
    }
};

/**
 * Export Tamil Word Document
 */
export const exportTamilWord = async (entries, event, fileName) => {
    const moiOnlyEntries = entries.filter(e => !e.type);
    
    try {
        const orgAddress = event?.organizationAddress || event?.organization_address || event?.orgAddress || event?.address || '';
        const orgPhone = event?.organizationPhone || event?.organization_phone || event?.orgPhone || event?.phone || '';

        // Create simple Word document with Tamil content
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "மொய் புத்தக அறிக்கை",
                                bold: true,
                                size: 32
                            }),
                        ],
                        alignment: 'center',
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: orgAddress,
                                size: 20
                            })
                        ],
                        alignment: 'center',
                        spacing: { after: 200 }
                    }),
                    orgPhone ? new Paragraph({
                        children: [
                            new TextRun({
                                text: `தொலைபேசி: ${orgPhone}`,
                                size: 20
                            })
                        ],
                        alignment: 'center',
                        spacing: { after: 300 }
                    }) : new Paragraph({ text: '' }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `நிகழ்வு: ${event.eventName || 'நிகழ்வு பெயர்'}`,
                                size: 24
                            }),
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `தேதி: ${event.date || ''}` , size: 22 }),
                            new TextRun({ text: `   நேரம்: ${event.time || ''}`, size: 22 }),
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `இடம்: ${event.venue || ''}, ${event.place || ''}`, size: 22 }),
                        ],
                        spacing: { after: 300 }
                    }),
                ]
            }]
        });
        
        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName ? `${fileName}.docx` : 'MoiReport.docx';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('Tamil Word document exported successfully');
        
    } catch (error) {
        console.error('Tamil Word export failed:', error);
        alert('Word document export failed. Please try again.');
    }
};
