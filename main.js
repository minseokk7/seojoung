// Initialize Lucide Icons
lucide.createIcons();

// Initialize Smooth Scroll (Lenis)
const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.5
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// GSAP Animations
gsap.registerPlugin(ScrollTrigger);

// Hero Animations
const heroTL = gsap.timeline();

heroTL.from(".reveal-text", {
    y: 100,
    opacity: 0,
    duration: 1.2,
    ease: "power4.out",
    stagger: 0.2
})
.from(".reveal-text-sub", {
    y: 50,
    opacity: 0,
    duration: 1,
    ease: "power4.out"
}, "-=0.8")
.from(".reveal-btn", {
    y: 30,
    opacity: 0,
    duration: 0.8,
    ease: "power4.out"
}, "-=0.6")
.from("#hero-video", {
    scale: 1.2,
    opacity: 0,
    duration: 2,
    ease: "power2.out"
}, 0);

// Navbar scroll effect
ScrollTrigger.create({
    start: "top top",
    onUpdate: (self) => {
        if (self.scroll() > 50) {
            document.getElementById('navbar').classList.add('scrolled');
        } else {
            document.getElementById('navbar').classList.remove('scrolled');
        }
    }
});

// Modal Logic
const modals = document.querySelectorAll('.modal');
const closeBtns = document.querySelectorAll('.close-modal');

closeBtns.forEach(btn => {
    btn.onclick = () => {
        modals.forEach(m => m.classList.remove('active'));
    };
});

window.onclick = (event) => {
    modals.forEach(m => {
        if (event.target == m) {
            m.classList.remove('active');
        }
    });
};

// Admin Panel Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.admin-tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(tabId).classList.add('active');
    });
});

// Admin Panel Submission
const adminBtn = document.getElementById('admin-btn');
const adminPanel = document.getElementById('admin-panel');
const machineForm = document.getElementById('add-machine-form');
const postForm = document.getElementById('add-post-form');

if (adminBtn) {
    adminBtn.onclick = () => {
        if (localStorage.getItem('isAdmin') === 'true') {
            if (confirm('로그아웃 하시겠습니까?')) {
                localStorage.removeItem('isAdmin');
                alert('로그아웃 되었습니다.');
                location.reload();
            } else {
                adminPanel.classList.add('active');
            }
        } else {
            const password = prompt('관리자 암호를 입력해주세요:');
            if (password === 'sj1234') {
                localStorage.setItem('isAdmin', 'true');
                alert('관리자로 로그인되었습니다.');
                adminPanel.classList.add('active');
                location.reload();
            } else {
                alert('암호가 올바르지 않습니다.');
            }
        }
    };
}

// Machine Add
if (machineForm) {
    machineForm.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(machineForm);
        const data = {
            name: formData.get('name'),
            maker: formData.get('maker'),
            model: formData.get('model'),
            year: formData.get('year'),
            category: formData.get('category'),
            specs: formData.get('specs'),
            image: formData.get('image') || "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&q=80&w=800",
            address: formData.get('address'),
            status: 'onsale'
        };

        if (window.inventoryManager) {
            window.inventoryManager.addMachine(data);
            adminPanel.classList.remove('active');
            machineForm.reset();
            showPage('#hero');
        }
    };
}

// Post Add
if (postForm) {
    postForm.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(postForm);
        const data = {
            title: formData.get('title'),
            content: formData.get('content'),
            author: formData.get('author'),
            date: new Date().toISOString().split('T')[0],
            views: 0
        };

        if (window.boardManager) {
            window.boardManager.addPost(data);
            adminPanel.classList.remove('active');
            postForm.reset();
            showPage('#board');
        }
    };
}

// Contact Form
const contactForm = document.getElementById('main-contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = contactForm.querySelector('input[type="text"]').value;
        const phone = contactForm.querySelector('input[type="tel"]').value;
        const model = contactForm.querySelectorAll('input[type="text"]')[1].value;
        const message = contactForm.querySelector('textarea').value;

        const subject = `[서종기계 매물문의] ${name}님`;
        const body = `성함: ${name}\n연락처: ${phone}\n관심기종: ${model}\n내용: ${message}`;
        
        window.location.href = `mailto:dldbcks0619@naver.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        alert('이메일 클라이언트가 실행됩니다. 메일을 보내주시면 확인 후 연락드리겠습니다.');
        contactForm.reset();
    });
}

// SPA Router Logic
const navLinks = document.querySelectorAll('.nav-links a');
const sections = {
    '#hero': ['#hero', '#inventory', '#cta'],
    '#inventory': ['#hero', '#inventory', '#cta'],
    '#board': ['#board'],
    '#about': ['#about'],
    '#contact': ['#contact']
};

function showPage(targetId) {
    if (!targetId || !sections[targetId]) targetId = '#hero';

    // Determine which sections to show
    const sectionsToShow = sections[targetId];
    
    // Hide all sections first
    document.querySelectorAll('section').forEach(s => {
        s.style.display = 'none';
        s.style.opacity = '0';
    });

    // Show selected sections with a small fade in
    sectionsToShow.forEach(id => {
        const el = document.querySelector(id);
        if (el) {
            el.style.display = 'block';
            gsap.to(el, { opacity: 1, duration: 0.5 });
        }
    });

    // Scroll to top
    lenis.scrollTo(0, { immediate: true });

    // Update Nav Active State
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === targetId) {
            link.classList.add('active');
        }
    });

    // Refresh ScrollTrigger and Lucide
    ScrollTrigger.refresh();
}

// Make globally accessible for inline onclick
window.showPage = showPage;

// Initial View
showPage(window.location.hash || '#hero');

// Global Router Listener
document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        showPage(targetId);
        window.location.hash = targetId;
    }
});

// Handle External calls or direct button clicks that set hash
window.addEventListener('hashchange', () => {
    showPage(window.location.hash);
});
