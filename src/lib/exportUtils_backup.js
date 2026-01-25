/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
/**
 * Export utilities for MoiBook
 */

import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { NotoSansTamilBase64 } from '../lib/TamilFont.js';
import ReactDOMServer from 'react-dom/server';
import React from 'react';

const prepareDataForExport = (entries) => {
    const moiOnlyEntries = entries.filter(e => !e.type);
    return moiOnlyEntries.map(entry => ({
        'வரிசை எண்': `${entry.table ? entry.table.replace('table', 'T').toUpperCase() : 'T?'}-${entry.id}`,
        'ஊர்': entry.town || '',
        'தெரு/ இருப்பு': entry.street || '',
        'பெயர்': `${entry.relationship || ''} ${entry.name || ''}${entry.isMaternalUncle ? ' (*)' : ''}`.trim(),
        'தொலைபேசி': entry.phone || '',
        'தொகை': entry.amount || 0,
    }));
};

// Simple Tamil Word document export function
export const exportTamilWord = async (entries, event, fileName) => {
    const moiOnlyEntries = entries.filter(e => !e.type);
    
    try {
        // Create simple Word document with Tamil content
        const doc = new Document({
            sections: [{
                children: [
                    // Header
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "மொய் புத்தக அறிக்கை",
                                bold: true,
                                size: 32
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    
                    // Event details
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `நிகழ்வு: ${event.eventName || 'நிகழ்வு பெயர்'}`,
                                size: 24
                            }),
                        ],
                        spacing: { after: 200 }
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
        
        // Professional filename with Event ID and Date
        const eventId = event.id || event.eventName?.substring(0, 10) || 'EVENT';
        const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const safeFileName = fileName || `மொய்-${eventId}-${eventDate}`;
        link.download = `${safeFileName}.docx`;
        
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

// Tamil HTML export for perfect font rendering
export const exportTamilPdf = async (entries, event, fileName) => {
    const moiOnlyEntries = entries.filter(e => !e.type);
    
    // Group entries by town
    const groupedEntries = {};
    moiOnlyEntries.forEach(entry => {
        const town = entry.town || 'மற்றவை';
        if (!groupedEntries[town]) {
            groupedEntries[town] = [];
        }
        groupedEntries[town].push(entry);
    });
    
    // Build town sections as simple string concatenation
    let townSections = '';
    let entryIndex = 1;
    
    Object.entries(groupedEntries).forEach(([town, entries], townIdx) => {
        const townTotal = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
        
        let entryRows = '';
        entries.forEach((entry) => {
            const nameText = `${entry.relationship || ''} ${entry.name || ''}${entry.isMaternalUncle ? ' (மாமன்)' : ''}`.trim() || 'பெயர் இல்லை';
            entryRows = entryRows + `
                <div class="entry-row">
                    <span class="entry-number">${entryIndex}.</span>
                    <span class="entry-name">${nameText}</span>
                    <span class="entry-amount">₹ ${(entry.amount || 0).toLocaleString('en-IN')}</span>
                </div>
            `;
            entryIndex++;
        });
        
        townSections = townSections + `
            <div class="town-group">
                <div class="town-header">${townIdx + 1}. ${town} (${entries.length})</div>
                ${entryRows}
                <div class="town-total">மொத்தம்: ₹ ${townTotal.toLocaleString('en-IN')}</div>
            </div>
        `;
    });
    
    const grandTotal = moiOnlyEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    
    // Event details with safe fallbacks
    const eventName = event.eventName || 'நிகழ்வு பெயர்';
    const eventDate = event.date ? new Date(event.date).toLocaleDateString('ta-IN') : 'நாள் இல்லை';
    const eventVenue = event.venue || 'இடம் இல்லை';
    const eventPlace = event.place || 'ஊர் இல்லை';
    const eventHead = event.eventHead || 'நிகழ்வு தலைவர்';
    const eventOrganizer = event.eventOrganizer || 'அமைப்பாளர்';
    
    // Generate filename for document title
    const documentTitle = fileName || 'மொய்_புத்தக_அறிக்கை';
    
    // Build HTML content as simple string concatenation for better compatibility
    let htmlContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + documentTitle + '</title><style>';
    htmlContent = htmlContent + '@page { margin: 15mm; size: A4; }';
    htmlContent = htmlContent + '@media print { .no-print { display: none !important; } }';
    htmlContent = htmlContent + 'body { font-family: "Noto Sans Tamil", "Latha", "TAMu_Kadambri", Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.4; }';
    htmlContent = htmlContent + '.header { text-align: center; border: 2px solid #C86432; padding: 20px; margin-bottom: 20px; background: #f9f9f9; }';
    htmlContent = htmlContent + '.title { font-size: 24px; color: #960000; font-weight: bold; margin: 20px 0; }';
    htmlContent = htmlContent + '.details { margin: 10px 0; font-size: 14px; }';
    htmlContent = htmlContent + '.town-group { margin: 15px 0; page-break-inside: avoid; }';
    htmlContent = htmlContent + '.town-header { font-weight: bold; font-size: 16px; color: #2c5282; margin: 10px 0 5px 0; border-bottom: 1px solid #ccc; }';
    htmlContent = htmlContent + '.entry-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dotted #ddd; }';
    htmlContent = htmlContent + '.entry-number { min-width: 40px; }';
    htmlContent = htmlContent + '.entry-name { flex: 1; margin: 0 10px; }';
    htmlContent = htmlContent + '.entry-amount { min-width: 100px; text-align: right; font-weight: bold; }';
    htmlContent = htmlContent + '.town-total { font-weight: bold; color: #2c5282; text-align: right; margin: 5px 0; padding: 5px 0; border-top: 2px solid #2c5282; }';
    htmlContent = htmlContent + '.grand-total { font-size: 18px; font-weight: bold; color: #960000; text-align: center; margin: 20px 0; padding: 15px; border: 2px solid #960000; background: #fff8f8; }';
    htmlContent = htmlContent + '.quote { font-style: italic; text-align: center; margin: 20px 0; color: #666; font-size: 14px; }';
    htmlContent = htmlContent + '@media print { .header { background: white !important; } .grand-total { background: white !important; } }';
    htmlContent = htmlContent + '</style></head><body>';
    htmlContent = htmlContent + '<div class="header">';
    htmlContent = htmlContent + '<h1 class="title">மொய் புத்தக அறிக்கை</h1>';
    htmlContent = htmlContent + '<div><strong>நிகழ்வு:</strong> ' + eventName + '</div>';
    htmlContent = htmlContent + '<div><strong>நாள்:</strong> ' + eventDate + '</div>';
    htmlContent = htmlContent + '<div><strong>இடம்:</strong> ' + eventVenue + ', ' + eventPlace + '</div>';
    htmlContent = htmlContent + '<div><strong>நிகழ்வு தலைவர்:</strong> ' + eventHead + '</div>';
    htmlContent = htmlContent + '<div><strong>அமைப்பாளர்:</strong> ' + eventOrganizer + '</div>';
    htmlContent = htmlContent + '</div>';
    htmlContent = htmlContent + townSections;
    htmlContent = htmlContent + '<div class="grand-total">';
    htmlContent = htmlContent + '<div>மொத்த பதிவுகள்: ' + moiOnlyEntries.length + '</div>';
    htmlContent = htmlContent + '<div style="font-size: 18px; margin-top: 10px;">மொத்த தொகை: ₹' + grandTotal.toLocaleString('en-IN') + '</div>';
    htmlContent = htmlContent + '</div>';
    htmlContent = htmlContent + '<div class="quote">';
    htmlContent = htmlContent + '<div>"எனக்கு எழுவம் பொரியு என்றுபு எனக்கு பொரியும்,</div>';
    htmlContent = htmlContent + '<div>ஏகமெலி நாதன் பு அமிவெலி"</div>';
    htmlContent = htmlContent + '<div>- சாதுகவி</div>';
    htmlContent = htmlContent + '</div>';
    htmlContent = htmlContent + '</body></html>';
    
    // Open new window with Tamil HTML content
    const htmlWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes');
    htmlWindow.document.write(htmlContent);
    htmlWindow.document.close();
    
    // Set document title for auto filename (will be used when printing to PDF)
    if (fileName) {
        htmlWindow.document.title = fileName;
    }
    
    // Add print functionality
    htmlWindow.onload = () => {
        setTimeout(() => {
            htmlWindow.focus();
            
            // Add filename display
            const filenameDisplay = htmlWindow.document.createElement('div');
            filenameDisplay.innerHTML = `<strong>File name:</strong> ${fileName || 'MoiReport'}.pdf`;
            filenameDisplay.className = 'no-print';
            filenameDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                left: 10px;
                background: #fff9c4;
                color: #333;
                padding: 10px 15px;
                border-radius: 5px;
                font-size: 14px;
                font-family: Arial, sans-serif;
                z-index: 1001;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                border: 2px solid #fbc02d;
            `;
            htmlWindow.document.body.insertBefore(filenameDisplay, htmlWindow.document.body.firstChild);
            
            // Add print button functionality
            const printButton = htmlWindow.document.createElement('button');
            printButton.innerHTML = 'Print / அச்சிடுக';
            printButton.className = 'no-print';
            printButton.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                font-weight: bold;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            `;
            printButton.onclick = () => {
                htmlWindow.print();
            };
            htmlWindow.document.body.appendChild(printButton);
            
            // Also add keyboard shortcut
            htmlWindow.document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    htmlWindow.print();
                }
            });
        }, 500);
    };
    
    console.log('Tamil HTML content opened successfully');
};

export const exportToPdf = (entries, event, fileName) => {
    const doc = new jsPDF();
    const moiOnlyEntries = entries.filter(e => !e.type);
    
    doc.setFont('helvetica');
    doc.setFontSize(18);
    doc.text('Moi Book Report', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Event: ${event.eventName || 'Event Name'}`, 20, 50);
    if (event.eventSide) {
        doc.text(`Side: ${event.eventSide}`, 20, 60);
    }
    doc.text(`Date: ${event.date ? new Date(event.date).toLocaleDateString('en-GB') : 'No date'}`, 20, 70);
    doc.text(`Venue: ${event.venue || 'Venue'}, ${event.place || 'Place'}`, 20, 80);
    doc.text(`Event Head: ${event.eventHead || 'Event Head'}`, 20, 90);
    doc.text(`Organizer: ${event.eventOrganizer || 'Organizer'}`, 20, 100);
    
    // Table data
    const tableData = moiOnlyEntries.map((entry, index) => [
        index + 1,
        `${entry.relationship || ''} ${entry.name || ''}`.trim() || 'No Name',
        entry.town || 'N/A',
        `₹ ${(entry.amount || 0).toLocaleString('en-IN')}`
    ]);
    
    autoTable(doc, {
        head: [['S.No', 'Name', 'Town', 'Amount']],
        body: tableData,
        startY: 120,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [70, 130, 180] }
    });
    
    const eventId = event.id || 'EVENT';
    const eventDate = event.date ? new Date(event.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const safeFileName = fileName || `MoiReport-${eventId}-${eventDate}`;
    doc.save(`${safeFileName}.pdf`);
    
    console.log(`English PDF exported successfully`);
};

export const exportToExcel = (entries, fileName) => {
    const data = prepareDataForExport(entries);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Moi Entries');
    
    const eventDate = new Date().toISOString().split('T')[0];
    const safeFileName = fileName || `MoiReport-${eventDate}`;
    XLSX.writeFile(workbook, `${safeFileName}.xlsx`);
    
    console.log(`Excel file exported successfully`);
};

// New Town-based PDF Export with exact format requested
export const exportTownBasedPdf = async (entries, event, fileName) => {
    const MoiReport = (await import('../components/MoiReport.jsx')).default;
    
    try {
        // Create the HTML content using React component
        const reportComponent = React.createElement(MoiReport, {
            moiEntries: entries,
            event: event,
            includeEventDetails: true,
            includeTableOfContents: true
        });
        
        const htmlContent = ReactDOMServer.renderToStaticMarkup(reportComponent);
        
        const documentTitle = fileName || 'மொய்_புத்தக_அறிக்கை';
        
        const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${documentTitle}</title>
            <style>
                @page { 
                    margin: 15mm; 
                    size: A4; 
                }
                @media print { 
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                }
                body { 
                    font-family: 'Noto Sans Tamil', 'Latha', 'TAMu_Kadambri', Arial, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    line-height: 1.6; 
                    color: #000;
                }
                * {
                    box-sizing: border-box;
                }
            </style>
        </head>
        <body>
            ${htmlContent}
            <div class="no-print" style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
                <button onclick="window.print()" style="
                    background: #007bff; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    font-family: 'Noto Sans Tamil', Arial, sans-serif;
                ">
                    அச்சிடுக / Print
                </button>
                <button onclick="window.close()" style="
                    background: #dc3545; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-left: 10px;
                    font-family: 'Noto Sans Tamil', Arial, sans-serif;
                ">
                    மூடு / Close
                </button>
            </div>
        </body>
        </html>`;
        
        // Create iframe for better printing (avoids popup blockers)
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '0px';
        iframe.style.height = '0px';
        document.body.appendChild(iframe);
        
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(fullHtml);
        iframeDoc.close();
        
        // Wait for content to load then open in new window
        setTimeout(() => {
            const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            
            // Set document title for auto filename
            if (fileName) {
                printWindow.document.title = fileName;
            }
            
            // Clean up iframe
            document.body.removeChild(iframe);
            
            // Focus and prepare for printing
            printWindow.focus();
            
            console.log('Town-based PDF report opened successfully');
        }, 500);
        
    } catch (error) {
        console.error('Error generating town-based PDF:', error);
        alert('PDF தயாரிப்பில் பிழை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.');
    }
};