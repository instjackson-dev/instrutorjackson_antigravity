/* 
   Elite Tactics - Script.js 
   Handles Mobile Menu, Sticky Header, Scroll Animations
*/

document.addEventListener('DOMContentLoaded', () => {

    // --- Force Hero Video Playback ---
    const heroVideo = document.querySelector('.hero-video-element');
    if (heroVideo) {
        heroVideo.muted = true;
        heroVideo.play().catch(err => {
            console.log("Autoplay blocked, waiting for interaction: ", err);
            const playOnInteraction = () => {
                heroVideo.play().catch(() => {});
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
                document.removeEventListener('scroll', playOnInteraction);
            };
            document.addEventListener('click', playOnInteraction);
            document.addEventListener('touchstart', playOnInteraction);
            document.addEventListener('scroll', playOnInteraction);
        });
    }

    // --- Sticky Header on Scroll ---
    const header = document.querySelector('.header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    const navLinks = document.querySelectorAll('.main-nav a');

    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Close mobile menu when a link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            const icon = mobileMenuBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // --- Smooth Scrolling for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                // Adjust scroll position for fixed header
                const headerHeight = header.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Scroll Animations ---
    const animateElements = document.querySelectorAll('.module-card, .about-text, .audience-item, .pricing-card, .faq-item, .video-container, .carousel-container');

    // Add initial class for animation
    animateElements.forEach(el => {
        el.classList.add('animate-on-scroll');
    });

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = question.classList.contains('active');

            // Close all other open FAQs (optional, but good for UX)
            faqQuestions.forEach(q => {
                q.classList.remove('active');
                q.nextElementSibling.style.maxHeight = null;
            });

            // If the clicked one wasn't open, open it
            if (!isOpen) {
                question.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // --- Testimonials Carousel ---
    const track = document.querySelector('.carousel-track');
    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.carousel-control.next');
    const prevButton = document.querySelector('.carousel-control.prev');
    const dotsContainer = document.querySelector('.carousel-dots-container');
    
    let currentIndex = 0;

    // Helper to calculate visible slides
    const getVisibleSlidesCount = () => {
        if (window.innerWidth >= 1024) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
    };

    // Calculate maximum index we can slide to
    const getMaxIndex = () => {
        return Math.max(0, slides.length - getVisibleSlidesCount());
    };

    // Update track position and active indicators
    const updateCarousel = () => {
        if (slides.length === 0) return;
        const slideWidth = slides[0].getBoundingClientRect().width;
        // Limit index to valid bounds
        currentIndex = Math.max(0, Math.min(currentIndex, getMaxIndex()));
        
        track.style.transform = `translateX(-${currentIndex * slideWidth}px)`;
        
        // Update active dots
        const dots = Array.from(dotsContainer.children);
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Toggle buttons state
        if (currentIndex === 0) {
            prevButton.style.opacity = '0.5';
            prevButton.style.pointerEvents = 'none';
        } else {
            prevButton.style.opacity = '1';
            prevButton.style.pointerEvents = 'auto';
        }

        if (currentIndex >= getMaxIndex()) {
            nextButton.style.opacity = '0.5';
            nextButton.style.pointerEvents = 'none';
        } else {
            nextButton.style.opacity = '1';
            nextButton.style.pointerEvents = 'auto';
        }
    };

    // Create dot indicators
    const createDots = () => {
        dotsContainer.innerHTML = '';
        const maxDots = getMaxIndex() + 1;
        for (let i = 0; i < maxDots; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            if (i === 0) dot.classList.add('active');
            dot.setAttribute('aria-label', `Ir para depoimento ${i + 1}`);
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
            });
            dotsContainer.appendChild(dot);
        }
    };

    // Initialize carousel if elements exist
    if (track && slides.length > 0) {
        createDots();
        updateCarousel();

        // Next Button Click
        nextButton.addEventListener('click', () => {
            if (currentIndex < getMaxIndex()) {
                currentIndex++;
                updateCarousel();
            }
        });

        // Prev Button Click
        prevButton.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                updateCarousel();
            }
        });

        // Handle Window Resize (recalculate slide width and dots)
        window.addEventListener('resize', () => {
            createDots();
            updateCarousel();
        });

        // --- Touch Swipe Support for Mobile ---
        let startX = 0;
        let endX = 0;

        track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        }, { passive: true });

        track.addEventListener('touchend', () => {
            const threshold = 50; // Minimum swipe distance in px
            if (startX - endX > threshold) {
                // Swipe Left -> Next
                if (currentIndex < getMaxIndex()) {
                    currentIndex++;
                    updateCarousel();
                }
            } else if (endX - startX > threshold) {
                // Swipe Right -> Prev
                if (currentIndex > 0) {
                    currentIndex--;
                    updateCarousel();
                }
            }
        });
    }

    // --- Countdown Timer for 14th June 2026 ---
    const countdownElement = document.getElementById('countdown-timer');
    if (countdownElement) {
        // Set target date: 14th June 2026 23:59:59 UTC-3 (America/Sao_Paulo)
        const targetDate = new Date("June 14, 2026 23:59:59").getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                countdownElement.innerHTML = "Inscrições Encerradas";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            // Format numbers to always show two digits
            const formatNumber = (num) => String(num).padStart(2, '0');

            countdownElement.innerHTML = `${formatNumber(days)}d ${formatNumber(hours)}h ${formatNumber(minutes)}m ${formatNumber(seconds)}s`;
        };

        updateCountdown();
        const countdownInterval = setInterval(updateCountdown, 1000);
    }

    // --- Lead Capture Pop-up & Top Bar ---
    const topLeadBar = document.getElementById('top-lead-bar');
    const leadModal = document.getElementById('lead-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const leadForm = document.getElementById('lead-form');
    const whatsappInput = document.getElementById('lead-whatsapp');

    // Function to open modal
    const openLeadModal = () => {
        leadModal.classList.add('active');
        sessionStorage.setItem('lead_modal_shown', 'true');
    };

    // Function to close modal
    const closeLeadModal = () => {
        leadModal.classList.remove('active');
    };

    if (topLeadBar && leadModal && closeModalBtn) {
        // Click on top bar opens modal
        topLeadBar.addEventListener('click', openLeadModal);

        // Click on close button closes modal
        closeModalBtn.addEventListener('click', closeLeadModal);

        // Click outside the modal card closes modal
        leadModal.addEventListener('click', (e) => {
            if (e.target === leadModal) {
                closeLeadModal();
            }
        });

        // Trigger pop-up after 15 seconds if not shown in this session and not submitted
        const hasShownThisSession = sessionStorage.getItem('lead_modal_shown');
        const hasSubmitted = localStorage.getItem('lead_submitted');

        if (!hasShownThisSession && !hasSubmitted) {
            setTimeout(openLeadModal, 15000);
        }
    }

    // Form input mask for WhatsApp: (XX) XXXXX-XXXX
    if (whatsappInput) {
        whatsappInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // Handle Form Submission
    if (leadForm) {
        leadForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('lead-name').value;
            const email = document.getElementById('lead-email').value;
            const whatsapp = whatsappInput.value;

            // Save state
            localStorage.setItem('lead_submitted', 'true');
            localStorage.setItem('lead_name', name);
            localStorage.setItem('lead_email', email);
            localStorage.setItem('lead_whatsapp', whatsapp);

            // Redirect to E-book link
            const ebookUrl = "https://drive.google.com/file/d/1EoNLveUjusrXLRNni5tKxuI7CRiLhOCN/view?usp=sharing";
            window.open(ebookUrl, '_blank');

            // Send dynamic message to WhatsApp
            const message = encodeURIComponent(`Olá Instrutor Jackson! Acabei de me cadastrar no site para baixar o E-book de IA no livro de ocorrências. Meu nome é ${name}.`);
            const whatsappUrl = `https://wa.me/5541997538164?text=${message}`;
            
            // Wait slightly before redirecting/opening WhatsApp chat to ensure the PDF tab is spawned
            setTimeout(() => {
                window.location.href = whatsappUrl;
            }, 800);

            closeLeadModal();
        });
    }
});
