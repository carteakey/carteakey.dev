function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', () => {
    const vibesContainer = document.getElementById('vibes-container');
    const imageElements = document.querySelectorAll('.vibe-image');

    if (!vibesContainer) {
        console.error('Error: Vibes container not found!');
        return;
    }

    if (imageElements.length === 0) {
        console.warn('No images with class "vibe-image" found to position.');
        return;
    }

    // First, hide all images and gather their data
    const imageData = [];
    const imagePromises = [];

    Array.from(imageElements).forEach((imgElement, index) => {
        imgElement.style.visibility = 'hidden'; // Hide initially
        
        // Create a promise to load the image and get its dimensions
        const promise = new Promise((resolve) => {
            if (imgElement.complete && imgElement.naturalHeight !== 0) {
                // Image already loaded
                resolve({
                    element: imgElement,
                    src: imgElement.src,
                    naturalWidth: imgElement.naturalWidth,
                    naturalHeight: imgElement.naturalHeight,
                    index: index
                });
            } else {
                // Wait for image to load
                const tempImg = new Image();
                tempImg.onload = () => {
                    resolve({
                        element: imgElement,
                        src: imgElement.src,
                        naturalWidth: tempImg.width,
                        naturalHeight: tempImg.height,
                        index: index
                    });
                };
                tempImg.onerror = () => {
                    console.warn(`Failed to load image: ${imgElement.src}`);
                    resolve({
                        element: imgElement,
                        src: imgElement.src,
                        naturalWidth: 300,
                        naturalHeight: 200,
                        index: index
                    });
                };
                tempImg.src = imgElement.src;
            }
        });
        
        imagePromises.push(promise);
    });

    // Wait for all images to load, then process them
    Promise.all(imagePromises).then(loadedImageData => {
        // Shuffle the array for random placement order
        const shuffledData = shuffleArray([...loadedImageData]);
        
        const rect = vibesContainer.getBoundingClientRect();
        let screenWidth = rect.width;

        // Calculate display dimensions for each image
        const processedImages = shuffledData.map(imageInfo => {
            let { naturalWidth: w, naturalHeight: h } = imageInfo;
            
            // Resize images based on pixel count (similar to original algorithm)
            let goalPixels = 500 * 300;
            let actualPixels = w * h;
            
            if (actualPixels / goalPixels > 16) {
                w = parseInt(w / 8);
                h = parseInt(h / 8);
            } else if (actualPixels / goalPixels > 4) {
                w = parseInt(w / 4);
                h = parseInt(h / 4);
            } else {
                w = parseInt(w / 2);
                h = parseInt(h / 2);
            }
            
            // Ensure image fits within container width
            if ((w + 10) > screenWidth) {
                w = screenWidth - 10;
            }
            
            return {
                ...imageInfo,
                displayWidth: w,
                displayHeight: h
            };
        });

        // Gather all text nodes to avoid overlapping
        const textNodes = [];
        const treeWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            { acceptNode: (node) => node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
        );
        while(treeWalker.nextNode()) textNodes.push(treeWalker.currentNode);

        // Place images with collision detection
        let positions = [];
        let i = 0;
        
        // Gradual placement with intervals
        let interval = setInterval(() => {
            let height = 600;
            let currentImage = processedImages[i];
            let { displayWidth: w, displayHeight: h, element } = currentImage;
            
            while (true) {
                let foundPlace = false;
                let wMax = screenWidth - w;
                let hMax = height - h;
                
                // Try to place the image up to 50 times at current height
                for (let attempt = 0; attempt < 50; attempt++) {
                    let aLeft = Math.random() * wMax;
                    let aTop = Math.random() * hMax;
                    let aRight = aLeft + w;
                    let aBottom = aTop + h;

                    // Check intersection with other images
                    let intersects = false;
                    for (let j = 0; j < positions.length; j++) {
                        let [bLeft, bTop] = positions[j];
                        let bRight = bLeft + processedImages[j].displayWidth;
                        let bBottom = bTop + processedImages[j].displayHeight;
                        
                        if (aLeft < bRight && aRight > bLeft && aBottom > bTop && aTop < bBottom) {
                            intersects = true;
                            break;
                        }
                    }

                    // Check intersection with text nodes
                    if (!intersects) {
                        for (const node of textNodes) {
                            const range = document.createRange();
                            range.selectNodeContents(node);
                            const rect = range.getBoundingClientRect();
                            let nodeTop = rect.top + window.pageYOffset;
                            let nodeLeft = rect.left + window.pageXOffset;
                            
                            if (aLeft < (nodeLeft + rect.width) && aRight > nodeLeft && 
                                aBottom > nodeTop && aTop < (nodeTop + rect.height)) {
                                intersects = true;
                                break;
                            }
                        }
                    }

                    if (!intersects) {
                        foundPlace = true;
                        positions.push([parseInt(aLeft), parseInt(aTop)]);
                        break;
                    }
                }
                
                if (foundPlace) {
                    break;
                } else {
                    height += 50; // Increase search height if no place found
                }
            }

            // Position and show the image
            element.style.width = `${w}px`;
            element.style.height = `${h}px`;
            element.style.position = 'absolute';
            element.style.top = `${positions[i][1]}px`;
            element.style.left = `${positions[i][0]}px`;
            element.style.visibility = 'visible';
            element.loading = 'lazy';
            
            // Add slight random rotation for aesthetic effect
            const randomRotation = Math.random() * 20 - 10; // -10 to +10 degrees
            element.style.transform = `rotate(${randomRotation}deg)`;

            i++;
            if (i === processedImages.length) {
                clearInterval(interval);
                console.log(`Vibes board: ${processedImages.length} images positioned with collision detection.`);
            }
        }, 150); // Slightly slower than original to see the effect better
    });
});
