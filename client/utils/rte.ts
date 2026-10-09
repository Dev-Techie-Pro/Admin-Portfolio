// @ts-nocheck
import { promptUrl } from './url-prompt.js';

function saveSelection(body) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!body.contains(range.commonAncestorContainer)) return null;
  return range.cloneRange();
}

function restoreSelection(body, savedRange) {
  if (!savedRange) return false;
  body.focus();
  const sel = window.getSelection();
  if (!sel) return false;
  sel.removeAllRanges();
  sel.addRange(savedRange);
  return true;
}

function getSelectedLinkUrl(body) {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return '';
  let node = sel.anchorNode;
  if (node?.nodeType === 3) node = node.parentElement;
  const anchor = node?.closest?.('a');
  if (anchor && body.contains(anchor)) {
    return anchor.getAttribute('href') || anchor.href || '';
  }
  return '';
}

function applyLink(body, url, savedRange) {
  restoreSelection(body, savedRange);
  const sel = window.getSelection();

  if (!url) {
    document.execCommand('unlink', false, null);
    return;
  }

  const range = sel?.rangeCount ? sel.getRangeAt(0) : savedRange;
  let node = range?.commonAncestorContainer;
  if (node?.nodeType === 3) node = node.parentElement;
  const existingAnchor = node?.closest?.('a');
  if (existingAnchor && body.contains(existingAnchor)) {
    existingAnchor.href = url;
    existingAnchor.target = '_blank';
    existingAnchor.rel = 'noopener noreferrer';
    return;
  }

  const hasTextSelection = range && !range.collapsed;

  if (hasTextSelection) {
    document.execCommand('createLink', false, url);
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.textContent = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';

  if (range) {
    range.deleteContents();
    range.insertNode(anchor);
    const after = document.createRange();
    after.setStartAfter(anchor);
    after.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(after);
  } else {
    body.appendChild(document.createTextNode(' '));
    body.appendChild(anchor);
    body.appendChild(document.createTextNode(' '));
  }
}

type RteFullscreenRestore = { parent: Node; next: ChildNode | null };

let rteFullscreenRestore: RteFullscreenRestore | null = null;
let rteFullscreenEscapeBound = false;

function syncRteFullscreenBodyLock() {
  document.body.classList.toggle(
    'pa-rte-fullscreen-active',
    !!document.querySelector('.pa-rte--fullscreen'),
  );
}

function setRteFullscreen(wrap: HTMLElement, body: HTMLElement, btn: HTMLElement, active: boolean) {
  const icon = btn.querySelector('i');
  if (active) {
    if (!wrap.classList.contains('pa-rte--fullscreen')) {
      rteFullscreenRestore = { parent: wrap.parentNode!, next: wrap.nextSibling };
      document.body.appendChild(wrap);
      wrap.classList.add('pa-rte--fullscreen');
    }
  } else if (wrap.classList.contains('pa-rte--fullscreen')) {
    wrap.classList.remove('pa-rte--fullscreen');
    if (rteFullscreenRestore?.parent) {
      rteFullscreenRestore.parent.insertBefore(wrap, rteFullscreenRestore.next);
    }
    rteFullscreenRestore = null;
  }
  if (icon) {
    icon.className = active ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line';
  }
  btn.title = active ? 'Exit full screen' : 'Full screen';
  btn.setAttribute('aria-label', btn.title);
  btn.setAttribute('aria-pressed', String(active));
  syncRteFullscreenBodyLock();
  if (active) body.focus();
}

function toggleRteFullscreen(wrap: HTMLElement, body: HTMLElement, btn: HTMLElement) {
  const active = !wrap.classList.contains('pa-rte--fullscreen');
  if (active) {
    document.querySelectorAll('.pa-rte--fullscreen').forEach((other) => {
      if (other === wrap) return;
      const otherBtn = other.querySelector<HTMLElement>('.pa-rte-fullscreen-btn');
      const otherBody = other.querySelector<HTMLElement>('.pa-rte-body');
      if (otherBtn && otherBody) setRteFullscreen(other as HTMLElement, otherBody, otherBtn, false);
    });
  }
  setRteFullscreen(wrap, body, btn, active);
}

function ensureRteFullscreenButton(wrap: HTMLElement, body: HTMLElement) {
  const toolbar = wrap.querySelector('.pa-rte-toolbar');
  if (!toolbar || toolbar.querySelector('.pa-rte-fullscreen-wrap')) return;

  const group = document.createElement('div');
  group.className = 'pa-rte-fullscreen-wrap';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pa-rte-btn pa-rte-fullscreen-btn';
  btn.title = 'Full screen';
  btn.setAttribute('aria-label', 'Full screen');
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = '<i class="ri-fullscreen-line"></i>';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    toggleRteFullscreen(wrap, body, btn);
  });
  group.appendChild(btn);
  toolbar.appendChild(group);

  if (!rteFullscreenEscapeBound) {
    rteFullscreenEscapeBound = true;
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const full = document.querySelector<HTMLElement>('.pa-rte--fullscreen');
      if (!full) return;
      const fullBtn = full.querySelector<HTMLElement>('.pa-rte-fullscreen-btn');
      const fullBody = full.querySelector<HTMLElement>('.pa-rte-body');
      if (fullBtn && fullBody) setRteFullscreen(full, fullBody, fullBtn, false);
    });
  }
}

export function setupRte(wrapId, bodyId) {
  const wrap = document.getElementById(wrapId);
  const body = document.getElementById(bodyId);
  if (!wrap || !body) return;

  ensureRteFullscreenButton(wrap, body);

  wrap.querySelectorAll('.pa-rte-btn[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      body.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'createLink') {
        const savedRange = saveSelection(body);
        const existing = getSelectedLinkUrl(body);
        void promptUrl({
          defaultValue: existing,
          title: existing ? 'Edit link' : 'Insert link',
          subtitle: existing
            ? 'Update the URL or remove the link from the selected text.'
            : 'Add a web address for the selected text.',
          confirmLabel: existing ? 'Save link' : 'Insert link',
        }).then((url) => {
          if (url === null) return;
          applyLink(body, url, savedRange);
          updateRteButtonStates(wrap);
        });
        return;
      } else if (cmd === 'formatBlock') {
        document.execCommand('formatBlock', false, btn.dataset.value || 'blockquote');
      } else {
        document.execCommand(cmd, false, null);
      }
      updateRteButtonStates(wrap);
    });
  });
  body.addEventListener('keyup', () => updateRteButtonStates(wrap));
  body.addEventListener('mouseup', () => updateRteButtonStates(wrap));
  body.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });
}

/** @param {HTMLElement} body */
export function getRteHtml(body) {
  return body?.innerHTML?.trim() || '';
}

/** @param {HTMLElement} body @param {string} html */
export function setRteHtml(body, html) {
  if (!body) return;
  body.innerHTML = html || '';
  body.dispatchEvent(new Event('input', { bubbles: true }));
}

export function updateRteButtonStates(wrap) {
  const map = {
    bold: 'bold', italic: 'italic', underline: 'underline',
    insertUnorderedList: 'insertUnorderedList', insertOrderedList: 'insertOrderedList',
  };
  wrap.querySelectorAll('.pa-rte-btn[data-cmd]').forEach((btn) => {
    const cmd = map[btn.dataset.cmd];
    if (!cmd) return;
    try { btn.classList.toggle('active', document.queryCommandState(cmd)); } catch { /* unsupported command */ }
  });
}
