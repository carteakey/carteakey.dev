document.addEventListener('DOMContentLoaded', () => {
    const vibesContainer = document.getElementById('vibes-container');

    if (!vibesContainer) {
        console.error('Error: Vibes container not found!');
        return;
    }

    const images = [
        { src: '/static/img/alvin.png', alt: 'Alvin pixel art' },
        { src: '/static/img/bilbo.jpg', alt: 'Bilbo Baggins' },
        { src: '/static/img/caves.jpg', alt: 'Scenic cave' },
        { src: '/static/img/codellama.png', alt: 'CodeLlama' },
        { src: '/static/img/eternal_sunshine.png', alt: 'Eternal Sunshine movie poster' },
        { src: '/static/img/good-night.png', alt: 'Good night message' },
        { src: '/static/img/inception-deeper.gif', alt: 'Inception spinning top gif' },
        { src: '/static/img/photography/real/auli.jpg', alt: 'Auli landscape' },
        { src: '/static/img/potter.jpeg', alt: 'Harry Potter art' }
    ];

    images.forEach(imageData => {
        const imgElement = document.createElement('img');
        imgElement.src = imageData.src;
        imgElement.alt = imageData.alt;

        // Apply Tailwind classes for basic styling
        imgElement.className = 'absolute rounded-lg shadow-xl w-auto h-auto max-w-xs max-h-xs object-contain'; // Added max-w-xs and max-h-xs for better control, object-contain

        // Calculate random positions (percentages)
        // Ensure images are not too close to the edges, e.g., within 5% to 85%
        const randomTop = Math.random() * 80 + 5; // 5% to 85%
        const randomLeft = Math.random() * 80 + 5; // 5% to 85%

        imgElement.style.position = 'absolute'; // Already handled by 'absolute' class, but explicit for clarity
        imgElement.style.top = `${randomTop}%`;
        imgElement.style.left = `${randomLeft}%`;
        
        // Optional: Add random rotation
        const randomRotation = Math.random() * 20 - 10; // -10 to +10 degrees
        imgElement.style.transform = `rotate(${randomRotation}deg)`;

        vibesContainer.appendChild(imgElement);
    });

    console.log('Vibes board populated with images.');
});
