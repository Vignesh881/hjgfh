/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Auto-generate and set favicon based on MoiBook logo design
function generateFavicon() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 32;
    
    canvas.width = size;
    canvas.height = size;
    
    // Clear background
    ctx.clearRect(0, 0, size, size);
    
    // Money note (green, top)
    ctx.save();
    ctx.translate(size/2, size * 0.25);
    ctx.rotate(-0.15); // Slight rotation
    
    // Green money note
    const gradient1 = ctx.createLinearGradient(-size*0.3, -size*0.08, size*0.3, size*0.08);
    gradient1.addColorStop(0, '#4CAF50');
    gradient1.addColorStop(1, '#2E7D32');
    ctx.fillStyle = gradient1;
    ctx.fillRect(-size*0.3, -size*0.08, size*0.6, size*0.16);
    
    // Rupee symbol on money note
    ctx.fillStyle = 'white';
    ctx.font = `bold ${size*0.12}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('₹', 0, size*0.04);
    
    ctx.restore();
    
    // Open book (blue, bottom)
    const bookY = size * 0.55;
    const bookWidth = size * 0.5;
    const bookHeight = size * 0.3;
    
    // Left page
    const gradient2 = ctx.createLinearGradient(0, bookY, bookWidth/2, bookY + bookHeight);
    gradient2.addColorStop(0, '#1976D2');
    gradient2.addColorStop(1, '#1565C0');
    ctx.fillStyle = gradient2;
    ctx.fillRect(size/2 - bookWidth/2, bookY, bookWidth/2 - 1, bookHeight);
    
    // Right page
    const gradient3 = ctx.createLinearGradient(bookWidth/2, bookY, bookWidth, bookY + bookHeight);
    gradient3.addColorStop(0, '#2196F3');
    gradient3.addColorStop(1, '#1976D2');
    ctx.fillStyle = gradient3;
    ctx.fillRect(size/2 + 1, bookY, bookWidth/2, bookHeight);
    
    // Book spine
    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(size/2 - 1, bookY, 2, bookHeight);
    
    // Tamil text at bottom (small)
    ctx.fillStyle = '#4CAF50';
    ctx.font = `bold ${size*0.15}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('மொ', size/2, size * 0.95);
    
    return canvas.toDataURL('image/png');
}

function setFavicon() {
    try {
        const faviconUrl = generateFavicon();
        
        // Remove existing favicon
        const existingFavicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (existingFavicon) {
            existingFavicon.remove();
        }
        
        // Add new favicon
        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/png';
        link.href = faviconUrl;
        document.head.appendChild(link);
        
        console.log('MoiBook favicon set successfully');
    } catch (error) {
        console.error('Failed to set favicon:', error);
    }
}

// Set favicon when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setFavicon);
} else {
    setFavicon();
}