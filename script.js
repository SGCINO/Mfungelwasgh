/* Small helpers */
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

/* Section activation (keeps only one visible and applies focused style) */
function activateSection(id) {
    document.querySelectorAll('section.card').forEach(s => {
        s.style.display = 'none';
        s.classList.remove('focused', 'enter');
        s.setAttribute('aria-hidden', 'true');
    });
    const t = document.getElementById(id);
    if (!t) return;
    t.style.display = 'block';
    t.classList.add('focused');
    t.setAttribute('aria-hidden', 'false');
    // trigger CSS enter transition
    requestAnimationFrame(() => void t.offsetWidth);
    t.classList.add('enter');
    // scroll to top of the card (helpful on mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById("year").textContent = new Date().getFullYear();

/* Menu toggle (mobile) */
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle && menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('show');
});
document.addEventListener('click', (e) => {
    if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) navLinks.classList.remove('show');
});
// close nav on Escape
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') navLinks.classList.remove('show'); });

/* Initial active section + fade in */
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    activateSection('home');
});

/* Simple slideshow on home */
(function () {
    const slides = document.querySelectorAll('#homeSlideshow .slide-img');
    if (!slides || slides.length === 0) return;
    let current = 0;
    function show(i) {
        slides.forEach((s, idx) => s.style.display = (idx === i) ? 'block' : 'none');
    }
    show(0);
    setInterval(() => { current = (current + 1) % slides.length; show(current); }, 5000);
})();

/* Spinner behaviour for Book Now, Submit Rating, Submit Comment (visual only) */
['bookNow', 'submitRating', 'submitComment'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', (ev) => {
        // add loading class, remove after ~1.5s
        btn.classList.add('loading');
        setTimeout(() => btn.classList.remove('loading'), 1500);
    });
});

/* BOOK NOW: open mailto */
document.getElementById('bookNow').addEventListener('click', () => {
    // small delay so spinner is visible (mail client will open)
    window.location.href = 'mailto:Mfungelwalogistics@gmail.com?subject=' + encodeURIComponent('Truck Booking Inquiry - Mfungelwa Transport');
});
/* Comment section */
(function () {
    const key = 'mfungelwa_comments_v3';
    let comments = [];
    const list = $('#CommentList');
    const toggle = $('#toggleCommentsLink');
    const nameInp = $('#companyName_comment');
    const textInp = $('#comment');
    const logoInp = $('#companyLogo_comment');
    const label = $('#fileUploadLabel_comment');
    let logoData = '';
    let showingAll = false;

    function save() { localStorage.setItem(key, JSON.stringify(comments)); }
    function load() { const raw = localStorage.getItem(key); comments = raw ? JSON.parse(raw) : []; }

    function render(all = false) {
        list.innerHTML = '';
        if (!comments.length) { list.innerHTML = '<p style="color:#777;">No comments yet — be first!</p>'; toggle.style.display = 'none'; return; }
        const toShow = all ? comments : comments.slice(0, 3);
        toShow.forEach((c, i) => {
            const item = document.createElement('div');
            item.className = 'comment-item';
            item.style.animationDelay = `${i * 0.15}s`;
            const logoHTML = c.logo ? `<div class="logo"><img src="${c.logo}"></div>` : `<div class="logo"><img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"></div>`;
            item.innerHTML = `${logoHTML}<div class="comment-content"><strong>${c.name}</strong><p>${c.comment}</p></div>`;
            list.appendChild(item);
        });
        if (comments.length > 3) {
            toggle.style.display = 'block';
            toggle.textContent = all ? 'Show less comments...' : 'See more comments...';
        } else toggle.style.display = 'none';
    }

    toggle.addEventListener('click', e => {
        e.preventDefault();
        showingAll = !showingAll;
        render(showingAll);
    });

    $('#submitComment').addEventListener('click', e => {
        e.preventDefault();
        const name = nameInp.value.trim();
        const txt = textInp.value.trim();
        if (!name || !txt) { alert('Please enter company name and comment.'); return; }
        comments.unshift({ name, comment: txt, time: Date.now(), logo: logoData });
        if (comments.length > 100) comments = comments.slice(0, 100);
        save(); render();
        nameInp.value = ''; textInp.value = ''; logoInp.value = ''; logoData = ''; label.style.removeProperty('background-image'); label.classList.remove('has-preview');
    });

    logoInp.addEventListener('change', e => {
        const f = e.target.files && e.target.files[0];
        if (!f) { label.classList.remove('has-preview'); return; }
        if (!f.type.startsWith('image/')) { alert('Only image files allowed'); logoInp.value = ''; return; }
        const reader = new FileReader();
        reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const size = 80, canvas = document.createElement('canvas');
                canvas.width = size; canvas.height = size;
                const ctx = canvas.getContext('2d');
                const ratio = Math.max(size / img.width, size / img.height);
                const w = img.width * ratio, h = img.height * ratio;
                ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
                logoData = canvas.toDataURL('image/png');
                label.classList.add('has-preview');
                label.style.backgroundImage = `url(${logoData})`;
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(f);
    });

    load(); render();
})();

/* ---------------------------
   RATINGS (localStorage)
   --------------------------- */
(function () {
    const STORAGE_RATINGS = 'mfungelwa_ratings_v1';
    let ratings = [];

    const nameInp = $('#companyName_rate');
    const starContainer = $('#starContainer');
    const submitBtn = $('#submitRating');
    const ratingList = $('#ratingList');
    const ratingCount = $('#ratingCount');
    const moreRatings = $('#moreRatingsLink');

    const STAR_COUNT = 5;
    let selectedStars = 0;
    let currentLogoForRating = ''; // dataURL for rating item

    function save() { try { localStorage.setItem(STORAGE_RATINGS, JSON.stringify(ratings)); } catch (e) { } }
    function load() { try { const raw = localStorage.getItem(STORAGE_RATINGS); ratings = raw ? JSON.parse(raw) : []; } catch (e) { ratings = []; } }

    function makeStars() {
        starContainer.innerHTML = '';
        for (let i = 1; i <= STAR_COUNT; i++) {
            const el = document.createElement('i');
            el.className = 'fa fa-star';
            el.tabIndex = 0;
            el.dataset.value = i;
            el.setAttribute('role', 'radio');
            el.setAttribute('aria-label', i + ' star');
            el.addEventListener('mouseover', () => highlight(i));
            el.addEventListener('focus', () => highlight(i));
            el.addEventListener('mouseout', clearHover);
            el.addEventListener('blur', clearHover);
            el.addEventListener('click', () => select(i));
            el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); select(i); } });
            starContainer.appendChild(el);
        }
    }
    function highlight(n) { starContainer.querySelectorAll('i').forEach((s, idx) => s.classList.toggle('hover', idx < n)); }
    function clearHover() { starContainer.querySelectorAll('i').forEach(s => s.classList.remove('hover')); }
    function select(n) { selectedStars = n || 0; starContainer.querySelectorAll('i').forEach((s, idx) => s.classList.toggle('selected', idx < selectedStars)); }

    function fallbackSvg(name) {
        const initials = (name || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || 'MT';
        const color = '#dbe4ff';
        const textColor = '#1f2b6b';
        return `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><rect width='100%' height='100%' fill='${color}' rx='80' ry='80'/><text x='50%' y='54%' font-size='60' text-anchor='middle' fill='${textColor}' font-family='Inter, sans-serif' font-weight='700'>${initials}</text></svg>`;
    }

    function render(showAll = false) {
        ratingList.innerHTML = '';
        if (!ratings || ratings.length === 0) {
            ratingList.innerHTML = '<p style="color:var(--muted);font-size:14px;">No ratings yet — be the first!</p>';
            ratingCount.textContent = 0;
            moreRatings.style.display = 'none';
            return;
        }

        const toShow = showAll ? ratings : ratings.slice(0, 3);
        toShow.forEach((r, i) => {
            const item = document.createElement('div');
            item.className = 'rating-item';
            item.style.animationDelay = `${i * 0.2}s`;

            const logoHTML = r.logoDataUrl
                ? `<div class="logo"><img src="${r.logoDataUrl}" alt="${escapeHtml(r.name)} logo"></div>`
                : `<div class="logo"><img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="default logo"></div>`;

            const starsHTML = '<div class="stars">' + '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars) + '</div>';
            const metaHTML = `
      <div class="meta">
        <strong>${escapeHtml(r.name)}</strong>
        ${starsHTML}
        <small>${new Date(r.time).toLocaleString()}</small>
      </div>
    `;

            item.innerHTML = logoHTML + metaHTML;
            ratingList.appendChild(item);
        });

        ratingCount.textContent = ratings.length;
        moreRatings.style.display = (ratings.length > 3 && !showAll) ? 'block' : 'none';
        moreRatings.textContent = showAll ? 'Show less ratings...' : 'See more ratings...';
    }


    moreRatings.addEventListener('click', (e) => { e.preventDefault(); render(true); moreRatings.style.display = 'none'; });

    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = (nameInp && nameInp.value || '').trim();
        if (!name) { alert('Please enter company name.'); return; }
        if (!selectedStars) { alert('Please select stars.'); return; }
        const newR = { name, logoDataUrl: currentLogoForRating || '', stars: Number(selectedStars), time: new Date().toISOString() };
        ratings.unshift(newR);
        if (ratings.length > 500) ratings = ratings.slice(0, 500);
        save();
        render();
        // reset
        nameInp.value = '';
        currentLogoForRating = '';
        // clear rating UI
        select(0);
        // remove preview on rating upload label
        clearUploadPreview($('#fileUploadLabel_rate'));
        // small UI feedback already handled by spinner earlier
    });

    makeStars();
    // init storage
    load();
    render();

    // expose function for upload handler to set current logo
    window.__setRatingLogo = function (dataUrl) { currentLogoForRating = dataUrl; };

})();

/* ---------------------------
   Shared upload preview handling
   Works for both comment and rating sections
   - Each .file-upload element contains an <input type="file"> and an optional .remove-logo button
   - Preview is applied as background-image on the .file-upload label (.has-preview)
   --------------------------- */
(function () {
    const uploads = document.querySelectorAll('.file-upload');
    uploads.forEach(label => {
        const input = label.querySelector('input[type="file"]');
        const removeBtn = label.querySelector('.remove-logo');

        if (!input) return;

        input.addEventListener('change', (ev) => {
            const f = ev.target.files && ev.target.files[0];
            if (!f) { clearUploadPreview(label); return; }
            if (!f.type.startsWith('image/')) { alert('Only image files allowed (png/jpg).'); input.value = ''; clearUploadPreview(label); return; }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const size = 160; // draw larger for crisp background
                    const canvas = document.createElement('canvas');
                    canvas.width = size; canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(0, 0, size, size);
                    const ratio = Math.max(size / img.width, size / img.height);
                    const w = img.width * ratio;
                    const h = img.height * ratio;
                    const dx = (size - w) / 2;
                    const dy = (size - h) / 2;
                    ctx.drawImage(img, dx, dy, w, h);
                    const dataUrl = canvas.toDataURL('image/png');
                    applyUploadPreview(label, dataUrl);

                    // if this is rating upload, inform rating module
                    if (label.id === 'fileUploadLabel_rate') {
                        if (window.__setRatingLogo) window.__setRatingLogo(dataUrl);
                    }
                    // comment upload doesn't need separate global var (stored inside comments if desired)
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(f);
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                clearUploadPreview(label);
                if (input) input.value = '';
                // clear rating logo var if rating upload cleared
                if (label.id === 'fileUploadLabel_rate' && window.__setRatingLogo) window.__setRatingLogo('');
            });
        }

    });

    function applyUploadPreview(label, dataUrl) {
        label.classList.add('has-preview');
        label.style.backgroundImage = `url(${dataUrl})`;
        label.style.backgroundSize = 'cover';
        label.style.backgroundPosition = 'center';
        const removeBtn = label.querySelector('.remove-logo');
        if (removeBtn) removeBtn.style.display = 'inline-block';
    }
    window.clearUploadPreview = function (label) {
        if (!label) return;
        label.classList.remove('has-preview');
        label.style.removeProperty('background-image');
        const removeBtn = label.querySelector('.remove-logo');
        if (removeBtn) removeBtn.style.display = 'none';
    }
})();

/* small utility to escape html for insertion */
function escapeHtml(s) { return String(s).replace(/[&<"'>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }

/* keyboard accessible nav links: press Enter to activate */
document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('keydown', e => { if (e.key === 'Enter') a.click(); });
});

/* Ensure all sections exist visibly initially hidden then controlled by JS */
document.querySelectorAll('section.card').forEach(s => { s.style.display = 'none'; });

/* === About section 3D slideshow === */
(function () {
    const slides = document.querySelectorAll('#AboutSlideshow .slide');
    if (!slides.length) return;
    let current = 0;
    let timer;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            if (i === index) slide.classList.add('active');
            else if (i === (index === 0 ? slides.length - 1 : index - 1)) slide.classList.add('prev');
        });
    }

    function nextSlide() {
        current = (current + 1) % slides.length;
        showSlide(current);
    }

    showSlide(current);
    timer = setInterval(nextSlide, 4000);

    // Optional: Pause on hover
    const container = document.getElementById('AboutSlideshow');
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => timer = setInterval(nextSlide, 4000));
})();

/* === Home slideshow folding transition === */
(function () {
    const slides = document.querySelectorAll('#HomeSlideshow .fold-slide');
    if (!slides.length) return;
    let current = 0;
    let timer;

    function showFold(index) {
        slides.forEach((s, i) => {
            s.classList.remove('active', 'prev');
            if (i === index) s.classList.add('active');
            else if (i === (index === 0 ? slides.length - 1 : index - 1)) s.classList.add('prev');
        });
    }

    function nextFold() {
        current = (current + 1) % slides.length;
        showFold(current);
    }

    showFold(current);
    timer = setInterval(nextFold, 4000);

    const container = document.getElementById('HomeSlideshow');
    container.addEventListener('mouseenter', () => clearInterval(timer));
    container.addEventListener('mouseleave', () => timer = setInterval(nextFold, 4000));
})();

/* === Service Card Click Activation === */
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.service-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
});