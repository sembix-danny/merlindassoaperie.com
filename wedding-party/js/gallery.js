// Wedding Gallery JavaScript - Photos & Videos
(function() {
    'use strict';

    let allMedia = [];
    let images = [];
    let videos = [];
    let currentIndex = 0;
    let currentFilter = 'all';
    let selectionMode = false;
    let selectedItems = new Set();

    // DOM Elements
    const gallery = document.getElementById('gallery');
    const videoGallery = document.getElementById('video-gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const imageCount = document.getElementById('image-count');
    const videoCount = document.getElementById('video-count');
    const selectToggle = document.getElementById('select-toggle');
    const selectionCount = document.getElementById('selection-count');
    const downloadZipBtn = document.getElementById('download-zip');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const welcomeModal = document.getElementById('welcome-modal');
    const welcomeClose = document.getElementById('welcome-close');

    // Password for gallery access
    const GALLERY_PASSWORD = 'WeddingParty2025';

    // Check authentication
    function checkAuth() {
        if (sessionStorage.getItem('gallery_authenticated') === 'true') {
            loginModal.classList.add('hidden');
            // Start pulsing Select button to draw attention
            selectToggle.classList.add('pulse');
            return true;
        }
        return false;
    }

    // Handle login
    function handleLogin(e) {
        e.preventDefault();
        const entered = passwordInput.value;

        if (entered === GALLERY_PASSWORD) {
            sessionStorage.setItem('gallery_authenticated', 'true');
            loginModal.classList.add('hidden');
            loginError.textContent = '';

            // Show welcome instructions if first time
            if (!localStorage.getItem('gallery_seen_welcome')) {
                welcomeModal.classList.remove('hidden');
            }

            // Start pulsing Select button
            selectToggle.classList.add('pulse');
        } else {
            loginError.textContent = 'Incorrect password. Please try again.';
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    // Close welcome modal
    function closeWelcome() {
        welcomeModal.classList.add('hidden');
        localStorage.setItem('gallery_seen_welcome', 'true');

        // Run demo if first time
        if (!localStorage.getItem('gallery_seen_demo')) {
            setTimeout(runDemo, 500);
        }
    }

    // Animated demo showing how to select and download
    async function runDemo() {
        const items = document.querySelectorAll('.gallery-item');
        if (items.length < 4) return;

        // Enter selection mode
        toggleSelectionMode();

        // Select photos at different positions (spread across rows)
        const indicesToSelect = [0, 3, 5, 8].filter(i => i < items.length);

        for (let i = 0; i < indicesToSelect.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const item = items[indicesToSelect[i]];
            if (item) {
                toggleItemSelection(item);
            }
        }

        // Pause to show the Download ZIP pulsing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Clear and exit selection mode
        toggleSelectionMode();

        // Mark demo as seen
        localStorage.setItem('gallery_seen_demo', 'true');
    }

    // Initialize
    async function init() {
        // Check if already authenticated
        checkAuth();

        // Setup login form
        loginForm.addEventListener('submit', handleLogin);

        // Setup welcome close button
        welcomeClose.addEventListener('click', closeWelcome);

        try {
            const response = await fetch('media-manifest.json');
            const manifest = await response.json();

            images = (manifest.images || []).map(item => ({ ...item, type: 'image' }));
            videos = (manifest.videos || []).map(item => ({ ...item, type: 'video' }));
            allMedia = [...images, ...videos].sort((a, b) => a.filename.localeCompare(b.filename));

            if (imageCount) imageCount.textContent = images.length;
            if (videoCount) videoCount.textContent = videos.length;

            renderGallery();
            setupEventListeners();
        } catch (error) {
            console.error('Error loading gallery:', error);
            gallery.innerHTML = '<p class="loading">Error loading gallery. Please refresh the page.</p>';
        }
    }

    // Render gallery
    function renderGallery() {
        gallery.innerHTML = '';

        let items = currentFilter === 'photos' ? images :
                    currentFilter === 'videos' ? videos : allMedia;

        if (items.length === 0) {
            gallery.innerHTML = '<p class="loading">No media found.</p>';
            return;
        }

        items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-item' + (item.type === 'video' ? ' video-item' : '');
            div.dataset.index = index;
            div.dataset.type = item.type;

            if (item.type === 'video') {
                // Use matching JPG as thumbnail (same filename, different extension)
                const thumbnailPath = item.path.replace('/videos/', '/images/').replace('.mp4', '.jpg');
                div.innerHTML = `
                    <img src="${thumbnailPath}" alt="Video thumbnail" loading="lazy">
                    <div class="play-icon">▶</div>
                    <div class="select-check">✓</div>
                    <div class="overlay">
                        <div class="overlay-content">
                            <button class="view-btn">Play Video</button>
                        </div>
                    </div>
                `;
            } else {
                div.innerHTML = `
                    <img src="${item.path}" alt="Wedding photo" loading="lazy">
                    <div class="select-check">✓</div>
                    <div class="overlay">
                        <div class="overlay-content">
                            <button class="view-btn">View Photo</button>
                        </div>
                    </div>
                `;
            }

            // Restore selection state
            if (selectedItems.has(item.path)) {
                div.classList.add('selected');
            }

            gallery.appendChild(div);
        });
    }

    // Get current media list based on filter
    function getCurrentMedia() {
        return currentFilter === 'photos' ? images :
               currentFilter === 'videos' ? videos : allMedia;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderGallery();
            });
        });

        // Gallery item click
        gallery.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-item');
            if (item) {
                if (selectionMode) {
                    toggleItemSelection(item);
                } else {
                    const index = parseInt(item.dataset.index, 10);
                    openLightbox(index);
                }
            }
        });

        // Selection mode toggle
        selectToggle.addEventListener('click', toggleSelectionMode);

        // Download ZIP
        downloadZipBtn.addEventListener('click', exportToZip);

        // Lightbox controls
        document.getElementById('close-lightbox').addEventListener('click', closeLightbox);
        document.getElementById('prev-btn').addEventListener('click', () => navigateLightbox(-1));
        document.getElementById('next-btn').addEventListener('click', () => navigateLightbox(1));
        document.getElementById('download-btn').addEventListener('click', downloadCurrent);

        // Close on background click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            switch (e.key) {
                case 'Escape': closeLightbox(); break;
                case 'ArrowLeft': navigateLightbox(-1); break;
                case 'ArrowRight': navigateLightbox(1); break;
                case ' ':
                    e.preventDefault();
                    if (lightboxVideo && !lightboxVideo.classList.contains('hidden')) {
                        lightboxVideo.paused ? lightboxVideo.play() : lightboxVideo.pause();
                    }
                    break;
            }
        });

        // Touch swipe
        let touchStartX = 0;
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        lightbox.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].screenX;
            if (Math.abs(diff) > 50) {
                navigateLightbox(diff > 0 ? 1 : -1);
            }
        });
    }

    // Open lightbox
    function openLightbox(index) {
        currentIndex = index;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close lightbox
    function closeLightbox() {
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.src = '';
        }
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Navigate lightbox
    function navigateLightbox(direction) {
        if (lightboxVideo) lightboxVideo.pause();

        const media = getCurrentMedia();
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = media.length - 1;
        if (currentIndex >= media.length) currentIndex = 0;

        updateLightbox();
    }

    // Update lightbox display
    function updateLightbox() {
        const media = getCurrentMedia();
        const item = media[currentIndex];
        if (!item) return;

        lightboxCounter.textContent = `${currentIndex + 1} / ${media.length}`;

        if (item.type === 'video') {
            lightboxImage.classList.add('hidden');
            lightboxVideo.classList.remove('hidden');
            lightboxVideo.src = item.path;
            lightboxVideo.play();
        } else {
            lightboxVideo.classList.add('hidden');
            lightboxVideo.pause();
            lightboxImage.classList.remove('hidden');
            lightboxImage.src = item.path;
        }
    }

    // Download current media
    function downloadCurrent() {
        const media = getCurrentMedia();
        const item = media[currentIndex];
        if (item) {
            const link = document.createElement('a');
            link.href = item.path;
            link.download = item.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Toggle selection mode
    function toggleSelectionMode() {
        selectionMode = !selectionMode;
        selectToggle.classList.toggle('active', selectionMode);
        selectToggle.textContent = selectionMode ? 'Cancel' : 'Select';
        document.body.classList.toggle('selection-mode', selectionMode);

        // Stop pulsing Select button when entering selection mode
        selectToggle.classList.remove('pulse');

        if (!selectionMode) {
            // Clear selections when exiting selection mode
            selectedItems.clear();
            document.querySelectorAll('.gallery-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
            updateSelectionCount();
            // Remove pulse from Download ZIP
            downloadZipBtn.classList.remove('pulse');
        }
    }

    // Toggle item selection
    function toggleItemSelection(itemElement) {
        const media = getCurrentMedia();
        const index = parseInt(itemElement.dataset.index, 10);
        const item = media[index];
        if (!item) return;

        if (selectedItems.has(item.path)) {
            selectedItems.delete(item.path);
            itemElement.classList.remove('selected');
        } else {
            selectedItems.add(item.path);
            itemElement.classList.add('selected');
        }
        updateSelectionCount();
    }

    // Update selection count display
    function updateSelectionCount() {
        const count = selectedItems.size;
        selectionCount.textContent = `${count} selected`;
        downloadZipBtn.disabled = count === 0;

        // Pulse Download ZIP button when items are selected
        if (count > 0) {
            downloadZipBtn.classList.add('pulse');
        } else {
            downloadZipBtn.classList.remove('pulse');
        }
    }

    // Export selected items to ZIP
    async function exportToZip() {
        if (selectedItems.size === 0) return;

        // Stop pulsing when clicked
        downloadZipBtn.classList.remove('pulse');

        const originalText = downloadZipBtn.textContent;
        downloadZipBtn.textContent = 'Creating ZIP...';
        downloadZipBtn.disabled = true;

        try {
            const zip = new JSZip();
            const paths = Array.from(selectedItems);

            for (let i = 0; i < paths.length; i++) {
                const path = paths[i];
                const filename = path.split('/').pop();

                downloadZipBtn.textContent = `Adding ${i + 1}/${paths.length}...`;

                const response = await fetch(path);
                const blob = await response.blob();
                zip.file(filename, blob);
            }

            downloadZipBtn.textContent = 'Generating ZIP...';
            const content = await zip.generateAsync({ type: 'blob' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'wedding-photos.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Error creating ZIP file. Please try again.');
        } finally {
            downloadZipBtn.textContent = originalText;
            downloadZipBtn.disabled = selectedItems.size === 0;
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
