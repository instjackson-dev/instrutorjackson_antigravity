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

    // --- Scroll Animations (Bautz Inspired) ---
    const revealElements = document.querySelectorAll('.reveal-fade-up, .reveal-left, .reveal-right, .reveal-zoom, .stagger-container');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // stop observing once animated
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
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

    // --- Evergreen Countdown Timer (Calculates to the 14th of the current/next month) ---
    const countdownElement = document.getElementById('countdown-timer');
    if (countdownElement) {
        let targetDay = 14;
        let targetMonth = 5; // June (0-indexed: 5 = June)
        let targetYear = 2026;
        
        let targetDateObj = new Date(targetYear, targetMonth, targetDay, 23, 59, 59);
        let now = new Date();

        // If target date has passed, advance to the 14th of the next month automatically
        while (now.getTime() > targetDateObj.getTime()) {
            targetMonth++;
            if (targetMonth > 11) {
                targetMonth = 0;
                targetYear++;
            }
            targetDateObj = new Date(targetYear, targetMonth, targetDay, 23, 59, 59);
        }

        // Dynamically update the Month Name on the HTML page to keep the header evergreen
        const monthNames = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];
        const urgencyTextElement = document.querySelector('.urgency-bar strong');
        if (urgencyTextElement) {
            urgencyTextElement.textContent = `${targetDay} de ${monthNames[targetMonth]}`;
        }

        const pricingBatchDate = document.getElementById('pricing-batch-date');
        if (pricingBatchDate) {
            const formatNumber = (num) => String(num).padStart(2, '0');
            pricingBatchDate.textContent = `${formatNumber(targetDay)}/${formatNumber(targetMonth + 1)}`;
        }

        const updateCountdown = () => {
            const currentTime = new Date().getTime();
            const difference = targetDateObj.getTime() - currentTime;

            if (difference <= 0) {
                countdownElement.innerHTML = "Inscrições Encerradas";
                clearInterval(countdownInterval);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

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
    const whatsappInput = document.getElementById('ij-whatsapp');

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
        topLeadBar.addEventListener('click', openLeadModal);
        closeModalBtn.addEventListener('click', closeLeadModal);

        leadModal.addEventListener('click', (e) => {
            if (e.target === leadModal) {
                closeLeadModal();
            }
        });

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

    // Dynamic environment detection for n8n Webhook
    const getWebhookUrl = () => {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.protocol === 'file:';
        const path = isLocal ? '/webhook-test/ebook-lead' : '/webhook/ebook-lead';
        return `https://n8n.vps7900.panel.icontainer.run${path}`;
    };

    function ijLimpaWA(tel) {
        return tel.replace(/\D/g, '');
    }

    async function ijEnviar() {
        const btn = document.getElementById('ij-submit');
        const err = document.getElementById('ij-error');
        if (err) err.style.display = 'none';

        const nomeInput = document.getElementById('ij-nome');
        const funcaoSelect = document.getElementById('ij-funcao');
        const empresaInput = document.getElementById('ij-empresa');
        const whatsappInput = document.getElementById('ij-whatsapp');
        const emailInput = document.getElementById('ij-email');

        const nome = nomeInput ? nomeInput.value.trim() : '';
        const funcao = funcaoSelect ? funcaoSelect.value : '';
        const empresa = empresaInput ? empresaInput.value.trim() : '';
        const whatsappCleaned = whatsappInput ? ijLimpaWA(whatsappInput.value) : '';
        const email = emailInput ? emailInput.value.trim() : '';

        if (!nome || !funcao || whatsappCleaned.length < 10) {
            if (err) {
                err.textContent = 'Preencha nome, função e WhatsApp para continuar.';
                err.style.display = 'block';
            }
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        }

        // Save state in LocalStorage for later sessions
        localStorage.setItem('lead_submitted', 'true');
        localStorage.setItem('lead_name', nome);
        localStorage.setItem('lead_email', email);
        localStorage.setItem('lead_whatsapp', whatsappInput ? whatsappInput.value : '');

        const webhookUrl = getWebhookUrl();
        console.log("Enviando lead para webhook:", webhookUrl);

        try {
            const res = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome,
                    funcao,
                    empresa,
                    whatsapp: '55' + whatsappCleaned,
                    email,
                    origem: 'site-instrutorjackson',
                    data: new Date().toISOString()
                })
            });

            if (!res.ok) throw new Error('Erro ' + res.status);

            // Hide form body and show success
            const formBody = document.getElementById('ij-form-body');
            const successBody = document.getElementById('ij-success');
            if (formBody) formBody.style.display = 'none';
            if (successBody) successBody.style.display = 'block';

            // Prepare success state actions
            const ebookUrl = "https://drive.google.com/file/d/1EoNLveUjusrXLRNni5tKxuI7CRiLhOCN/view?usp=sharing";
            const message = encodeURIComponent(`Olá Instrutor Jackson! Acabei de me cadastrar no site para baixar o E-book de IA no livro de ocorrências. Meu nome é ${nome}.`);
            const whatsappUrl = `https://wa.me/5541997538164?text=${message}`;

            // Set the link on the success state whatsapp button
            const waBtn = document.getElementById('ij-wa-btn');
            if (waBtn) {
                waBtn.href = whatsappUrl;
            }

            // Try to trigger automatic PDF download
            try {
                window.open(ebookUrl, '_blank');
            } catch (popErr) {
                console.log("Popup blocked automatically, user can click PDF button:", popErr);
            }

            // Delay redirecting the main tab to WhatsApp to ensure new tab opens and local storage is saved
            setTimeout(() => {
                window.location.href = whatsappUrl;
            }, 1500);

        } catch (e) {
            console.error("Erro no envio:", e);
            if (err) {
                err.textContent = 'Ocorreu um erro. Tente novamente ou entre em contato pelo WhatsApp.';
                err.style.display = 'block';
            }
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'BAIXAR E-BOOK GRÁTIS <i class="fas fa-download"></i>';
            }
        }
    }

    // --- Floating Theme Customizer (Color Switcher) ---
    const themeCustomizer = document.getElementById('theme-customizer');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeOptBtns = document.querySelectorAll('.theme-opt-btn');

    if (themeCustomizer && themeToggleBtn) {
        // Toggle panel open/close
        themeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            themeCustomizer.classList.toggle('active');
        });

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!themeCustomizer.contains(e.target)) {
                themeCustomizer.classList.remove('active');
            }
        });

        // Handle color selection
        themeOptBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                
                // Reset body themes
                document.body.classList.remove('theme-red', 'theme-blue', 'theme-green');
                
                // Apply new theme if not default (gold)
                if (theme !== 'gold') {
                    document.body.classList.add(`theme-${theme}`);
                }
                
                // Update active button state
                themeOptBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Save selection in localStorage
                localStorage.setItem('tactical-theme', theme);
            });
        });

        // Sincronize visual state of buttons with active theme on page load
        const activeTheme = localStorage.getItem('tactical-theme') || 'gold';
        themeOptBtns.forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme');
            if (btnTheme === activeTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // Make functions available globally so they can be triggered from inline HTML handlers
    window.ijEnviar = ijEnviar;
    window.ijLimpaWA = ijLimpaWA;
});

