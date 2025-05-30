class ChatWidget {
  constructor(options = {}) {
    // Configuración por defecto
    this.defaults = {
      position: 'center-bottom',
      theme: 'default',
      primaryColor: '#7b3fe4',
      bgColor: '#ffffff',
      textColor: '#000000',
      textLeftBubble: '#ffffff',
      textRightBubble: '#000000',
      bgRightBubble: '#e5e5ea',
      companyName: 'Soporte',
      logoUrl: '',
      welcomeMessage: '¡Hola! ¿En qué podemos ayudarte?',
      responseMessage: 'Gracias por tu mensaje. ¿En qué más podemos ayudarte?',
      onlineText: 'En línea',
      tooltipText: 'Hola, ¿en qué te podemos ayudar?',
      tooltipDelay: 3000,
      autoResponseDelay: 1000,
      onMessageSent: null,
      onFileUpload: null
    };

    // Fusionar opciones con defaults
    this.config = { ...this.defaults, ...options };

    // Inicializar
    this.init();
  }

  init() {
    const rgbValues = this.defaults.primaryColor.match(/\d+/g).slice(0, 3);
    document.documentElement.style.setProperty('--primary-color-rgb', rgbValues.join(', '));
    // Crear elementos del DOM
    this.createElements();
    // Aplicar configuración inicial
    this.applyTheme(this.config.theme);
    this.positionElements(this.config.position);
    // Configurar eventos
    this.setupEvents();
    // Mostrar tooltip después del delay
    this.setupTooltip();
  }

  createElements() {
    // Crear contenedor principal
    this.chatLauncher = document.createElement('div');
    this.chatLauncher.id = 'chat-launcher';
    this.chatLauncher.style.position = 'fixed';
    this.chatLauncher.style.zIndex = '9999';

    // Botón del chat
    this.chatButton = document.createElement('div');
    this.chatButton.id = 'chat-button';
    this.chatButton.innerHTML = `
      <button class="chat-toggle-btn" id="chatToggleBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
          <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
        </svg>
      </button>
    `;

    // Tooltip
    this.chatTooltip = document.createElement('div');
    this.chatTooltip.id = 'chat-tooltip';
    this.chatTooltip.className = 'hidden';
    let imgChat = this.config.logoUrl !== '' ? `<img src="${this.config.logoUrl}">` : '';
    this.chatTooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-header">
        ${imgChat}
        <strong>${this.config.companyName}</strong><br></div>
        ${this.config.tooltipText}
        <span class="close-tooltip">×</span>
      </div>
    `;

    // Ventana del chat
    this.chatWrapper = document.createElement('div');
    this.chatWrapper.id = 'chatWrapper';
    this.chatWrapper.className = 'chat-wrapper hidden';
    // Estilos iniciales para el wrapper
    this.chatWrapper.style.position = 'fixed';
    this.chatWrapper.style.width = '350px';
    this.chatWrapper.style.height = '600px';
    this.chatWrapper.style.borderRadius = '12px';
    this.chatWrapper.style.boxShadow = '0 5px 40px rgba(0,0,0,0.16)';
    this.chatWrapper.style.display = 'none'; // Inicia oculto
    this.chatWrapper.style.flexDirection = 'column';
    this.chatWrapper.style.overflow = 'hidden';
    this.chatWrapper.style.zIndex = '99999';
    this.chatWrapper.style.transition = 'all 0.3s ease';
    this.chatWrapper.style.opacity = '0'; // Inicia transparente
    this.chatWrapper.style.visibility = 'hidden';
    
    let imgChatWrapper = this.config.logoUrl !== '' ? `<img src="${this.config.logoUrl}">` : '';
    this.chatWrapper.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-top">
          <div class="chat-header-title">
            ${imgChatWrapper}
            ${this.config.companyName}
          </div>
          <button class="btn-close" id="closeChat">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-messages" id="chatMessages">
        <div class="chat-bubble left">${this.config.welcomeMessage}</div>
      </div>

      <button class="scroll-bottom-btn hidden" id="scrollBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5l0 14" />
          <path d="M16 15l-4 4" />
          <path d="M8 15l4 4" />
        </svg>
      </button>
      <span id="typingDots" class="typing-dots hidden"><span></span><span></span><span></span></span>
      <div class="chat-footer">
        <input type="text" id="messageInput" placeholder="Escribe un mensaje..." />
        <label class="btn attach" for="fileInput">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5" />
          </svg>
        </label>
        <input type="file" id="fileInput" accept="image/*" />
        <button class="btn" id="sendMessageBtn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 14l11 -11" />
            <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5" />
          </svg>
        </button>
      </div>
    `;

    // Añadir elementos al DOM
    this.chatLauncher.appendChild(this.chatButton);
    this.chatLauncher.appendChild(this.chatTooltip);
    document.body.appendChild(this.chatLauncher);
    document.body.appendChild(this.chatWrapper);

    // Referencias a elementos importantes
    this.messagesContainer = this.chatWrapper.querySelector('#chatMessages');
    this.messageInput = this.chatWrapper.querySelector('#messageInput');
    this.scrollBtn = this.chatWrapper.querySelector('#scrollBtn');
    this.fileInput = this.chatWrapper.querySelector('#fileInput');
    this.typingDots = this.chatWrapper.querySelector('#typingDots');
    //this.chatStatus = this.chatWrapper.querySelector('#chatStatus');
  }

  setupEvents() {
    // Abrir chat
    this.chatButton.addEventListener('click', () => this.openChat());
    this.chatTooltip.addEventListener('click', () => this.openChat());

    // Cerrar tooltip
    this.chatTooltip.querySelector('.close-tooltip').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTooltip();
    });

    // Cerrar chat
    this.chatWrapper.querySelector('#closeChat').addEventListener('click', () => this.closeChat());

    // Enviar mensaje
    const sendMessageBtn = this.chatWrapper.querySelector('#sendMessageBtn');
    sendMessageBtn.addEventListener('click', () => this.sendMessage());

    // Enviar mensaje con Enter
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Subir archivo
    this.fileInput.addEventListener('change', () => this.handleFileUpload());

    // Scroll
    this.messagesContainer.addEventListener('scroll', () => {
      const atBottom = this.messagesContainer.scrollTop + this.messagesContainer.clientHeight >= 
                      this.messagesContainer.scrollHeight - 20;
      this.scrollBtn.className = atBottom ? 'hidden' : 'scroll-bottom-btn';
    });

    this.scrollBtn.addEventListener('click', () => this.scrollToBottom());

    // Escribiendo...
    /*this.messageInput.addEventListener('input', () => {
      if (this.messageInput.value.trim()) {
        this.updateStatus('typing');
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => this.updateStatus(this.config.onlineText), 2000);
      } else {
        this.updateStatus(this.config.onlineText);
      }
    });*/
  }

  setupTooltip() {
    this.tooltipTimeout = setTimeout(() => {
      if (!this.chatOpened) {
        this.chatTooltip.classList.remove('hidden');
      }
    }, this.config.tooltipDelay);
  }

  openChat() {
    this.chatOpened = true;
    this.chatTooltip.classList.add('hidden');
    this.chatWrapper.classList.remove('hidden');
    // Mostrar el wrapper con transición
    this.chatWrapper.style.display = 'flex';
    setTimeout(() => {
        this.chatWrapper.style.opacity = '1';
        this.chatWrapper.style.visibility = 'visible';
        this.chatWrapper.style.transform = 'translateY(0)';
    }, 10);
    this.chatButton.style.display = 'none';
    this.scrollToBottom();
    clearTimeout(this.tooltipTimeout);
  }

  closeChat() {
    // Primero la animación
    this.chatWrapper.style.opacity = '0';
    this.chatWrapper.style.visibility = 'hidden';
    this.chatWrapper.style.transform = 'translateY(20px)';
    
    // Luego ocultar completamente
    setTimeout(() => {
        this.chatWrapper.style.display = 'none';
        this.chatWrapper.classList.add('hidden');
    }, 300); // Debe coincidir con la duración de la transición
    
    this.chatButton.style.display = 'block';
  }

  closeTooltip() {
    this.chatTooltip.classList.add('hidden');
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  sendMessage() {
    const text = this.messageInput.value.trim();
    if (text !== '') {
      this.addMessage(text, 'right');
      this.messageInput.value = '';
      this.updateStatus(this.config.onlineText);
      
      if (this.config.onMessageSent) {
        this.config.onMessageSent(text);
      }

      // Respuesta automática
      setTimeout(() => {
        this.addMessage(this.config.responseMessage, 'left');
      }, this.config.autoResponseDelay);
    }
  }

  addMessage(text, direction, imageUrl = null) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${direction}`;
    
    if (imageUrl) {
      bubble.innerHTML = `
        ${text ? `<div>${text}</div>` : ''}
        <img src="${imageUrl}" alt="Imagen adjunta" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" />
      `;
    } else {
      bubble.textContent = text;
    }
    
    this.messagesContainer.appendChild(bubble);
    this.scrollToBottom();
  }

  handleFileUpload() {
    if (this.fileInput.files.length > 0) {
      const file = this.fileInput.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const caption = this.messageInput.value.trim();
        this.addMessage(caption, 'right', e.target.result);
        this.messageInput.value = '';
        
        if (this.config.onFileUpload) {
          this.config.onFileUpload(file);
        }
      };
      
      reader.readAsDataURL(file);
      this.fileInput.value = '';
    }
  }

  updateStatus(status) {
    if (status === 'typing') {
      this.typingDots.classList.remove('hidden');
    } else {
      this.typingDots.classList.add('hidden');
    }
  }

  // Métodos de configuración
  applyTheme(themeName) {
    const themes = {
      'default': {
        '--primary-color': '#7b3fe4',
        '--bg-color': '#ffffff',
        '--text-color': '#000000',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#000000',
        '--bg-right-bubble': '#e5e5ea'
      },
      'dark': {
        '--primary-color': '#2d3748',
        '--bg-color': '#1a202c',
        '--text-color': '#e2e8f0',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#ffffff',
        '--bg-right-bubble': '#4a5568'
      },
      'light': {
        '--primary-color': '#4299e1',
        '--bg-color': '#ffffff',
        '--text-color': '#2d3748',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#000000',
        '--bg-right-bubble': '#edf2f7'
      },
      'purple': {
        '--primary-color': '#6b46c1',
        '--bg-color': '#faf5ff',
        '--text-color': '#2d3748',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#000000',
        '--bg-right-bubble': '#e9d8fd'
      },
      'blue': {
        '--primary-color': '#3182ce',
        '--bg-color': '#ebf8ff',
        '--text-color': '#2d3748',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#000000',
        '--bg-right-bubble': '#bee3f8'
      },
      'pink':{
        '--primary-color': '#d8125b',
        '--bg-color': '#ffffff',
        '--text-color': '#000000',
        '--text-left-bubble': '#ffffff',
        '--text-right-bubble': '#ffffff',
        '--bg-right-bubble': '#2c2e39'
      }
    };

    const theme = themes[themeName] || themes['default'];
    for (const [property, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(property, value);
    }
  }

  positionElements(position) {
    const chatPositions = {
      'right-top': { 
        button: { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
        window: { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
        transform: null,
        tooltip: { position: { top:'-5px', right: '60px', bottom:'auto', left:'auto' } }
      },
      'center-top': { 
        button: { top: '20px', left: '50%', right: 'auto', bottom: 'auto' },
        window: { top: '20px', left: '50%', right: 'auto', bottom: 'auto' },
        transform: 'translateX(-50%)',
        tooltip: { position: { top:'-5px', right: 'auto', bottom:'auto', left:'210px' }, transform: 'translateX(-50%)' }
      },
      'left-top': { 
        button: { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
        window: { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
        transform: null,
        tooltip: { position: { top:'-5px', right: '60px', bottom:'auto', left:'60px' } }
      },
      'right-bottom': { 
        button: { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
        window: { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
        transform: null,
        tooltip: { position: { top:'auto',right: '60px', bottom:'-4px', left:'auto'} }
      },
      'center-bottom': { 
        button: { bottom: '20px', left: '50%', right: 'auto', top: 'auto' },
        window: { bottom: '20px', left: '50%', right: 'auto', top: 'auto' },
        transform: 'translateX(-50%)',
        tooltip: { position: { top: 'auto', right: 'auto', bottom: '-4px', left: '1px' }, transform: 'translateX(20%)' }
      },
      'left-bottom': { 
        button: { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
        window: { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
        transform: null,
        tooltip: { position: { top:'auto', right: '60px', bottom:'-4px',left: '60px'} }
      }
    };

    const config = chatPositions[position] || chatPositions['center-bottom'];
    
    // Posicionar botón
    Object.assign(this.chatLauncher.style, config.button);
    this.chatLauncher.style.transform = config.transform || '';
    
    // Posicionar ventana
    Object.assign(this.chatWrapper.style, config.window);
    this.chatWrapper.style.transform = config.transform || '';
    
    // Posicionar tooltip
    const tooltipConfig = config.tooltip;
    Object.assign(this.chatTooltip.style, tooltipConfig.position);
    this.chatTooltip.style.transform = tooltipConfig.transform || '';
  }

  // Métodos públicos para actualizar configuración
  setPosition(position) {
    this.positionElements(position);
  }

  setTheme(themeName) {
    this.applyTheme(themeName);
  }

  setColors(colors) {
    if (colors.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', colors.primaryColor);
    }
    if (colors.bgColor) {
      document.documentElement.style.setProperty('--bg-color', colors.bgColor);
    }
    if (colors.textColor) {
      document.documentElement.style.setProperty('--text-color', colors.textColor);
    }
    if (colors.textLeftBubble) {
      document.documentElement.style.setProperty('--text-left-bubble', colors.textLeftBubble);
    }
    if (colors.textRightBubble) {
      document.documentElement.style.setProperty('--text-right-bubble', colors.textRightBubble);
    }
    if (colors.bgRightBubble) {
      document.documentElement.style.setProperty('--bg-right-bubble', colors.bgRightBubble);
    }
  }

  setCompanyInfo({ name, logoUrl }) {
    if (name) {
      this.config.companyName = name;
      this.chatWrapper.querySelector('.chat-header-title').textContent = name;
      this.chatTooltip.querySelector('strong').textContent = name;
    }
    if (logoUrl) {
      this.config.logoUrl = logoUrl;
      this.chatWrapper.querySelector('.chat-header-title img').src = logoUrl;
    }
  }

  setMessages({ welcome, response, tooltip }) {
    if (welcome) {
      this.config.welcomeMessage = welcome;
      this.messagesContainer.querySelector('.chat-bubble.left').textContent = welcome;
    }
    if (response) {
      this.config.responseMessage = response;
    }
    if (tooltip) {
      this.config.tooltipText = tooltip;
      this.chatTooltip.querySelector('.tooltip-content').innerHTML = `
        <strong>${this.config.companyName}</strong><br>
        ${tooltip}
        <span class="close-tooltip">×</span>
      `;
    }
  }
}

// Exportar para uso en navegador
if (typeof window !== 'undefined') {
  window.ChatWidget = ChatWidget;
}
