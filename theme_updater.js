const fs = require('fs');

function updateTheme(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace background colors (Light #fff, #f9f9f9, #f3f4f6, #f0f4f1) -> Dark/DeFi vars
    content = content.replace(/var\(--card-bg,\s*#fff\)/gi, 'var(--scrolla-card, #3D3530)');
    content = content.replace(/var\(--surface,\s*#f[0-9a-f]{2}f[0-9a-f]{2}\)/gi, 'var(--scrolla-surface, #2D2420)');
    content = content.replace(/background:\s*#fff;/gi, 'background: var(--scrolla-card, #3D3530);');
    content = content.replace(/background:\s*#f9f9f9;/gi, 'background: var(--scrolla-surface, #2D2420);');
    content = content.replace(/background:\s*#f3f4f6;/gi, 'background: var(--scrolla-surface, #2D2420);');
    content = content.replace(/background:\s*#f0f4f1;/gi, 'background: rgba(232, 168, 139, 0.1);');
    content = content.replace(/background:\s*#f0fdf4;/gi, 'background: rgba(232, 168, 139, 0.1);'); // Light green bg -> light orange bg
    
    // Replace text colors
    content = content.replace(/var\(--text,\s*#111\)/gi, 'var(--text, #F5E6D3)');
    content = content.replace(/var\(--text-muted,\s*#6b7280\)/gi, 'var(--text-muted, #C4B5A0)');
    content = content.replace(/color:\s*#111;/gi, 'color: var(--text, #F5E6D3);');
    content = content.replace(/color:\s*#6b7280;/gi, 'color: var(--text-muted, #C4B5A0);');

    // Replace border colors
    content = content.replace(/var\(--border,\s*#e5e7eb\)/gi, 'rgba(255, 255, 255, 0.1)');
    content = content.replace(/var\(--border,\s*#eee\)/gi, 'rgba(255, 255, 255, 0.1)');
    
    // Replace specific primary greens with primary orange/copper
    content = content.replace(/#6B7F6E/gi, 'var(--primary, #E8A88B)');
    content = content.replace(/#4a6b52/gi, '#d48b71'); // Darker shade of primary
    content = content.replace(/#9ab49a/gi, '#f3cbb8'); // Lighter shade of primary
    content = content.replace(/#16a34a/gi, 'var(--primary, #E8A88B)'); // Specific green -> primary orange

    fs.writeFileSync(filePath, content);
}

['client/src/pages/JourneyDiscover.css', 'client/src/pages/JourneyDetail.css'].forEach(file => {
    updateTheme(file);
    console.log(`Updated ${file}`);
});
