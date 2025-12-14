export class Guestbook {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.entries = [];
    this.init();
  }

  async init() {
    this.loadEntries();
    this.setupForm();
  }

  setupForm() {
    const form = this.container.querySelector('.guestbook-form');
    if (!form) return;

    const nameInput = form.querySelector('input[placeholder="Name"]');
    const messageInput = form.querySelector('textarea');
    const submitBtn = form.querySelector('md-filled-button');

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
