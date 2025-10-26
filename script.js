/**
 * Merlinda's Soaperie - Interactive Features
 * Handcrafted with vanilla JavaScript
 */

// ============================================
// Mobile Menu Toggle
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = mobileMenuBtn.querySelector('i');

    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');

        // Toggle icon between bars and times
        if (!mobileMenu.classList.contains('active')) {
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        } else {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-times');
        }
    });

    // Close mobile menu when clicking on a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            menuIcon.classList.remove('fa-times');
            menuIcon.classList.add('fa-bars');
        });
    });
});


// ============================================
// Smooth Scroll for Navigation Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));

        if (target) {
            const headerOffset = 100;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});


// ============================================
// Active Navigation Link on Scroll
// ============================================
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';
    const scrollPosition = window.pageYOffset;

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;

        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});


// ============================================
// Header Shadow on Scroll
// ============================================
window.addEventListener('scroll', function() {
    const header = document.querySelector('header');

    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});


// ============================================
// Scroll Animation Observer
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all elements with scroll-fade-in class
window.addEventListener('load', function() {
    const fadeElements = document.querySelectorAll('.fade-in');

    fadeElements.forEach(element => {
        // Add scroll-fade-in class for scroll-based animations
        element.classList.add('scroll-fade-in');
        observer.observe(element);
    });
});


// ============================================
// Product Card Hover Effects
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});


// ============================================
// Social Link Analytics (Optional)
// ============================================
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const platform = this.href.includes('facebook') ? 'Facebook' :
                        this.href.includes('youtube') ? 'YouTube' : 'External';

        console.log(`Social link clicked: ${platform}`);

        // Here you can add analytics tracking if needed
        // Example: gtag('event', 'social_click', { platform: platform });
    });
});


// ============================================
// Lazy Loading for Images (Future Enhancement)
// ============================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            }
        });
    });

    // Observe images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}


// ============================================
// Shopify Integration Helper Functions
// ============================================

/**
 * Initialize Shopify Buy Button
 * Replace the content in #shopify-products div with this function call
 * when you have your Shopify store set up
 */
function initializeShopify() {
    // This is a placeholder function for future Shopify integration
    // Replace with actual Shopify Buy Button code when ready

    console.log('Shopify integration ready');

    // Example structure (replace with actual Shopify code):
    /*
    var scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    if (window.ShopifyBuy) {
        if (window.ShopifyBuy.UI) {
            ShopifyBuyInit();
        } else {
            loadScript();
        }
    } else {
        loadScript();
    }

    function loadScript() {
        var script = document.createElement('script');
        script.async = true;
        script.src = scriptURL;
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
        script.onload = ShopifyBuyInit;
    }

    function ShopifyBuyInit() {
        var client = ShopifyBuy.buildClient({
            domain: 'your-store.myshopify.com',
            storefrontAccessToken: 'your-storefront-access-token',
        });
        ShopifyBuy.UI.onReady(client).then(function (ui) {
            ui.createComponent('collection', {
                id: 'your-collection-id',
                node: document.getElementById('shopify-products'),
                // Custom styling to match our theme
                options: {
                    product: {
                        styles: {
                            button: {
                                'background-color': '#A0522D',
                                ':hover': {
                                    'background-color': '#D4A574',
                                }
                            }
                        }
                    }
                }
            });
        });
    }
    */
}


// ============================================
// Newsletter Form Handler (if added later)
// ============================================
function handleNewsletterSubmit(event) {
    event.preventDefault();

    const email = event.target.querySelector('input[type="email"]').value;

    // Add your newsletter subscription logic here
    console.log('Newsletter signup:', email);

    // Show success message
    alert('Thank you for subscribing to our newsletter!');
    event.target.reset();
}


// ============================================
// Contact Form Handler (if added later)
// ============================================
function handleContactSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    // Add your contact form logic here
    console.log('Contact form submitted:', data);

    // Show success message
    alert('Thank you for your message! We\'ll get back to you soon.');
    event.target.reset();
}


// ============================================
// Page Load Performance
// ============================================
window.addEventListener('load', function() {
    // Log page load time for performance monitoring
    const loadTime = window.performance.timing.domContentLoadedEventEnd -
                     window.performance.timing.navigationStart;

    console.log(`Page loaded in ${loadTime}ms`);
});


// ============================================
// Prevent Flash of Unstyled Content
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.body.style.visibility = 'visible';
});


// ============================================
// Accessibility: Skip to Main Content
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Add skip link for keyboard navigation
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-terracotta text-cream p-4 rounded z-50';
    document.body.insertBefore(skipLink, document.body.firstChild);
});


// ============================================
// Product Modal Functionality
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Get all modal triggers (View Details buttons)
    const modalTriggers = document.querySelectorAll('[data-modal]');
    const modals = document.querySelectorAll('.modal');

    // Function to open modal
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.classList.add('modal-open');

            // Add animation class to modal content
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.style.animation = 'none';
                setTimeout(() => {
                    modalContent.style.animation = '';
                }, 10);
            }
        }
    }

    // Function to close modal
    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    }

    // Add click event to all View Details buttons
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            openModal(modalId);
        });
    });

    // Add close functionality to each modal
    modals.forEach(modal => {
        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                closeModal(modal);
            });
        }

        // Close when clicking overlay
        const overlay = modal.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function() {
                closeModal(modal);
            });
        }

        // Prevent closing when clicking modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
    });

    // Close modal on ESC key press
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('active')) {
                    closeModal(modal);
                }
            });
        }
    });
});


// ============================================
// Console Art (Just for fun!)
// ============================================
console.log(`
%c
   ╔═══════════════════════════════════════╗
   ║                                       ║
   ║    Merlinda's Soaperie                ║
   ║    Handcrafted with Love              ║
   ║                                       ║
   ║    🧼 Natural • Organic • Pure        ║
   ║                                       ║
   ╚═══════════════════════════════════════╝

`, 'color: #A0522D; font-weight: bold;');

console.log('%cWebsite crafted with vanilla JavaScript, Tailwind CSS, and Font Awesome',
            'color: #D4A574; font-style: italic;');
