document.addEventListener('DOMContentLoaded', () => {
    const vibesContainer = document.getElementById('vibes-container'); // Still needed to get container dimensions if we want to be very precise, but for now, percentages work well.
    const imagesToPosition = document.querySelectorAll('.vibe-image');

    if (!vibesContainer) {
        console.error('Error: Vibes container not found!');
        return;
    }

    if (imagesToPosition.length === 0) {
        console.warn('No images with class "vibe-image" found to position.');
        return;
    }

    imagesToPosition.forEach(imgElement => {
        // Calculate random positions (percentages)
        // Ensure images are not too close to the edges, e.g., within 5% to 85% for top/left if container is full viewport.
        // If images are smaller, the range might need adjustment or be based on image size vs container size.
        // The current CSS max-w-xs / max-h-xs helps control image size.
        const randomTop = Math.random() * 75; // 0% to 75% to leave space, assuming max-h-xs (12rem)
        const randomLeft = Math.random() * 80; // 0% to 80% to leave space, assuming max-w-xs (20rem)

        // The 'absolute' class is already applied by the shortcode.
        // We just need to set the dynamic styles.
        imgElement.style.top = `${randomTop}%`;
        imgElement.style.left = `${randomLeft}%`;
        
        // Optional: Add random rotation
        const randomRotation = Math.random() * 20 - 10; // -10 to +10 degrees
        imgElement.style.transform = `rotate(${randomRotation}deg)`;
    });

    console.log(`Vibes board: ${imagesToPosition.length} images positioned.`);
});
