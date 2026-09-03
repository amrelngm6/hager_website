/**
 * content-loader.js
 * 
 * Fetches live content from the CMS API and injects it into the
 * theme's DOM before app.js reads it at DOMContentLoaded / load time.
 *
 * The API endpoint GET /api/v1/content returns a key→data map.
 * This script runs synchronously-via-async before the main app.js
 * initializes flows, so the HTML sections are pre-populated with
 * the latest saved content.
 */

(async function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────────────────────
  // Point this at your backend. During development this is typically
  // proxied through Vite or served directly. Update as needed.
  const API_BASE = window.__CMS_API__ || 'http://localhost:3005/api/v1';

  // ── Helpers ─────────────────────────────────────────────────────────────
  function setHTML(selector, html) {
    const el = document.querySelector(selector);
    if (el && html !== undefined && html !== null) el.innerHTML = html;
  }

  function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el && text !== undefined && text !== null) el.textContent = text;
  }

  function attr(selector, attribute, value) {
    const el = document.querySelector(selector);
    if (el && value !== undefined && value !== null) el.setAttribute(attribute, value);
  }

  // Build a <li data-action="..." data-class="...">Label</li> string
  function buildOptionLi(btn) {
    const actionAttr = btn.action ? ` data-action="${btn.action}"` : '';
    const linkAttr = btn.link ? ` data-link="${btn.link}"` : '';
    const classAttr = btn.styleClass ? ` data-class="${btn.styleClass}"` : '';
    return `<li${actionAttr}${linkAttr}${classAttr}>${btn.label}</li>`;
  }

  // ── Fetch content ────────────────────────────────────────────────────────
  let content = {};
  try {
    const res = await fetch(`${API_BASE}/content`, { credentials: 'include' });
    if (res.ok) {
      const json = await res.json();
      content = json.data || {};
    }
  } catch (e) {
    // Silently fall back to static HTML if the API is unreachable
    console.warn('[CMS] Could not reach content API — using static HTML.', e.message);
    return;
  }

  // ── General settings ─────────────────────────────────────────────────────
  const general = content.general || {};
  if (general.siteName || general.siteTitle) {
    document.title = `${general.siteName || ''} | ${general.siteTitle || ''}`;
  }
  if (general.verticalTextLeft) setText('.vertical-text-left', general.verticalTextLeft);
  if (general.verticalTextRight) setText('.vertical-text-right', general.verticalTextRight);
  if (general.footerHintText) setText('#chat-footer-text', general.footerHintText);
  if (general.chatAvatarUrl) {
    attr('#chat-avatar', 'src', general.chatAvatarUrl);
  }
  if (general.activeSkin) {
    const skinEl = document.getElementById('dynamic-theme');
    if (skinEl) skinEl.setAttribute('href', `css/skins/${general.activeSkin}`);
  }

  // ── Intro screen ─────────────────────────────────────────────────────────
  const intro = content.intro || {};
  if (intro.greeting) {
    const helloSpan = document.querySelector('.hello span');
    if (helloSpan) helloSpan.textContent = intro.greeting;
  }
  if (intro.name) {
    const h1 = document.querySelector('.intro-text h1');
    if (h1) h1.innerHTML = `I'm <span>${intro.name},</span>`;
  }
  if (intro.title) setText('.intro-text h2', intro.title);
  if (intro.quoteText) {
    const qp = document.querySelector('.quote p');
    if (qp) qp.textContent = intro.quoteText;
  }
  if (intro.quoteAuthor) setText('.quote span', intro.quoteAuthor);
  if (intro.imageUrl) attr('#intro-image', 'src', intro.imageUrl);
  if (intro.imageAlt) attr('#intro-image', 'alt', intro.imageAlt);
  if (Array.isArray(intro.buttons) && intro.buttons.length > 0) {
    const container = document.getElementById('intro-options-target');
    if (container) {
      container.innerHTML = intro.buttons.map((btn) => {
        const cls = `btn btn-primary${btn.styleClass ? ' ' + btn.styleClass : ''}`;
        return `<button class="${cls}" data-action="${btn.action}">
          <span class="button-content"><span>${btn.label}</span></span>
        </button>`;
      }).join('');
    }
  }

  // ── About section ─────────────────────────────────────────────────────────
  const about = content.about || {};
  const aboutEl = document.getElementById('flow-about');
  if (aboutEl) {
    if (about.bio) {
      const p = aboutEl.querySelector('p');
      if (p) p.innerHTML = about.bio;
    }
    if (Array.isArray(about.stats)) {
      const statsDiv = aboutEl.querySelector('.list-with-icons');
      if (statsDiv) {
        statsDiv.innerHTML = about.stats
          .map((s) => `<span><i class="${s.icon}"></i>${s.text}</span>`)
          .join('');
      }
    }
    if (Array.isArray(about.buttons)) {
      const opts = aboutEl.querySelector('.options');
      if (opts) opts.innerHTML = about.buttons.map(buildOptionLi).join('');
    }
    if (about.triggers) aboutEl.setAttribute('data-triggers', about.triggers);
  }

  // ── Skills section ────────────────────────────────────────────────────────
  const skills = content.skills || {};
  const skillsEl = document.getElementById('flow-skills');
  if (skillsEl) {
    if (skills.intro) {
      const p = skillsEl.querySelector('p');
      if (p) p.innerHTML = skills.intro;
    }
    if (Array.isArray(skills.categories)) {
      // Remove existing category elements, keep only the first <p>
      const firstP = skillsEl.querySelector('p');
      const optsUl = skillsEl.querySelector('.options');
      skillsEl.innerHTML = '';
      if (firstP) skillsEl.appendChild(firstP);

      skills.categories.forEach((cat) => {
        const h2 = document.createElement('h2');
        h2.className = 'category-skills';
        h2.innerHTML = `<i class="${cat.icon}"></i>${cat.name}`;
        skillsEl.appendChild(h2);

        const ul = document.createElement('ul');
        ul.className = 'list-skills';
        ul.innerHTML = (cat.skills || [])
          .map((sk) => `<li>${sk.name}<span class="stars" data-rating="${sk.rating}"></span></li>`)
          .join('');
        skillsEl.appendChild(ul);
      });

      if (optsUl) {
        if (Array.isArray(skills.buttons)) {
          optsUl.innerHTML = skills.buttons.map(buildOptionLi).join('');
        }
        skillsEl.appendChild(optsUl);
      }
    }
    if (skills.triggers) skillsEl.setAttribute('data-triggers', skills.triggers);
  }

  // ── Projects section ──────────────────────────────────────────────────────
  const projects = content.projects || {};
  const projEl = document.getElementById('flow-projects');
  if (projEl) {
    if (projects.intro) {
      const introP = projEl.querySelector('.intro');
      if (introP) introP.innerHTML = projects.intro;
    }
    if (Array.isArray(projects.items)) {
      const dataDiv = projEl.querySelector('.projects-data');
      if (dataDiv) {
        dataDiv.innerHTML = projects.items.map((p) => {
          const galleryHtml = p.mediaType === 'gallery' && Array.isArray(p.gallery)
            ? `<div class="gallery-urls">${p.gallery.map((url) => `<img src="${url}" alt="">`).join('')}</div>`
            : '';
          return `<div class="project-item"
            data-title="${p.title || ''}"
            data-link="${p.link || ''}"
            data-image="${p.image || ''}"
            data-media="${p.mediaType || 'image'}"
            ${p.youtubeId ? `data-youtube-id="${p.youtubeId}"` : ''}
            ${p.videoUrl ? `data-video-url="${p.videoUrl}"` : ''}>
            <p class="summary">${p.summary || ''}</p>
            ${galleryHtml}
          </div>`;
        }).join('');
      }
    }
    if (Array.isArray(projects.globalButtons)) {
      const globalUl = projEl.querySelector('.project-buttons .global');
      if (globalUl) globalUl.innerHTML = projects.globalButtons.map(buildOptionLi).join('');
    }
    if (Array.isArray(projects.finalButtons)) {
      const finalUl = projEl.querySelector('.project-buttons .final');
      if (finalUl) finalUl.innerHTML = projects.finalButtons.map(buildOptionLi).join('');
    }
    if (projects.triggers) projEl.setAttribute('data-triggers', projects.triggers);
  }

  // ── Clients section ───────────────────────────────────────────────────────
  const clients = content.clients || {};
  const clientsEl = document.getElementById('flow-clients');
  if (clientsEl) {
    if (clients.intro) {
      const introP = clientsEl.querySelector('.intro');
      if (introP) introP.innerHTML = clients.intro;
    }
    if (Array.isArray(clients.items)) {
      const listDiv = clientsEl.querySelector('.client-list');
      if (listDiv) {
        listDiv.innerHTML = clients.items
          .map((c) => `<div class="client-item" data-name="${c.name}" data-logo="${c.logoUrl}"></div>`)
          .join('');
      }
    }
    if (Array.isArray(clients.buttons)) {
      const opts = clientsEl.querySelector('.options');
      if (opts) opts.innerHTML = clients.buttons.map(buildOptionLi).join('');
    }
    if (clients.triggers) clientsEl.setAttribute('data-triggers', clients.triggers);
  }

  // ── Contact section ───────────────────────────────────────────────────────
  const contact = content.contact || {};
  const contactEl = document.getElementById('flow-contact');
  if (contactEl) {
    if (contact.intro) {
      const introP = contactEl.querySelector('.intro');
      if (introP) introP.innerHTML = contact.intro;
    }
    if (Array.isArray(contact.directContact)) {
      const dc = contactEl.querySelector('.direct-contact');
      if (dc) {
        dc.innerHTML = contact.directContact
          .map((row) => `<div class="contact-row" data-label="${row.label}" data-icon="${row.icon}">${row.value}</div>`)
          .join('');
      }
    }
    if (Array.isArray(contact.socialLinks)) {
      const sl = contactEl.querySelector('.social-links');
      if (sl) {
        sl.innerHTML = contact.socialLinks
          .map((s) => `<div class="social-item" data-icon="${s.icon}" data-url="${s.url}" data-class="${s.class}"></div>`)
          .join('');
      }
    }
    if (Array.isArray(contact.buttons)) {
      const opts = contactEl.querySelector('.options');
      if (opts) opts.innerHTML = contact.buttons.map(buildOptionLi).join('');
    }
    if (contact.triggers) contactEl.setAttribute('data-triggers', contact.triggers);
  }

  // ── Generic flow sections ─────────────────────────────────────────────────
  // These sections (hello, hobbies, age, cv, education, experience, awards,
  // msg_success, error) all follow the generic-flow data shape:
  // { blocks: [...], buttons: [...], triggers: '' }

  const genericKeys = ['hello', 'hobbies', 'age', 'cv', 'education', 'experience', 'awards', 'msg_success', 'error'];

  genericKeys.forEach((key) => {
    const sectionData = content[key];
    if (!sectionData) return;

    // Find section element by data-flow-id or by id
    const sectionEl = document.querySelector(`[data-flow-id="${key}"]`)
      || document.getElementById(`flow-${key}`)
      || document.getElementById(`flow-${key.replace('_', '-')}`);
    if (!sectionEl) return;

    // Rebuild blocks
    if (Array.isArray(sectionData.blocks)) {
      const optsUl = sectionEl.querySelector('.options');
      sectionEl.innerHTML = '';

      sectionData.blocks.forEach((block) => {
        const tag = (block.tag || 'P').toLowerCase();
        const el = document.createElement(tag);
        if (block.className) el.className = block.className;

        if (tag === 'ul') {
          (block.items || []).forEach((item) => {
            const li = document.createElement('li');
            li.innerHTML = item;
            el.appendChild(li);
          });
        } else {
          el.innerHTML = block.content || '';
        }
        sectionEl.appendChild(el);
      });

      // Re-append buttons
      if (optsUl) {
        if (Array.isArray(sectionData.buttons) && sectionData.buttons.length > 0) {
          optsUl.innerHTML = sectionData.buttons.map(buildOptionLi).join('');
        }
        sectionEl.appendChild(optsUl);
      } else if (Array.isArray(sectionData.buttons) && sectionData.buttons.length > 0) {
        const ul = document.createElement('ul');
        ul.className = 'options';
        ul.innerHTML = sectionData.buttons.map(buildOptionLi).join('');
        sectionEl.appendChild(ul);
      }
    }

    if (sectionData.triggers && sectionEl.hasAttribute('data-triggers')) {
      sectionEl.setAttribute('data-triggers', sectionData.triggers);
    }
  });

  // ── Hobbies: rebuild list-with-icons correctly ───────────────────────────
  const hobbies = content.hobbies || {};
  const hobbiesEl = document.getElementById('flow-hobbies');
  if (hobbiesEl && Array.isArray(hobbies.blocks)) {
    // Rebuild the list-with-icons spans inside the div block
    const iconDiv = hobbiesEl.querySelector('.list-with-icons');
    if (iconDiv && hobbies.blocks) {
      const divBlock = hobbies.blocks.find((b) => b.tag === 'DIV' && Array.isArray(b.items));
      if (divBlock) {
        iconDiv.innerHTML = divBlock.items.map((item) => `<span>${item}</span>`).join('');
      }
    }
  }

  console.log('[CMS] Content loaded and injected ✓');
})();
