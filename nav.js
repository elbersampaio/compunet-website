(function () {
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';

  var style = document.createElement('style');
  style.textContent = `

/* ── Reset ── */
html { scroll-behavior: smooth; }
body { margin: 0; padding-top: 68px; }
@media (max-width: 1279px) { html { scroll-padding-top: 64px; } body { padding-top: 60px; } }
@media (min-width: 1280px) { html { scroll-padding-top: 72px; } body { padding-top: 72px; } }

/* ── Nav Root ── */
#mob-nav {
  --nav-h: 68px;
  --nav-h-scroll: 52px;
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  height: var(--nav-h);
  background: rgba(248,250,252,0.72);
  backdrop-filter: blur(32px) saturate(1.3);
  -webkit-backdrop-filter: blur(32px) saturate(1.3);
  border-bottom: 1px solid rgba(226,232,240,0.25);
  transition: height 0.4s cubic-bezier(0.16,1,0.3,1), background 0.4s, box-shadow 0.4s;
  will-change: height;
}
#mob-nav.scrolled {
  height: var(--nav-h-scroll);
  background: rgba(248,250,252,0.88);
  box-shadow: 0 1px 3px rgba(15,23,42,0.03), 0 8px 32px rgba(15,23,42,0.05);
}

/* ── Nav Inner ── */
.nav-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  height: var(--nav-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: height 0.4s cubic-bezier(0.16,1,0.3,1);
}
#mob-nav.scrolled .nav-inner { height: var(--nav-h-scroll); }
@media (min-width: 768px) { .nav-inner { padding: 0 40px; } }
@media (min-width: 1280px) { .nav-inner { padding: 0 64px; } }

/* ── Logo ── */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
#mob-nav.scrolled .nav-logo { transform: scale(0.88); }
.nav-logo-icon {
  width: 34px; height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563EB, #06B6D4);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 12px rgba(37,99,235,0.25);
  transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
}
#mob-nav.scrolled .nav-logo-icon { transform: scale(0.9); width: 30px; height: 30px; }
.nav-logo-text {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  letter-spacing: -0.02em;
  transition: font-size 0.4s cubic-bezier(0.16,1,0.3,1);
}
#mob-nav.scrolled .nav-logo-text { font-size: 17px; }

/* ── Desktop Mega Menu ── */
.nav-desktop {
  display: none;
  align-items: center;
  gap: 4px;
}
@media (min-width: 1280px) { .nav-desktop { display: flex; } }

.nav-desktop a,
.mega-trigger {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  padding: 6px 12px;
  border-radius: 8px;
  text-decoration: none;
  white-space: nowrap;
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  position: relative;
  transition: color 0.2s, background 0.2s;
}
.nav-desktop a:hover,
.mega-trigger:hover { color: #0F172A; background: rgba(15,23,42,0.04); }
.nav-desktop a.active-link,
.mega-trigger.active-link { color: #2563EB; background: rgba(37,99,235,0.08); }

.mega-trigger .chevron {
  font-size: 14px;
  transition: transform 0.3s ease;
}
.mega-trigger:hover .chevron,
.mega-trigger:focus-visible .chevron { transform: rotate(180deg); }

/* ── Mega Panel Outer ── */
.mega-outer {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(8px);
  padding-top: 14px;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s cubic-bezier(0.16,1,0.3,1);
  z-index: 200;
}
.mega-trigger[data-open="true"] + .mega-outer,
.mega-trigger:hover + .mega-outer,
.mega-outer:hover,
.mega-trigger:focus-visible + .mega-outer { opacity: 1; visibility: visible; pointer-events: auto; transform: translateX(-50%) translateY(0); }

.mega-panel {
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(40px) saturate(1.4);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  border-radius: 20px;
  box-shadow: 0 12px 60px rgba(15,23,42,0.1), 0 0 0 1px rgba(15,23,42,0.04);
  padding: 16px;
  min-width: 200px;
  overflow: hidden;
}

/* ── Mega Grid Layouts ── */
.mega-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.mega-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.mega-grid-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

/* ── Mega Card ── */
.mega-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s ease;
}
.mega-card:hover { background: #F1F5F9; }
.mega-card:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; border-radius: 12px; }

.mega-card-icon {
  width: 36px; height: 36px;
  min-width: 36px;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.mega-card-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.mega-card-label {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #0F172A;
  line-height: 1.3;
}
.mega-card-desc {
  font-family: 'Inter', sans-serif;
  font-size: 11.5px;
  font-weight: 400;
  color: #64748B;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Pillar Sub-list (inside Método's card) ── */
.mega-pillars {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.mega-pillar-pill {
  font-family: 'Inter', sans-serif;
  font-size: 10.5px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 100px;
  background: #F1F5F9;
  color: #64748B;
  transition: background 0.15s, color 0.15s;
}
.mega-pillar-pill:hover { background: #DBEAFE; color: #2563EB; }

/* ── Desktop CTA ── */
.nav-cta-group { display: none; align-items: center; gap: 8px; }
@media (min-width: 1280px) { .nav-cta-group { display: flex; } }

.nav-cta-militante {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 100px;
  color: #0F172A;
  border: 1px solid #CBD5E1;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.nav-cta-militante:hover { background: #F1F5F9; border-color: #94A3B8; }

.nav-cta-diagnostico {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 100px;
  background: #0F172A;
  color: #fff;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(15,23,42,0.1);
}
.nav-cta-diagnostico:hover { background: #1e293b; transform: translateY(-1px); }

/* ── Hamburger ── */
#hamburger-btn {
  display: flex;
  width: 42px; height: 42px;
  align-items: center; justify-content: center;
  border-radius: 12px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
#hamburger-btn:hover { background: rgba(15,23,42,0.04); }
@media (min-width: 1280px) { #hamburger-btn { display: none; } }

.hamburger-icon {
  position: relative;
  width: 20px; height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.hamburger-line {
  display: block;
  width: 100%; height: 2px;
  background: #0F172A;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  transform-origin: center;
}

/* ── Mobile Overlay ── */
#mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(15,23,42,0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.35s ease;
}

/* ── Mobile Drawer ── */
#mobile-drawer {
  position: fixed;
  top: 0; right: 0;
  height: 100%; width: 88%;
  max-width: 440px;
  z-index: 110;
  background: #0B1120;
  background: linear-gradient(180deg, #0F172A 0%, #0B1120 100%);
  box-shadow: -8px 0 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
  will-change: transform;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  flex-shrink: 0;
}
.drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 17px;
  font-weight: 700;
}
.drawer-close {
  width: 42px; height: 42px;
  min-width: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center; justify-content: center;
  background: none; border: none;
  cursor: pointer;
  color: #94A3B8;
  transition: background 0.2s, color 0.2s;
}
.drawer-close:hover { background: rgba(255,255,255,0.06); color: #fff; }

.drawer-body { flex: 1; padding: 10px 12px 20px; overflow-y: auto; }

/* ── Mobile Category Section ── */
.drawer-section { margin-bottom: 8px; }

.drawer-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 14px;
  min-height: 44px;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #94A3B8;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  transition: color 0.2s, background 0.2s;
}
.drawer-section-header:hover { background: rgba(255,255,255,0.04); color: #CBD5E1; }
.drawer-section-header .arrow {
  font-size: 20px;
  transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  color: #475569;
}
.drawer-section-header.open .arrow { transform: rotate(180deg); }

.drawer-section-items {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.4s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease 0.05s;
  padding: 0 4px;
}
.drawer-section-items.open { opacity: 1; }

.drawer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 14px 10px 20px;
  min-height: 44px;
  border-radius: 10px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #CBD5E1;
  text-decoration: none;
  transition: all 0.15s ease;
}
.drawer-link:hover { background: rgba(255,255,255,0.05); color: #fff; }
.drawer-link.active-link { color: #60A5FA; background: rgba(37,99,235,0.12); }
.drawer-link .d-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; opacity: 0.6; }

/* ── Drawer CTA ── */
.drawer-cta {
  flex-shrink: 0;
  padding: 14px 18px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.drawer-cta-card {
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(37,99,235,0.15), rgba(6,182,212,0.06));
  border: 1px solid rgba(255,255,255,0.06);
  padding: 18px;
  text-align: center;
}
.drawer-cta-card h4 {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 2px;
}
.drawer-cta-card p {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: #64748B;
  margin: 0 0 14px;
  line-height: 1.5;
}
.drawer-cta-primary {
  display: block; width: 100%;
  padding: 11px;
  border-radius: 12px;
  background: #2563EB;
  color: #fff;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
  margin-bottom: 6px;
}
.drawer-cta-primary:hover { background: #1d4ed8; }
.drawer-cta-secondary {
  display: block; width: 100%;
  padding: 11px;
  border-radius: 12px;
  background: rgba(255,255,255,0.08);
  color: #CBD5E1;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid rgba(255,255,255,0.06);
  transition: background 0.2s;
}
.drawer-cta-secondary:hover { background: rgba(255,255,255,0.12); }

/* ── Pillar pills (mobile) ── */
.drawer-pillars { display: flex; flex-wrap: wrap; gap: 4px; padding: 2px 14px 8px 20px; }
.drawer-pillar-pill {
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  color: #64748B;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.drawer-pillar-pill:hover { background: rgba(37,99,235,0.15); color: #60A5FA; }

/* ── Scroll Reveal (preserved from original) ── */
[data-reveal] {
  opacity: 0;
  transform: translateY(28px);
  transition: all 0.7s cubic-bezier(0.16,1,0.3,1);
}
[data-reveal].revealed { opacity: 1; transform: translateY(0); }

/* ── Hero classes (preserved from original) ── */
.hero-cinema {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  background:
    radial-gradient(ellipse 75% 55% at 0% 25%, rgba(37,99,235,0.08) 0%, transparent 60%),
    radial-gradient(ellipse 55% 45% at 100% 10%, rgba(6,182,212,0.06) 0%, transparent 50%),
    radial-gradient(ellipse 40% 35% at 70% 90%, rgba(124,58,237,0.05) 0%, transparent 50%),
    linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
}
.hero-glow-a {
  position: absolute; top:15%; left:-5%;
  width:500px; height:500px;
  border-radius:50%;
  background:rgba(37,99,235,0.06);
  filter:blur(100px);
  animation:floatA 8s ease-in-out infinite;
}
.hero-glow-b {
  position: absolute; bottom:10%; right:-5%;
  width:400px; height:400px;
  border-radius:50%;
  background:rgba(6,182,212,0.05);
  filter:blur(80px);
  animation:floatB 10s ease-in-out 2s infinite;
}
.hero-glow-c {
  position: absolute; top:50%; left:50%;
  transform:translate(-50%,-50%);
  width:600px; height:600px;
  border-radius:50%;
  background:rgba(124,58,237,0.03);
  filter:blur(120px);
  animation:floatA 12s ease-in-out 4s infinite;
}
@keyframes floatA { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
@keyframes floatB { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,15px)} }
.scroll-indicator {
  position:absolute; bottom:32px; left:50%;
  transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center;
  gap:8px; color:#94A3B8;
  font-family:'Inter',sans-serif; font-size:11px; font-weight:500;
  letter-spacing:.1em; text-transform:uppercase;
  animation:scrollBounce 2.5s ease-in-out infinite;
}
@keyframes scrollBounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }

  `;
  document.head.appendChild(style);

  /* ── Navigation Data ── */

  var pillarAnchors = {
    'Estratégia Política': 'estrategia-politica',
    'Comunicação': 'comunicacao',
    'Mobilização': 'mobilizacao',
    'Tecnologia': 'tecnologia',
    'Rua': 'rua'
  };

  var pillarPills = [
    { name: 'Estratégia Política',   color: '#2563EB' },
    { name: 'Comunicação',           color: '#06B6D4' },
    { name: 'Mobilização',           color: '#7C3AED' },
    { name: 'Tecnologia',            color: '#F97316' },
    { name: 'Rua',                   color: '#2563EB' }
  ];

  var metodosHref = 'Metodo de Campanha.html';

  var categories = [
    {
      id: 'solucoes',
      label: 'Soluções',
      items: [
        {
          label: 'Método de Campanha', href: metodosHref, icon: 'insights',
          iconBg: 'linear-gradient(135deg,#2563EB,#3B82F6)',
          desc: 'Metodologia completa dos 5 pilares eleitorais',
          pillars: true
        },
        {
          label: 'Inteligência Eleitoral', href: 'Centro de Inteligencia Eleitoral.html', icon: 'biotech',
          iconBg: 'linear-gradient(135deg,#7C3AED,#A855F7)',
          desc: 'CRM, big data e monitoramento em tempo real'
        },
        {
          label: 'Mobilização Territorial', href: 'Mobilizacao Territorial.html', icon: 'map',
          iconBg: 'linear-gradient(135deg,#F97316,#FB923C)',
          desc: 'Expansão geográfica e células de engajamento'
        },
        {
          label: 'Ação de Rua', href: 'Acao de Rua.html', icon: 'directions_walk',
          iconBg: 'linear-gradient(135deg,#0F172A,#334155)',
          desc: 'Ativismo, eventos e logística de campanha'
        }
      ]
    },
    {
      id: 'comunidade',
      label: 'Comunidade',
      items: [
        {
          label: 'Rede de Militantes', href: 'Rede de Militantes.html', icon: 'diversity_3',
          iconBg: 'linear-gradient(135deg,#2563EB,#06B6D4)',
          desc: 'Dashboard de engajamento e gamificação'
        },
        {
          label: 'Universidade', href: 'Universidade de Campanha.html', icon: 'school',
          iconBg: 'linear-gradient(135deg,#7C3AED,#C084FC)',
          desc: 'Cursos e treinamento político'
        },
        {
          label: 'Cases', href: 'Cases.html', icon: 'emoji_events',
          iconBg: 'linear-gradient(135deg,#F59E0B,#FBBF24)',
          desc: 'Histórias reais de campanhas vitoriosas'
        }
      ]
    },
    {
      id: 'conteudo',
      label: 'Conteúdo',
      items: [
        {
          label: 'Blog', href: 'Blog.html', icon: 'newspaper',
          iconBg: 'linear-gradient(135deg,#2563EB,#60A5FA)',
          desc: 'Artigos, análises e tendências eleitorais'
        },
        {
          label: 'Biblioteca', href: 'Biblioteca.html', icon: 'library_books',
          iconBg: 'linear-gradient(135deg,#0F172A,#475569)',
          desc: 'Guias, e-books e materiais exclusivos'
        },
        {
          label: 'Notícias', href: 'Noticias.html', icon: 'breaking_news_alt_1',
          iconBg: 'linear-gradient(135deg,#DC2626,#EF4444)',
          desc: 'Cobertura e atualizações do cenário político'
        },
        {
          label: 'Agenda', href: 'Agenda.html', icon: 'calendar_month',
          iconBg: 'linear-gradient(135deg,#06B6D4,#22D3EE)',
          desc: 'Eventos, workshops e compromissos'
        }
      ]
    },
    {
      id: 'empresa',
      label: 'Empresa',
      items: [
        {
          label: 'Quem Somos', href: 'Sobre Nos.html', icon: 'groups',
          iconBg: 'linear-gradient(135deg,#2563EB,#1D4ED8)',
          desc: 'Nossa história, missão e equipe'
        },
        {
          label: 'Contato', href: 'Contato.html', icon: 'mail',
          iconBg: 'linear-gradient(135deg,#0F172A,#334155)',
          desc: 'Fale conosco e solicite diagnóstico'
        }
      ]
    }
  ];

  function isActive(href) { return currentPath === href; }

  /* ========== BUILD DESKTOP ========== */
  var desktopHTML = '';

  categories.forEach(function (cat, ci) {
    var active = cat.items.some(function (it) { return isActive(it.href); });
    var gridClass = cat.items.length <= 2 ? 'mega-grid-2' : (cat.items.length <= 3 ? 'mega-grid-3' : 'mega-grid-4');
    var cardsHTML = '';
    cat.items.forEach(function (it) {
      var itActive = isActive(it.href);
      var pillarHTML = '';
      if (it.pillars) {
        var pills = '';
        pillarPills.forEach(function (pp) {
          var anchor = pillarAnchors[pp.name] || '';
          pills += '<a href="' + it.href + (anchor ? '#' + anchor : '') + '" class="mega-pillar-pill" style="border-left:2px solid ' + pp.color + ';">' + pp.name + '</a>';
        });
        pillarHTML = '<div class="mega-pillars">' + pills + '</div>';
      }
      cardsHTML += '<a href="' + it.href + '" class="mega-card' + (itActive ? ' active-link' : '') + '">' +
        '<div class="mega-card-icon" style="background:' + it.iconBg + ';color:#fff;">' +
        '<span class="material-symbols-outlined" style="font-size:18px;">' + it.icon + '</span></div>' +
        '<div class="mega-card-text">' +
        '<span class="mega-card-label">' + it.label + '</span>' +
        '<span class="mega-card-desc">' + it.desc + '</span>' +
        pillarHTML +
        '</div></a>';
    });

    desktopHTML += '<div class="mega-trigger-wrap" style="position:relative;">' +
      '<button class="mega-trigger' + (active ? ' active-link' : '') + '" data-mega="' + ci + '" aria-expanded="false" aria-controls="mega-panel-' + ci + '">' +
      cat.label +
      '<span class="material-symbols-outlined chevron">expand_more</span></button>' +
      '<div class="mega-outer" id="mega-panel-' + ci + '">' +
      '<div class="mega-panel ' + gridClass + '">' + cardsHTML + '</div></div></div>';
  });

  /* ========== BUILD MOBILE ========== */
  var mobileBody = '';

  categories.forEach(function (cat, ci) {
    var sectionId = 'drawer-sec-' + ci;
    var linksHTML = '';
    cat.items.forEach(function (it) {
      var itActive = isActive(it.href);
      var pillarHTML = '';
      if (it.pillars) {
        var pills = '';
        pillarPills.forEach(function (pp) {
          var anchor = pillarAnchors[pp.name] || '';
          pills += '<a href="' + it.href + (anchor ? '#' + anchor : '') + '" class="drawer-pillar-pill" style="border-left:2px solid ' + pp.color + ';">' + pp.name + '</a>';
        });
        pillarHTML = '<div class="drawer-pillars">' + pills + '</div>';
      }
      linksHTML += '<a href="' + it.href + '" class="drawer-link' + (itActive ? ' active-link' : '') + '">' +
        '<span class="material-symbols-outlined d-icon">' + it.icon + '</span>' +
        '<span>' + it.label + '</span></a>' + pillarHTML;
    });

    mobileBody += '<div class="drawer-section">' +
      '<button class="drawer-section-header" data-drawer-sec="' + ci + '" aria-expanded="false" aria-controls="' + sectionId + '">' +
      '<span>' + cat.label + '</span>' +
      '<span class="material-symbols-outlined arrow">expand_more</span></button>' +
      '<div class="drawer-section-items" id="' + sectionId + '">' + linksHTML + '</div></div>';
  });

  var mobileHTML =
    '<div class="drawer-header">' +
    '<div class="drawer-brand">' +
    '<img src="logo.png" alt="Compunet" style="width:32px;height:32px;border-radius:10px;object-fit:cover;">' +
    '<span>Compunet</span></div>' +
    '<button class="drawer-close" id="drawer-close-btn" aria-label="Fechar menu">' +
    '<span class="material-symbols-outlined" style="font-size:24px;">close</span></button></div>' +
    '<div class="drawer-body">' + mobileBody + '</div>' +
    '<div class="drawer-cta">' +
    '<div class="drawer-cta-card">' +
    '<h4>Participe da Mobilização</h4>' +
    '<p>Junte-se à rede de militantes e faça a diferença na sua cidade.</p>' +
    '<a href="login.html" class="drawer-cta-primary">Tornar-se Militante</a>' +
    '<a href="Contato.html" class="drawer-cta-secondary">Solicitar Diagnóstico</a>' +
    '</div></div>';

  /* ========== BUILD NAV HTML ========== */
  var navHTML =
    '<nav id="mob-nav">' +
    '<div class="nav-inner">' +

    /* Logo */
    '<a href="index.html" class="nav-logo">' +
    '<img src="logo.png" alt="Compunet" style="width:34px;height:34px;border-radius:10px;object-fit:cover;box-shadow:0 4px 12px rgba(37,99,235,0.25);">' +
    '<span class="nav-logo-text">Compunet</span></a>' +

    /* Desktop Menu */
    '<div class="nav-desktop">' + desktopHTML + '</div>' +

    /* CTA */
    '<div class="nav-cta-group">' +
    '<a href="login.html" class="nav-cta-militante">Acesso Militante</a>' +
    '<a href="Contato.html" class="nav-cta-diagnostico">Diagnóstico</a></div>' +

    /* Hamburger */
    '<button id="hamburger-btn" aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-drawer">' +
    '<div class="hamburger-icon">' +
    '<span class="hamburger-line"></span>' +
    '<span class="hamburger-line"></span>' +
    '<span class="hamburger-line"></span>' +
    '</div></button>' +

    '</div></nav>' +

    /* Overlay */
    '<div id="mobile-overlay"></div>' +

    /* Drawer */
    '<aside id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu de navegação">' +
    mobileHTML +
    '</aside>';

  var container = document.getElementById('nav-container');
  if (container) container.innerHTML = navHTML;

  /* ========== DESKTOP MEGA MENU TOGGLE ========== */
  var megaTriggers = document.querySelectorAll('[data-mega]');
  var openMega = null;

  function closeMega() {
    if (openMega === null) return;
    var prev = document.querySelector('[data-mega="' + openMega + '"]');
    if (prev) { prev.dataset.open = 'false'; prev.setAttribute('aria-expanded', 'false'); }
    openMega = null;
  }

  function toggleMega(idx) {
    if (openMega === idx) { closeMega(); return; }
    closeMega();
    var btn = document.querySelector('[data-mega="' + idx + '"]');
    if (!btn) return;
    btn.dataset.open = 'true';
    btn.setAttribute('aria-expanded', 'true');
    openMega = idx;
  }

  megaTriggers.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var idx = btn.getAttribute('data-mega');
      toggleMega(idx);
    });
    btn.addEventListener('focus', function () {
      var idx = btn.getAttribute('data-mega');
      if (openMega !== null && openMega !== idx) {
        closeMega();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (openMega === null) return;
    var wrap = e.target.closest('.mega-trigger-wrap');
    if (!wrap) closeMega();
  });

  /* Focus trap: close mega on Escape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openMega !== null) closeMega();
  });

  /* ========== MOBILE DRAWER ========== */
  var hamburger = document.getElementById('hamburger-btn');
  var overlay = document.getElementById('mobile-overlay');
  var drawer = document.getElementById('mobile-drawer');
  var closeBtn = document.getElementById('drawer-close-btn');
  var drawerOpen = false;

  function openDrawer() {
    drawerOpen = true;
    drawer.style.transform = 'translateX(0)';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    var lines = document.querySelectorAll('.hamburger-line');
    if (lines.length === 3) {
      lines[0].style.transform = 'translateY(7px) rotate(45deg)';
      lines[1].style.opacity = '0';
      lines[1].style.transform = 'scaleX(0)';
      lines[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    }
  }

  function closeDrawer() {
    drawerOpen = false;
    drawer.style.transform = 'translateX(100%)';
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    document.body.style.overflow = '';
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    var lines = document.querySelectorAll('.hamburger-line');
    if (lines.length === 3) {
      lines[0].style.transform = '';
      lines[1].style.opacity = '1';
      lines[1].style.transform = '';
      lines[2].style.transform = '';
    }
    /* Close all sections */
    document.querySelectorAll('.drawer-section-items').forEach(function (el) {
      el.style.maxHeight = '0';
      el.classList.remove('open');
    });
    document.querySelectorAll('.drawer-section-header').forEach(function (el) {
      el.classList.remove('open');
      el.setAttribute('aria-expanded', 'false');
    });
  }

  if (hamburger) hamburger.addEventListener('click', function () {
    if (drawerOpen) closeDrawer(); else openDrawer();
  });
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });

  /* Mobile section accordion */
  document.querySelectorAll('.drawer-section-header').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      var idx = trigger.getAttribute('data-drawer-sec');
      var content = document.getElementById('drawer-sec-' + idx);
      if (!content) return;
      if (content.classList.contains('open')) {
        content.style.maxHeight = '0';
        content.classList.remove('open');
        trigger.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        content.classList.add('open');
        trigger.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* Close drawer on link click */
  document.querySelectorAll('.drawer-link, .drawer-pillar-pill').forEach(function (link) {
    link.addEventListener('click', function () { closeDrawer(); });
  });

  /* ========== SMOOTH SCROLL FOR ANCHOR LINKS ========== */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var hashIndex = href.indexOf('#');
    if (hashIndex < 0) return;
    var pagePart = href.slice(0, hashIndex);
    var anchor = href.slice(hashIndex + 1);
    if (!anchor) return;
    if (pagePart && pagePart !== currentPath) return;
    var el = document.getElementById(anchor);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', '#' + anchor);
    }
  });

  /* ========== SWIPE TO CLOSE ========== */
  var tX = 0, tY = 0;
  document.addEventListener('touchstart', function (e) {
    tX = e.changedTouches[0].screenX;
    tY = e.changedTouches[0].screenY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!drawerOpen) return;
    var dX = e.changedTouches[0].screenX - tX;
    var dY = e.changedTouches[0].screenY - tY;
    if (dX > 60 && Math.abs(dY) < 100) closeDrawer();
  }, { passive: true });

  /* ========== CLOSE DRAWER ON RESIZE ========== */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth >= 1280 && drawerOpen) closeDrawer();
    }, 100);
  });

  /* ========== SCROLL SHRINK ========== */
  var navEl = document.getElementById('mob-nav');
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        if (window.scrollY > 40) { navEl.classList.add('scrolled'); }
        else { navEl.classList.remove('scrolled'); }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ========== SCROLL REVEAL ========== */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var delay = entry.target.getAttribute('data-reveal-delay');
        setTimeout(function () { entry.target.classList.add('revealed'); }, delay ? parseInt(delay) : 0);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { revealObserver.observe(el); });
})();
