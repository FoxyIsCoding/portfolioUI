export class Guestbook {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.modal = document.getElementById('guestbookModal');
    this.entries = [];
    this.init();
  }

  async init() {
    this.loadEntries();
    this.setupModal();
    this.setupForm();
  }

  setupModal() {
    const openBtn = document.getElementById('openGuestbookBtn');
    const closeBtn = document.getElementById('closeGuestbookBtn');
    const backdrop = this.modal.querySelector('.modal-backdrop');

    openBtn?.addEventListener('click', () => this.openModal());
    closeBtn?.addEventListener('click', () => this.closeModal());
    backdrop?.addEventListener('click', () => this.closeModal());


    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  openModal() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    

    const nameInput = this.modal.querySelector('#guestbook-name');
    setTimeout(() => nameInput?.focus(), 300);
  }

  closeModal() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  setupForm() {
    const submitBtn = document.getElementById('submitGuestbookBtn');
    const nameInput = document.getElementById('guestbook-name');
    const messageInput = document.getElementById('guestbook-message');

    submitBtn?.addEventListener('click', (e) => this.handleSubmit(e, nameInput, messageInput));

    messageInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        this.handleSubmit(e, nameInput, messageInput);
      }
    });
  }

  async handleSubmit(e, nameInput, messageInput) {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message })
      });

      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Response:', text);
        alert('Server error: Invalid response');
        return;
      }

      if (!response.ok) {
        alert(data.error || 'Failed to submit message');
        return;
      }

      nameInput.value = '';
      messageInput.value = '';

      this.closeModal();
      this.loadEntries();
      alert('Message submitted! Thanks for signing the guestbook :3');
    } catch (error) {
      console.error('Submit error:', error);
      alert('Error submitting message: ' + error.message);
    }
  }

  async loadEntries() {
    try {
      const response = await fetch('/api/guestbook');
      const text = await response.text();
      let data;
      
      try {
        data = text ? JSON.parse(text) : [];
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Response:', text);
        data = [];
      }

      this.entries = Array.isArray(data) ? data : [];
      this.render();
    } catch (error) {
      console.error('Failed to load guestbook entries:', error);
      this.entries = [];
      this.render();
    }
  }

  render() {
    const entriesContainer = this.container.querySelector('.guestbook-entries');
    if (!entriesContainer) return;

    if (this.entries.length === 0) {
      entriesContainer.innerHTML = '<p class="guestbook-empty">No messages yet! Be the first to sign the guestbook :3</p>';
      return;
    }

    entriesContainer.innerHTML = this.entries.map(entry => `
      <div class="guestbook-entry">
        <div class="entry-header">
          <h4 class="entry-name">${this.escapeHtml(entry.name)}</h4>
          <span class="entry-date">${new Date(entry.created_at).toLocaleDateString()}</span>
        </div>
        <p class="entry-message">${this.escapeHtml(entry.message)}</p>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
