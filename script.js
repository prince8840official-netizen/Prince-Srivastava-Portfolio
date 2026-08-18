const bgCanvas = document.getElementById("bg-canvas");
const bgContext = bgCanvas.getContext("2d");

const fgCanvas = document.getElementById("fg-canvas");
const fgContext = fgCanvas.getContext("2d", { willReadFrequently: true });

const frameCount = 240;

// Function to format the frame number
const currentFrame = index => (
    `./frames/frame_${index.toString().padStart(6, '0')}.jpg`
);

// Preload images
const images = [];
for (let i = 0; i < frameCount; i++) {
    const img = new Image();
    img.src = currentFrame(i);
    images.push(img);
}

const renderFrame = (img) => {
    // 1. Draw original to background canvas
    bgContext.drawImage(img, 0, 0);

    // 2. Process chroma-key for foreground canvas
    fgContext.drawImage(img, 0, 0);
    
    // Performance optimization: we can process the image data at its native resolution
    const width = img.width;
    const height = img.height;
    const imageData = fgContext.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Chroma-key logic to detect the solid orange background
        // The orange wall is highly saturated compared to skin tones
        // Using a very strict Red-to-Blue ratio (> 8.0) to prevent edge color-spill (like on ears/lips) from being keyed out.
        if (r > g * 2.6 && r > b * 8.0 && r > 80) {
            // It's the orange background wall! Make it fully transparent
            data[i + 3] = 0; // alpha
        }
    }
    
    // Put the processed transparent image back into the foreground canvas
    fgContext.putImageData(imageData, 0, 0);
};

// Draw first frame immediately
const firstImg = new Image();
firstImg.src = currentFrame(0);
firstImg.onload = () => {
    bgCanvas.width = firstImg.width;
    bgCanvas.height = firstImg.height;
    fgCanvas.width = firstImg.width;
    fgCanvas.height = firstImg.height;
    
    renderFrame(firstImg);
};

// Handle scrolling to update animation
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
    
    if (maxScrollTop <= 0) return;

    const scrollFraction = scrollTop / maxScrollTop;
    
    const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount)
    );

    requestAnimationFrame(() => {
        if (images[frameIndex] && images[frameIndex].complete) {
            renderFrame(images[frameIndex]);
        }
    });
});

// =============================================
// SCROLL-REVEAL via IntersectionObserver
// Efficient: one observer, no scroll listeners,
// GPU-friendly opacity + transform transitions.
// =============================================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Once revealed, stop observing to save resources
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.12,      // Trigger when 12% of element is visible
    rootMargin: '0px 0px -40px 0px'  // Small offset so animation fires slightly before full entry
});

// Observe all reveal targets
const revealSelectors = [
    '.reveal',
    '.reveal-left',
    '.reveal-right',
    '.reveal-scale',
    '.reveal-stagger',
    '.section-header',
    '.timeline',
    '.skills-container'
];

document.querySelectorAll(revealSelectors.join(', ')).forEach(el => {
    revealObserver.observe(el);
});
