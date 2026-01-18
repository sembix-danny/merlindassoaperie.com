// Wedding Gallery JavaScript - Secure Static Gate
// NOTE: This provides friction against casual access only.
// Direct asset URLs remain accessible if discovered/shared.
// This is NOT true security against a motivated attacker.

(function() {
    'use strict';

    // ============================================
    // AUTHENTICATION CONFIG
    // ============================================

    // SHA-256 hash of password (no plaintext stored)
    const EXPECTED_HASH_HEX = 'bc01479f6c34b5c8ce26ba622792ec56cd1e27a6a622d4b5293a14b9751ff4bb';

    const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
    const MAX_FAILS = 5;
    const LOCKOUT_BASE_MS = 30 * 1000; // 30 seconds
    const LOCKOUT_CAP_MS = 5 * 60 * 1000; // 5 minutes max

    // ============================================
    // LOGIN ELEMENTS (available before unlock)
    // ============================================

    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password-input');
    const loginError = document.getElementById('login-error');
    const appContainer = document.getElementById('app');
    const galleryTemplate = document.getElementById('gallery-template');

    // ============================================
    // GALLERY STATE (set after unlock)
    // ============================================

    let allMedia = [];
    let images = [];
    let videos = [];
    let currentIndex = 0;
    let currentFilter = 'all';
    let selectionMode = false;
    let selectedItems = new Set();

    // Gallery DOM elements (assigned after template mount)
    let gallery, lightbox, lightboxImage, lightboxVideo, lightboxCounter;
    let imageCount, videoCount, selectToggle, selectionCount, downloadZipBtn;
    let welcomeModal, welcomeClose;

    // ============================================
    // CRYPTO UTILITIES
    // ============================================

    function bufToHex(buf) {
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function sha256Hex(text) {
        const enc = new TextEncoder().encode(text);
        const digest = await crypto.subtle.digest('SHA-256', enc);
        return bufToHex(digest);
    }

    // ============================================
    // AUTH STATE MANAGEMENT
    // ============================================

    function getAuthState() {
        return {
            fails: Number(localStorage.getItem('gallery_fails') || '0'),
            lockedUntil: Number(localStorage.getItem('gallery_lockedUntil') || '0'),
            unlockedUntil: Number(sessionStorage.getItem('gallery_unlockedUntil') || '0')
        };
    }

    function setAuthState(partial) {
        if (partial.fails !== undefined) {
            localStorage.setItem('gallery_fails', String(partial.fails));
        }
        if (partial.lockedUntil !== undefined) {
            localStorage.setItem('gallery_lockedUntil', String(partial.lockedUntil));
        }
        if (partial.unlockedUntil !== undefined) {
            sessionStorage.setItem('gallery_unlockedUntil', String(partial.unlockedUntil));
        }
    }

    function getLockoutMs(failCount) {
        const over = Math.max(0, failCount - MAX_FAILS);
        return Math.min(LOCKOUT_CAP_MS, LOCKOUT_BASE_MS * Math.pow(2, over));
    }

    function formatLockoutTime(ms) {
        const seconds = Math.ceil(ms / 1000);
        if (seconds >= 60) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
        }
        return `${seconds}s`;
    }

    // ============================================
    // AUTHENTICATION
    // ============================================

    function checkExistingSession() {
        const { unlockedUntil } = getAuthState();
        if (unlockedUntil && unlockedUntil > Date.now()) {
            mountGallery();
            return true;
        }
        return false;
    }

    async function handleLogin(e) {
        e.preventDefault();

        const state = getAuthState();
        const now = Date.now();

        // Check lockout
        if (state.lockedUntil && state.lockedUntil > now) {
            const remaining = state.lockedUntil - now;
            loginError.textContent = `Too many attempts. Try again in ${formatLockoutTime(remaining)}.`;
            startLockoutCountdown(state.lockedUntil);
            return;
        }

        const candidate = passwordInput.value || '';
        const candidateHash = await sha256Hex(candidate);

        if (candidateHash === EXPECTED_HASH_HEX) {
            // Success - clear failures and set session
            setAuthState({
                fails: 0,
                lockedUntil: 0,
                unlockedUntil: now + SESSION_TTL_MS
            });
            loginError.textContent = '';
            passwordInput.value = '';
            mountGallery();

            // Show welcome if first time
            if (!localStorage.getItem('gallery_seen_welcome')) {
                setTimeout(() => {
                    welcomeModal.classList.remove('hidden');
                }, 100);
            }
        } else {
            // Failed attempt
            const fails = state.fails + 1;
            passwordInput.value = '';

            if (fails >= MAX_FAILS) {
                const lockoutMs = getLockoutMs(fails);
                const lockedUntil = now + lockoutMs;
                setAuthState({ fails, lockedUntil });
                loginError.textContent = `Too many attempts. Try again in ${formatLockoutTime(lockoutMs)}.`;
                startLockoutCountdown(lockedUntil);
            } else {
                setAuthState({ fails });
                const remaining = MAX_FAILS - fails;
                loginError.textContent = `Incorrect password. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`;
            }
        }
    }

    let lockoutInterval = null;

    function startLockoutCountdown(lockedUntil) {
        if (lockoutInterval) clearInterval(lockoutInterval);

        lockoutInterval = setInterval(() => {
            const remaining = lockedUntil - Date.now();
            if (remaining <= 0) {
                clearInterval(lockoutInterval);
                lockoutInterval = null;
                loginError.textContent = 'You can try again now.';
            } else {
                loginError.textContent = `Too many attempts. Try again in ${formatLockoutTime(remaining)}.`;
            }
        }, 1000);
    }

    // ============================================
    // GALLERY MOUNTING
    // ============================================

    function mountGallery() {
        // Hide login modal
        loginModal.style.display = 'none';

        // Clone and mount template
        const content = galleryTemplate.content.cloneNode(true);
        appContainer.appendChild(content);

        // Get DOM references after mount
        gallery = document.getElementById('gallery');
        lightbox = document.getElementById('lightbox');
        lightboxImage = document.getElementById('lightbox-image');
        lightboxVideo = document.getElementById('lightbox-video');
        lightboxCounter = document.getElementById('lightbox-counter');
        imageCount = document.getElementById('image-count');
        videoCount = document.getElementById('video-count');
        selectToggle = document.getElementById('select-toggle');
        selectionCount = document.getElementById('selection-count');
        downloadZipBtn = document.getElementById('download-zip');
        welcomeModal = document.getElementById('welcome-modal');
        welcomeClose = document.getElementById('welcome-close');

        // Initialize gallery
        initGallery();
    }

    // ============================================
    // GALLERY INITIALIZATION
    // ============================================

    async function initGallery() {
        try {
            // Now load media manifest (only after authentication)
            const response = await fetch('media-manifest.json');
            const manifest = await response.json();

            images = (manifest.images || []).map(item => ({ ...item, type: 'image' }));
            videos = (manifest.videos || []).map(item => ({ ...item, type: 'video' }));
            allMedia = [...images, ...videos].sort((a, b) => a.filename.localeCompare(b.filename));

            if (imageCount) imageCount.textContent = images.length;
            if (videoCount) videoCount.textContent = videos.length;

            renderGallery();
            setupGalleryEventListeners();
        } catch (error) {
            console.error('Error loading gallery:', error);
            gallery.innerHTML = '<p class="loading">Error loading gallery. Please refresh the page.</p>';
        }
    }

    // ============================================
    // GALLERY RENDERING
    // ============================================

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
                const thumbnailPath = item.thumbnail || item.path.replace('/videos/', '/images/').replace('.mp4', '.jpg');
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

    function getCurrentMedia() {
        return currentFilter === 'photos' ? images :
               currentFilter === 'videos' ? videos : allMedia;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    function setupGalleryEventListeners() {
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

        // Welcome close button
        welcomeClose.addEventListener('click', closeWelcome);

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

    // ============================================
    // LIGHTBOX
    // ============================================

    function openLightbox(index) {
        currentIndex = index;
        updateLightbox();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.src = '';
        }
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function navigateLightbox(direction) {
        if (lightboxVideo) lightboxVideo.pause();

        const media = getCurrentMedia();
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = media.length - 1;
        if (currentIndex >= media.length) currentIndex = 0;

        updateLightbox();
    }

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

    // ============================================
    // SELECTION MODE
    // ============================================

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
            downloadZipBtn.classList.remove('pulse');
        }
    }

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

    // ============================================
    // ZIP EXPORT
    // ============================================

    async function exportToZip() {
        if (selectedItems.size === 0) return;

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

    // ============================================
    // WELCOME MODAL & DEMO
    // ============================================

    function closeWelcome() {
        welcomeModal.classList.add('hidden');
        localStorage.setItem('gallery_seen_welcome', 'true');

        // Run demo if first time
        if (!localStorage.getItem('gallery_seen_demo')) {
            setTimeout(runDemo, 500);
        }
    }

    async function runDemo() {
        const items = document.querySelectorAll('.gallery-item');
        if (items.length < 4) return;

        // Enter selection mode
        toggleSelectionMode();

        // Select photos at different positions
        const indicesToSelect = [0, 3, 5, 8].filter(i => i < items.length);

        for (let i = 0; i < indicesToSelect.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            const item = items[indicesToSelect[i]];
            if (item) {
                toggleItemSelection(item);
            }
        }

        // Pause to show the Download ZIP pulsing
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Clear and exit selection mode
        toggleSelectionMode();

        // Mark demo as seen
        localStorage.setItem('gallery_seen_demo', 'true');
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Setup login form handler
        loginForm.addEventListener('submit', handleLogin);

        // Check for existing valid session
        if (checkExistingSession()) {
            // Already authenticated - show welcome if first time
            if (!localStorage.getItem('gallery_seen_welcome')) {
                setTimeout(() => {
                    welcomeModal.classList.remove('hidden');
                }, 100);
            }
        } else {
            // Check if currently locked out
            const state = getAuthState();
            if (state.lockedUntil && state.lockedUntil > Date.now()) {
                startLockoutCountdown(state.lockedUntil);
            }
        }
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
