class ChatWidget {
  constructor(options = {}) {
    this.defaults = {
      position: 'bottom-middle',
      theme: 'default',
      primaryColor: '#7b3fe4',
      bgColor: '#ffffff',
      textColor: '#000000',
      textLeftBubble: '#ffffff',
      textRightBubble: '#000000',
      bgRightBubble: '#e5e5ea',
      companyName: 'Soporte',
      logoUrl: '',
      bgImage: './bg-1.png',
      welcomeMessage: '¡Hola! ¿En qué podemos ayudarte?',
      responseMessage: 'Gracias por tu mensaje. ¿En qué más podemos ayudarte?',
      onlineText: 'En línea',
      tooltipText: 'Hola, ¿en qué te podemos ayudar?',
      tooltipDelay: 3000,
      autoResponseDelay: 1000,
      onMessageSent: null,
      onFileUpload: null,
      axisX: 50,
      axisY: 50,
      sendMessageUrl: null,
      receiveMessagesUrl: null,
      onChatClosed: null,
      initialMessages: [], 
      autoFetchMessages: false, 
      fetchInterval: null,
      userImgUrl: './chat.svg',
      additionalData: [],
      websocketUrl: null,
      websocketChannel: null,
      onWebSocketMessage: null
    };

    this.config = { ...this.defaults, ...options };
    this.lastMessageDate = null;
    this.selectedFile = null;
    this.filePreviewElement = null;
    this.fetchMessagesInterval = null; 
    this.encodedFile = null;
   
    this.init();
  }

  initWebSocket() {
    try {
      this.websocket = new WebSocket(this.config.websocketUrl);
      
      this.websocket.onopen = () => {
        this.websocket.send(JSON.stringify({
          type: 'register',
          destination: this.config.websocketChannel
        }));
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.warn('WebSocket desconectado', event.reason || '');
        setTimeout(() => this.initWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error inicializando WebSocket:', error);
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'sendText':
        this.addMessage(data.msg, 'left-wg', null, new Date(data.time * 1000));
        this.updateStatus('');
        break;
        
      case 'sendImage':
        this.addMessage(data.msg, 'left-wg', data.url, new Date(data.time * 1000));
        this.updateStatus('');
        break;
        
      case 'sendDocument':
        this.addDocumentMessage(data.url, data.file, data.mime, new Date(data.time * 1000));
        this.updateStatus('');
        break;
        
      case 'sendAudio':
      // Nuevo caso para mensajes de audio
      this.addAudioMessage(data.url, data.mime, data.time, new Date(data.time * 1000));
      this.updateStatus('');
      break;
      
        
      case 'sendTyping':
        this.updateStatus('typing');
        break;
        
      default:
        if (this.config.onWebSocketMessage) {
          this.config.onWebSocketMessage(data);
        }
    }
  }

  addDocumentMessage(url, filename,mime, timestamp = null,direction='left-wg') {
    const now = timestamp || new Date();
    const messageDateOnly = this.getDateOnly(now);
    console.log(filename);
    if (!this.lastMessageDate || this.lastMessageDate !== messageDateOnly) {
      this.addDateSeparator(messageDateOnly);
      this.lastMessageDate = messageDateOnly;
    }
    
    const messageContainer = document.createElement('div');
    messageContainer.className = `chat-wg-message-container-${direction}`;
    
    const bubble = document.createElement('div');
    bubble.className = `chat-wg-bubble ${direction}`;
    let colorText = direction == 'left-wg' ? '--text-wg-left-bubble' : '--text-wg-right-bubble';
    const shortFilename = filename.length > 15 ? filename.substring(0, 15) + '...' : filename;
    
    bubble.innerHTML = `
      <div class="document-message" style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px;">
        <div class="doc-icon" style="background: rgba(40, 37, 27, 0.21); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">${this.getFileIcon(mime)}</div>
        <div class="doc-info" style="flex: 1;">
          <div style="font-weight: bold; font-size: 14px;">${shortFilename}</div>
          <div style="font-size: 12px; color: var(${colorText}); opacity: 0.7;">${mime}</div>
        </div>
        <a href="${url}" target="_blank" style="color: var(${colorText}); text-decoration: none; font-size: 18px;"> 
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            <path d="M12 17v-6" />
            <path d="M9.5 14.5l2.5 2.5l2.5 -2.5" />
          </svg>

        </a>
      </div>
    `;
    
    const dateElement = document.createElement('div');
    dateElement.className = `chat-wg-message-date-${direction}`;
    dateElement.textContent = this.formatTime(now);
    if(direction == 'left-wg'){
      messageContainer.innerHTML = `
        <div class="bot-wg-logo">
          <img src="${this.config.userImgUrl}" alt="Chat Icon" width="20" height="20" />
        </div>
      `;
    }
    
    messageContainer.appendChild(bubble);
    messageContainer.appendChild(dateElement);
    
    this.messagesContainer.appendChild(messageContainer);
    this.scrollToBottom();
  }
  addAudioMessage(url, mime, time, timestamp = null, direction = 'left-wg') {
  const now = timestamp || new Date();
  const messageDateOnly = this.getDateOnly(now);
  
  if (!this.lastMessageDate || this.lastMessageDate !== messageDateOnly) {
    this.addDateSeparator(messageDateOnly);
    this.lastMessageDate = messageDateOnly;
  }
  
  const messageContainer = document.createElement('div');
  messageContainer.className = `chat-wg-message-container-${direction}`;
  
  const bubble = document.createElement('div');
  bubble.className = `chat-wg-bubble ${direction}`;
  
  // Formatear duración del audio si está disponible
  const formattedDuration = time ? this.formatAudioDuration(time) : 'Audio';
  
  bubble.innerHTML = `
    <div class="audio-message" style="display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; min-width: 200px;">
      <div class="audio-icon" style="background: rgba(40, 37, 27, 0.21); color: white; padding: 8px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; min-width: 32px; height: 32px;">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polygon points="11 5,6 9,2 9,2 15,6 15,11 19,11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </div>
      <div class="audio-info" style="flex: 1;">
        <div style="font-weight: bold; font-size: 14px; color: var(--text-wg-left-bubble);">Audio</div>
        <div style="font-size: 12px; color: var(--text-wg-left-bubble); opacity: 0.7;">${formattedDuration}</div>
      </div>
      <div class="audio-controls" style="display: flex; gap: 8px; align-items: center;">
        <button 
          class="audio-play-btn" 
          onclick="this.closest('.audio-message').querySelector('audio').play(); this.style.display='none'; this.nextElementSibling.style.display='flex';"
          style="background: transparent; border: none; color: var(--text-wg-left-bubble); cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='0.7'"
          onmouseout="this.style.opacity='1'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <polygon points="5,3 19,12 5,21 5,3" />
          </svg>
        </button>
        <button 
          class="audio-pause-btn" 
          onclick="this.closest('.audio-message').querySelector('audio').pause(); this.style.display='none'; this.previousElementSibling.style.display='flex';"
          style="background: transparent; border: none; color: var(--text-wg-left-bubble); cursor: pointer; padding: 4px; border-radius: 50%; display: none; align-items: center; justify-content: center; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='0.7'"
          onmouseout="this.style.opacity='1'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>
        <a 
          href="${url}" 
          target="_blank" 
          download
          style="color: var(--text-wg-left-bubble); text-decoration: none; font-size: 18px; display: flex; align-items: center; justify-content: center; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='0.7'"
          onmouseout="this.style.opacity='1'"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>
      <audio preload="metadata" style="display: none;">
        <source src="${url}" type="${mime}">
        Tu navegador no soporta el elemento de audio.
      </audio>
    </div>
  `;
  
  const dateElement = document.createElement('div');
  dateElement.className = `chat-wg-message-date-${direction}`;
  dateElement.textContent = this.formatTime(now);
  
  if (direction === 'left-wg') {
    messageContainer.innerHTML = `
      <div class="bot-wg-logo">
        <img src="${this.config.userImgUrl}" alt="Chat Icon" width="20" height="20" />
      </div>
    `;
  }
  
  messageContainer.appendChild(bubble);
  messageContainer.appendChild(dateElement);
  
  this.messagesContainer.appendChild(messageContainer);
  this.scrollToBottom();
  
  // Agregar event listeners para el progreso del audio
  const audioElement = bubble.querySelector('audio');
  const playBtn = bubble.querySelector('.audio-play-btn');
  const pauseBtn = bubble.querySelector('.audio-pause-btn');
  
  if (audioElement) {
    audioElement.addEventListener('ended', () => {
      playBtn.style.display = 'flex';
      pauseBtn.style.display = 'none';
    });
    
    audioElement.addEventListener('pause', () => {
      playBtn.style.display = 'flex';
      pauseBtn.style.display = 'none';
    });
    
    // Cargar metadatos para obtener la duración real
    audioElement.addEventListener('loadedmetadata', () => {
      const duration = audioElement.duration;
      if (duration && !isNaN(duration)) {
        const durationElement = bubble.querySelector('.audio-info div:last-child');
        if (durationElement) {
          durationElement.textContent = this.formatAudioDuration(duration);
        }
      }
    });
  }
}

// Función auxiliar para formatear la duración del audio
formatAudioDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Audio';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
  closeWebSocket() {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
  _initStyles() {
    if (!document.getElementById('chat-widget-styles')) {
      const styles = document.createElement('style');
      styles.id = 'chat-widget-styles';
      styles.textContent = `
      :root {
        --primary-wg-color: #7b3fe4;
        --bg-wg-color: #fff;
        --text-wg-color: #000;
        --text-wg-left-bubble: #fff;
        --bg-wg-right-bubble: #e5e5ea;
        --text-wg-right-bubble: #000;
        --primary-wg-color-rgb: rgb(123, 63, 228); 
      }
      .btn-wg-close:hover{
        opacity: 0.7;
      }
      #chat-wg-launcher {
          position: fixed;
          z-index: 9999;
      }

      #chat-wg-button {
          background-color: var(--primary-wg-color);
          color: var(--bg-wg-color);
          font-size: 24px !important;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          -webkit-animation: 
              tm-box-button-visible 1s ease-out forwards 1,
              constant-pulse 2s infinite ease-out;
          animation: 
              tm-box-button-visible 1s ease-out forwards 1,
              constant-pulse 2s infinite ease-out;
          transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
          position: relative;
          z-index: 1;
      }

      #chat-wg-button::before,
      #chat-wg-button::after {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border: 2px solid var(--primary-wg-color);
          border-radius: 50%;
          animation: radar-wave 2s linear infinite;
          opacity: 0;
          z-index: -1;
      }

      #chat-wg-button::after {
          animation-delay: 1s; 
      }

      @keyframes radar-wave {
          0% {
              transform: scale(0.5);
              opacity: 0.8;
          }
          100% {
              transform: scale(1.5);
              opacity: 0;
          }
      }

      @keyframes constant-pulse {
          0%, 100% {
              box-shadow: 0 0 0 0 rgba(var(--primary-wg-color-rgb), 0.4);
          }
          50% {
              box-shadow: 0 0 0 8px rgba(var(--primary-wg-color-rgb), 0);
          }
      }

      #chat-wg-button:hover {
          transform: scale(1.1);
          animation: 
              tm-box-button-visible 1s ease-out forwards 1,
              constant-pulse 2s infinite ease-out;
      }

      @-webkit-keyframes tm-box-button-visible{from{-webkit-transform:scale(0);transform:scale(0)}30.001%{-webkit-transform:scale(1.2);transform:scale(1.2)}62.999%{-webkit-transform:scale(1);transform:scale(1)}100%{-webkit-transform:scale(1);transform:scale(1)}}
      @keyframes tm-box-button-visible{from{-webkit-transform:scale(0);transform:scale(0)}30.001%{-webkit-transform:scale(1.2);transform:scale(1.2)}62.999%{-webkit-transform:scale(1);transform:scale(1)}100%{-webkit-transform:scale(1);transform:scale(1)}}.tm-box-button-disable{-webkit-animation:tm-box-button-disable .3s ease-out forwards 1;animation:tm-box-button-disable .3s ease-out forwards 1}
      @-webkit-keyframes tm-box-button-disable{from{-webkit-transform:scale(1);transform:scale(1)}50.001%{-webkit-transform:scale(.5);transform:scale(.5)}92.999%{-webkit-transform:scale(0);transform:scale(0)}100%{-webkit-transform:scale(0);transform:scale(0)}}
      @keyframes tm-box-button-disable{from{-webkit-transform:scale(1);transform:scale(1)}50.001%{-webkit-transform:scale(.5);transform:scale(.5)}92.999%{-webkit-transform:scale(0);transform:scale(0)}100%{-webkit-transform:scale(0);transform:scale(0)}}.tm-box-button-social{display:none}.tm-box-button-social-item{position:relative;display:block;margin:0 10px 10px 0;width:45px;height:44px;background-size:100%;border-radius:25px;-webkit-box-shadow:0 8px 6px -6px rgba(33,33,33,.2);-moz-box-shadow:0 8px 6px -6px rgba(33,33,33,.2);box-shadow:0 8px 6px -6px rgba(33,33,33,.2);cursor:pointer}.tm-box-button-social-item:hover{-webkit-box-shadow:0 0 6px rgba(0,0,0,.16),0 6px 12px rgba(0,0,0,.32);box-shadow:0 0 6px rgba(0,0,0,.16),0 6px 12px rgba(0,0,0,.32);-webkit-transition:box-shadow .17s cubic-bezier(0,0,.2,1);transition:box-shadow .17s cubic-bezier(0,0,.2,1)}.ui-icon.tm-box-button-social-item,.ui-icon.connector-icon-45{width:46px;height:46px;--ui-icon-size-md:46px }

      #chat-wg-button:hover {
          transform: scale(1.1);
      }

      .chat-wg-toggle-btn {
        position: fixed;
        background: var(--primary-wg-color);
        color: var(--text-wg-left-bubble);
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 10px rgba(var(--primary-wg-color-rgb), 0.25);
        border: 3px solid rgba(var(--primary-wg-color-rgb), 0.05);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        -webkit-animation:tm-box-button-visible 1s ease-out forwards 1;
          animation:tm-box-button-visible 1s ease-out forwards 1
      }

      .chat-wg-toggle-btn:hover {
        transform: scale(1.1);
      }

      #chat-wg-tooltip {
          position: absolute;
          background: var(--bg-wg-color);
          border-radius: 10px;
          padding: 10px;
          box-shadow: 0 5px 10px rgba(0,0,0,0.1);
          border: 2px solid var(--primary-wg-color);
          width: 300px;
          cursor: pointer;
          z-index: 9998;
      }

      .tooltip-wg-content {
          position: relative;
          font-family: sans-serif;
          font-size: 14px;
          color: var(--text-wg-color);
      }

      .tooltip-wg-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
      }

      .tooltip-wg-header img{
          width: 30px;
          height: 30px;
      }
          
      .close-wg-tooltip {
        position: absolute;
        top: 0;
        right: 5px;
        cursor: pointer;
        font-size: 16px;
      }

      .hidden-wg {
        display: none !important;
      }

      .chat-wg-wrapper {
        position: fixed;
        width: 100%;
        background: var(--bg-wg-color);
        border-radius: 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 999;
        transition: all 0.3s ease;
      }

      .chat-wg-header {
        display: flex;
        flex-direction: column;
        background: var(--primary-wg-color);
        color: var(--text-wg-left-bubble);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      }

      .chat-wg-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
      }

      .chat-wg-header-top img {
        height: 30px;
        margin-right: 8px;
      }

      .chat-wg-header-title {
        display: flex;
        align-items: center;
        font-weight: bold;
        font-size: 1rem;
      }

      .chat-wg-header button {
        background: transparent;
        border: none;
        color: var(--text-wg-left-bubble);
        font-size: 20px;
        cursor: pointer;
      }

      .chat-wg-status {
        font-size: 0.85rem;
        padding: 0 12px 10px;
        color: #d4eaff;
      }

      .chat-wg-messages {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        position: relative;
        background: var(--bg-wg-color);
        background-image: url('${this.config.bgImage}');
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center center;
        image-rendering: auto; 
      }

      .chat-wg-bubble {
        padding: 10px 14px;
        margin: 6px 0;
        border-radius: 18px;
        word-wrap: break-word;
        font-size: 0.95rem;
      }

      .chat-wg-bubble img {
        max-width: 100%;
        border-radius: 10px;
        margin-top: 5px;
      }
        
      .chat-wg-message-container-left-wg{
        align-self: flex-start;
        margin-left: 20px
      }
      
      .chat-wg-message-container-right-wg{
        align-self: flex-end;
      }
      
      .left-wg { align-self: flex-start; text-align: left; background-color: var(--primary-wg-color); color: var(--text-wg-left-bubble); }
      .right-wg { align-self: flex-end; text-align: right; background-color: var(--bg-wg-right-bubble); color: var(--text-wg-right-bubble); }

      .chat-wg-footer {
        display: flex;
        gap: 6px;
        padding: 10px;
        border-top: 1px solid #ddd;
        align-items: center;
      }

      .chat-wg-footer input[type="file"] { display: none; }

      .chat-wg-footer .btn-wg {
        color: var(--text-wg-color);
        border: none;
        padding: 5px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        background: none; 
      }

      .chat-wg-footer .btn-wg.attach-wg {
        cursor: pointer;
        outline: none;
        border: none;
        background: none;
        transition: opacity 0.2s ease;
        height: 26px;
        width: 26px;
      }

      .chat-wg-footer .attach:hover {
        opacity: 0.6;
      }
      .chat-wg-footer .btn-wg:hover{
        opacity: 0.6;
      }

      .chat-wg-footer input[type="text"] {
        flex: 1;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 8px;
      }

      .scroll-wg-bottom-btn {
        position: absolute;
        bottom: 75px;
        right: 10px;
        display: flex;
        background: var(--primary-wg-color);
        opacity: 0.9;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 16px;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        z-index: 10;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      }
      .typing-wg-dots{
        position: absolute;
        bottom: 70px;
        left: 10px;
      }
      .typing-wg-dots span {
        display: inline-block;
        width: 6px;
        height: 6px;
        background-color: var(--primary-wg-color);
        border-radius: 50%;
        margin: 0 2px;
        animation: blink 1.4s infinite both;
      }

      .typing-wg-dots span:nth-child(2) { animation-delay: 0.2s; }
      .typing-wg-dots span:nth-child(3) { animation-delay: 0.4s; }

      @keyframes blink {
        0%, 80%, 100% { opacity: 0; }
        40% { opacity: 1; }
      }

      #messageInput{
        border: none;
        outline: none;
        background: var(--bg-wg-color);
        color: var(--text-wg-color);
      }
      #messageInput::placeholder {
        color: var(--text-wg-color);
        opacity: 0.5;
      }
      #messageInput:focus{
        border: none;
        outline: none;
      }
      
      #messageInput:disabled {
        color: #999 !important;
        cursor: not-allowed;
      }

      #messageInput:disabled::placeholder {
        color: #999 !important;
        opacity: 1;
      }
      .chat-wg-message-date-right-wg {
        font-size: 0.75rem;
        margin-top: 4px;
        font-weight: bold;
        text-shadow: 1px 1px 2px var(--bg-wg-color);
        text-align: right;
        color: var(--text-wg-color);
      }

      .chat-wg-message-date-left-wg {
        font-size: 0.75rem;
        margin-top: 4px;
        font-weight: bold;
        text-shadow: 1px 1px 2px var(--bg-wg-color);
        text-align: left;
        color: var(--text-wg-color);
      }

      .chat-wg-date-separator {
        text-align: center;
        margin: 15px 0;
        position: relative;
      }

      .chat-wg-date-separator::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--text-wg-color);
        opacity: 0.4;
        z-index: 1;
      }

      .chat-wg-date-separator span {
        background: var(--primary-wg-color);
        padding: 4px 12px;
        font-size: 0.8rem;
        color: var(--text-wg-left-bubble);
        border-radius: 12px;
        border: 1px solid var(--text-wg-color);
        position: relative;
        z-index: 2;
      }
      
      .file-wg-preview {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 8px;
        margin: 0 10px 5px 10px;
      }

      .file-wg-preview img {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 6px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }

      .file-wg-preview-info {
        flex: 1;
        font-size: 0.85rem;
        color: var(--text-wg-color);
      }

      .file-wg-preview-info div:first-child {
        font-weight: 500;
        margin-bottom: 2px;
      }

      .file-wg-preview-remove {
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        color: var(--text-wg-left-bubble);
        background: var(--primary-wg-color);
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s ease;
      }

      .file-wg-preview-remove:hover {
        opacity: 0.8;
      }
      
      .bot-wg-logo{
        position: absolute;
        left: 1px;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 3px;
        height: 28px;
        width: 28px;
        border-radius: 50%;
        background: var(--primary-wg-color);
        opacity: 0.9;
        color: var(--text-wg-left-bubble);
      }

      @media (max-width: 500px) {
        .chat-wg-wrapper {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          min-height: 100dvh !important;
          border-radius: 0 !important;
          transform: none !important;
          z-index: 9999;
          display: flex;
          flex-direction: column;
        }


        @supports not (height: 100dvh) {
          .chat-wg-wrapper {
            height: 100vh !important;
            width: 100vw !important;
            min-height: 100vh !important;
          }
        }

        .chat-wg-input-wrapper input[type="text"],
        .chat-wg-input-wrapper textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 0.5rem;
          font-size: 1rem;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
}      
      
      `;
      document.head.appendChild(styles);
    }

  }

  init() {
    const rgbValues = this.defaults.primaryColor.match(/\d+/g).slice(0, 3);
    document.documentElement.style.setProperty('--primary-wg-color-rgb', rgbValues.join(', '));
    // Crear elementos del DOM
    this._initStyles();
    this.createElements();
    // Aplicar configuración inicial
    this.applyTheme(this.config.theme);
    this.positionElements(this.config.position);
    this.renderInitialMessages();
     if (this.config.websocketUrl && this.config.websocketChannel) {
      this.initWebSocket();
    }
    // Configurar eventos
    this.setupEvents();
    // Mostrar tooltip después del delay
    this.setupTooltip();

  }

  createElements() {
    // Crear contenedor principal
    this.chatLauncher = document.createElement('div');
    this.chatLauncher.id = 'chat-wg-launcher';
    this.chatLauncher.style.position = 'fixed';
    this.chatLauncher.style.zIndex = '9999';

    // Botón del chat
    this.chatButton = document.createElement('div');
    this.chatButton.id = 'chat-wg-button';
    this.chatButton.innerHTML = `
      <button class="chat-wg-toggle-btn" id="chatToggleBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 14l-3 -3h-7a1 1 0 0 1 -1 -1v-6a1 1 0 0 1 1 -1h9a1 1 0 0 1 1 1v10" />
          <path d="M14 15v2a1 1 0 0 1 -1 1h-7l-3 3v-10a1 1 0 0 1 1 -1h2" />
        </svg>
      </button>
    `;

    // Tooltip
    this.chatTooltip = document.createElement('div');
    this.chatTooltip.id = 'chat-wg-tooltip';
    this.chatTooltip.className = 'hidden-wg';
    let imgChat = this.config.logoUrl !== '' ? `<img src="${this.config.logoUrl}">` : '';
    this.chatTooltip.innerHTML = `
      <div class="tooltip-wg-content">
        <div class="tooltip-wg-header">
        ${imgChat}
        <strong>${this.config.companyName}</strong><br></div>
        ${this.config.tooltipText}
        <span class="close-wg-tooltip">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
          </svg></span>
      </div>
    `;

    // Ventana del chat
    this.chatWrapper = document.createElement('div');
    this.chatWrapper.id = 'chatWrapper';
    this.chatWrapper.className = 'chat-wg-wrapper hidden-wg';
    // Estilos iniciales para el wrapper
    this.chatWrapper.style.position = 'fixed';
    this.chatWrapper.style.width = '350px';
    this.chatWrapper.style.height = '550px';
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
      <div class="chat-wg-header">
        <div class="chat-wg-header-top">
          <div class="chat-wg-header-title">
            ${imgChatWrapper}
            ${this.config.companyName}
          </div>
          <button class="btn-wg-close" id="closeChat">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="chat-wg-messages" id="chatMessages">
        <div class="chat-wg-bubble left-wg">${this.config.welcomeMessage}</div>
      </div>

      <span id="typingDots" class="typing-wg-dots hidden-wg" data-xtz-ifaceid="typingDots"><span></span><span></span><span></span></span>
      <button class="scroll-wg-bottom-btn hidden-wg" id="scrollBtn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5l0 14" />
          <path d="M16 15l-4 4" />
          <path d="M8 15l4 4" />
        </svg>
      </button>
      <div id="filePreview" class="file-wg-preview hidden-wg"></div>
<div class="chat-wg-footer">
  <input type="text" id="messageInput" placeholder="Escribe un mensaje..." />
  <label class="btn-wg attach-wg" for="fileInput">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 7l-6.5 6.5a1.5 1.5 0 0 0 3 3l6.5 -6.5a3 3 0 0 0 -6 -6l-6.5 6.5a4.5 4.5 0 0 0 9 9l6.5 -6.5" />
    </svg>
  </label>
  <input type="file" id="fileInput" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.ppt,.pptx" />
  <button class="btn-wg" id="sendMessageBtn">
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
    this.filePreview = this.chatWrapper.querySelector('#filePreview');
    //this.chatStatus = this.chatWrapper.querySelector('#chatStatus');
  }

  setupEvents() {
    // Abrir chat
    this.chatButton.addEventListener('click', () => this.openChat());
    this.chatTooltip.addEventListener('click', () => this.openChat());

    // Cerrar tooltip
    this.chatTooltip.querySelector('.close-wg-tooltip').addEventListener('click', (e) => {
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
      this.scrollBtn.className = atBottom ? 'hidden-wg' : 'scroll-wg-bottom-btn';
    });

    this.scrollBtn.addEventListener('click', () => this.scrollToBottom());
  }

  setupTooltip() {
    this.tooltipTimeout = setTimeout(() => {
      if (!this.chatOpened) {
        this.chatTooltip.classList.remove('hidden-wg');
      }
    }, this.config.tooltipDelay);
  }

  openChat() {
    this.chatOpened = true;
    this.chatTooltip.classList.add('hidden-wg');
    this.chatWrapper.classList.remove('hidden-wg');
    
    this.chatWrapper.style.display = 'flex';
    setTimeout(() => {
        this.chatWrapper.style.opacity = '1';
        this.chatWrapper.style.visibility = 'visible';
        this.chatWrapper.style.transform = 'translateY(0)';
    }, 10);
    
    this.chatButton.style.display = 'none';
    this.scrollToBottom();
    clearTimeout(this.tooltipTimeout);
    
    this.renderInitialMessages();
    
    if (this.config.autoFetchMessages && this.config.receiveMessagesUrl) {
      this.fetchMessages();
    }
    
    if (this.config.fetchInterval && this.config.receiveMessagesUrl) {
      this.fetchMessagesInterval = setInterval(() => {
        this.fetchMessages();
      }, this.config.fetchInterval);
    }
  }

  closeChat() {

    if (this.fetchMessagesInterval) {
      clearInterval(this.fetchMessagesInterval);
      this.fetchMessagesInterval = null;
    }
  
    if (this.config.onChatClosed) {
      this.config.onChatClosed();
    }
    
    this.chatWrapper.style.opacity = '0';
    this.chatWrapper.style.visibility = 'hidden';
    this.chatWrapper.style.transform = 'translateY(20px)';
    

    setTimeout(() => {
        this.chatWrapper.style.display = 'none';
        this.chatWrapper.classList.add('hidden-wg');
    }, 300);
    
    this.chatButton.style.display = 'block';
    this.chatOpened = false;
  }

  loadMessages(messages) {
    this.config.initialMessages = messages;
    this.renderInitialMessages();
  }

  async sendProgrammaticMessage(text, file = null) {
    if (file) {
      if (this.isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.addMessage(text, 'right-wg', e.target.result);
        };
        reader.readAsDataURL(file);
      } else if (this.isDocumentFile(file)) {
        this.addDocumentMessage(
          URL.createObjectURL(file),
          file.name,
          file.type,
          new Date(),
          'right-wg'
        );
      }
      
      // AGREGAR ESTA LÍNEA: Habilitar input después de envío programático
      this.enableMessageInput();
      
      if (this.config.sendMessageUrl) {
        try {
          await this.sendToAPI({
            message: this.isDocumentFile(file) ? '' : text,
            file: file,
            type: 'file'
          });
        } catch (error) {
          console.error('Error enviando archivo programáticamente:', error);
        }
      }
    } else {
      this.addMessage(text, 'right-wg');
      
      if (this.config.sendMessageUrl) {
        try {
          await this.sendToAPI({
            message: text,
            type: 'text'
          });
        } catch (error) {
          console.error('Error enviando mensaje programáticamente:', error);
        }
      }
    }
  }

// 11. Método público para refrescar mensajes
async sendMessage() {
  const text = this.messageInput.value.trim();
  this.filePreview.classList.add('hidden-wg');
  if (this.selectedFile) {
    const fileToSend = this.selectedFile;
    
    if (this.isImageFile(fileToSend)) {
      // Es imagen - puede tener texto
      const reader = new FileReader();
      reader.onload = (e) => {
        this.addMessage(text, 'right-wg', e.target.result);
      };
      reader.readAsDataURL(fileToSend);
    } else if (this.isDocumentFile(fileToSend)) {
      // Es documento - mostrar como documento sin texto
      this.addDocumentMessage(
        URL.createObjectURL(fileToSend),
        fileToSend.name,
        fileToSend.type,
        new Date(),
        'right-wg'
      );
    }
    
    // Limpiar la interfaz
    this.messageInput.value = '';
    
    
    // Enviar a la API
    if (this.config.sendMessageUrl) {
      try {
        await this.sendToAPI({
          message: this.isDocumentFile(fileToSend) ? '' : text,
          file: fileToSend,
          type: 'file'
        });
      } catch (error) {
        console.error('Error enviando archivo:', error);
      }finally{
        this.removeFilePreview();
        this.enableMessageInput();
      }
    }
    
    if (this.config.onFileUpload) {
      this.config.onFileUpload(fileToSend, this.isDocumentFile(fileToSend) ? '' : text);
    }
    
    if (!this.config.sendMessageUrl) {
      setTimeout(() => {
        this.updateStatus('');
        this.addMessage(this.config.responseMessage, 'left-wg');
        this.removeFilePreview();
        this.enableMessageInput();
      }, this.config.autoResponseDelay);
    }
  }
  // Mensaje de solo texto
  else if (text !== '') {
    this.addMessage(text, 'right-wg');
    this.messageInput.value = '';
    
    if (this.config.sendMessageUrl) {
      try {
        await this.sendToAPI({
          message: text,
          type: 'text'
        });
      } catch (error) {
        console.error('Error enviando mensaje:', error);
      }
    }
    
    if (this.config.onMessageSent) {
      this.config.onMessageSent(text);
    }
    
    if (!this.config.sendMessageUrl) {
      setTimeout(() => {
        this.addMessage(this.config.responseMessage, 'left-wg');
      }, this.config.autoResponseDelay);
    }
  }
}
  closeTooltip() {
    this.chatTooltip.classList.add('hidden-wg');
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }


  async sendToAPI(messageData) {
    try {
      const formData = new FormData();
      formData.append('message', messageData.message || '');
      formData.append('type', messageData.type);

      if (this.config.additionalData && typeof this.config.additionalData === 'object') {
        Object.entries(this.config.additionalData).forEach(([key, value]) => {
          formData.append(key, value);
        });
      }
      console.log(this.encodedFile);

      if (messageData.file && messageData.file instanceof File) {
        formData.append('attach', this.encodedFile ?? messageData.file);
        formData.append('attach_file', messageData.file.name);
        formData.append('attach_mime', messageData.file.type);
        formData.append('size', messageData.file.size);
      }

      const response = await fetch(this.config.sendMessageUrl, {
        method: 'POST',
        body: formData
      });


      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Respuesta del servidor:', result); // Debug

      // Procesar respuesta del servidor
      if (result.reply) {
        this.addMessage(result.reply, 'left-wg');
      }

      // Procesar múltiples mensajes si vienen en array
      if (result.messages && Array.isArray(result.messages)) {
        result.messages.forEach(msg => {
          this.addMessage(msg.text || msg.message, 'left-wg', msg.imageUrl);
        });
      }

      return result;

    } catch (error) {
      console.error('Error enviando mensaje:', error);
      this.updateStatus('');
      this.addMessage('Error al enviar mensaje. Intenta nuevamente.', 'left-wg');
      throw error;
    }
  }



  async fetchMessages() {
    if (!this.config.receiveMessagesUrl) return;
    
    try {
      const response = await fetch(this.config.receiveMessagesUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const messages = await response.json();
      
      // Procesar nuevos mensajes
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          this.addMessage(msg.text, msg.direction || 'left-wg', msg.imageUrl);
        });
      }
      
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
    }
  }


  renderInitialMessages() {
    if (this.config.initialMessages && Array.isArray(this.config.initialMessages)) {
      this.messagesContainer.innerHTML = '';
      const welcomeBubble = document.createElement('div');
      welcomeBubble.className = 'chat-wg-bubble left-wg';
      welcomeBubble.textContent = this.config.welcomeMessage;
      this.messagesContainer.appendChild(welcomeBubble);
      this.config.initialMessages.forEach(msg => {
        switch(msg.type){
          case 'document':
            this.addDocumentMessage(msg.url, msg.filename, msg.mime, msg.timestamp ? new Date(msg.timestamp) : new Date(), msg.direction)
            break;
          case 'audio':
            this.addAudioMessage(msg.url, msg.mime, msg.time, msg.timestamp ? new Date(msg.timestamp) : new Date(), msg.direction = 'left-wg')
            break;
          default:
            this.addMessage(
              msg.text, 
              msg.direction || 'left-wg', 
              msg.imageUrl,
              msg.timestamp ? new Date(msg.timestamp) : new Date()
            );
            break;
        }
      });
    }
  }


  addMessage(text, direction, imageUrl = null, customTimestamp = null) {
    const now = customTimestamp || new Date();
    const messageDate = this.formatDate(now);
    const messageDateOnly = this.getDateOnly(now);
    
    if (!this.lastMessageDate || this.lastMessageDate !== messageDateOnly) {
      this.addDateSeparator(messageDateOnly);
      this.lastMessageDate = messageDateOnly;
    }
    
    const messageContainer = document.createElement('div');
    messageContainer.className = `chat-wg-message-container-${direction}`;
    
    const bubble = document.createElement('div');
    bubble.className = `chat-wg-bubble ${direction}`;
    
    const dateElement = document.createElement('div');
    dateElement.className = `chat-wg-message-date-${direction}`;
    dateElement.textContent = this.formatTime(now);
    
    if(direction == 'left-wg'){
      messageContainer.innerHTML = `
      <div class="bot-wg-logo">
        <img src="${this.config.userImgUrl}" alt="Chat Icon" width="20" height="20" />
      </div>
        `;
    }
    
    if (imageUrl) {
      bubble.innerHTML = `
        <a href="${imageUrl}" target="_blank" style="display: inline-block;">
          <img src="${imageUrl}" alt="Imagen adjunta"
          style="max-width: 100%; height: 100px; border-radius: 8px; margin-top: 8px;" />
        </a>
        ${text ? `<div>${text}</div>` : ''}
      `;
    } else {
      bubble.innerHTML = text; 
    }

    
    messageContainer.appendChild(bubble);
    messageContainer.appendChild(dateElement);
    
    this.messagesContainer.appendChild(messageContainer);
    this.scrollToBottom();
  }

  addDateSeparator(dateString) {
    const separator = document.createElement('div');
    separator.className = 'chat-wg-date-separator';
    separator.innerHTML = `<span>${this.formatDateSeparator(dateString)}</span>`;
    this.messagesContainer.appendChild(separator);
  }

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  getDateOnly(date) {
    return date.toLocaleDateString('en-US');
  }

  formatDateSeparator(dateString) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayString = this.getDateOnly(today);
    const yesterdayString = this.getDateOnly(yesterday);
    
    if (dateString === todayString) {
      return 'Hoy';
    } else if (dateString === yesterdayString) {
      return 'Ayer';
    } else {
      return dateString;
    }
  }

  isImageFile(file) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(file.type);
  }

  isDocumentFile(file) {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  return documentTypes.includes(file.type);
}

  getFileIcon(mimeType) {
  const icons = {
    // PDF
    'application/pdf': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>`,
    
    // Word Documents
    'application/msword': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>`,
    
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>`,
    
    // Excel/Spreadsheets
    'application/vnd.ms-excel': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <rect x="8" y="12" width="8" height="2"/>
        <rect x="8" y="16" width="8" height="2"/>
        <rect x="8" y="8" width="8" height="2"/>
      </svg>`,
    
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <rect x="8" y="12" width="8" height="2"/>
        <rect x="8" y="16" width="8" height="2"/>
        <rect x="8" y="8" width="8" height="2"/>
      </svg>`,
    
    // CSV
    'text/csv': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <path d="M8 12h8M8 16h8M8 8h2"/>
        <circle cx="12" cy="10" r="1"/>
        <circle cx="16" cy="10" r="1"/>
        <circle cx="12" cy="14" r="1"/>
        <circle cx="16" cy="14" r="1"/>
      </svg>`,
    
    // Text Files
    'text/plain': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <line x1="10" y1="9" x2="8" y2="9"/>
      </svg>`,
    
    // PowerPoint
    'application/vnd.ms-powerpoint': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <rect x="8" y="10" width="8" height="6" rx="1"/>
        <circle cx="10" cy="12" r="1"/>
      </svg>`,
    
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <rect x="8" y="10" width="8" height="6" rx="1"/>
        <circle cx="10" cy="12" r="1"/>
      </svg>`
  };
  
  // Default icon for unknown file types
  const defaultIcon = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
    </svg>`;
  
  return icons[mimeType] || defaultIcon;
}
  disableMessageInput() {
    this.messageInput.disabled = true;
    this.messageInput.placeholder = 'No se puede agregar texto con documentos';
  }

  enableMessageInput() {
    this.messageInput.disabled = false;
    this.messageInput.placeholder = 'Escribe un mensaje...';
    this.messageInput.style.backgroundColor = 'var(--bg-wg-color)';
    this.messageInput.style.color = 'var(--text-wg-color)';
  }

  handleFileUpload() {
    if (this.fileInput.files.length > 0) {
      const file = this.fileInput.files[0];
      this.selectedFile = file;
      
      if (this.isImageFile(file)) {
        // Es imagen - mostrar preview normal y permitir texto
        this.showImagePreview(file);
        this.enableMessageInput();
      } else if (this.isDocumentFile(file)) {
        // Es documento - mostrar preview de documento y deshabilitar texto
        this.showDocumentPreview(file);
        this.disableMessageInput();
      } else {
        // Tipo no soportado
        alert('Tipo de archivo no soportado. Por favor selecciona una imagen o documento válido.');
        this.fileInput.value = '';
        return;
      }
    }
  }

  showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.encodedFile = e.target.result;
      this.filePreview.innerHTML = `
        <img src="${this.encodedFile}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
        <div class="file-wg-preview-info">
          <div style="color: var(--text-wg-color)">${file.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-wg-color); opacity: 0.6;">${this.formatFileSize(file.size)}</div>
        </div>
        <button class="file-wg-preview-remove" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
          </svg>
        </button>
      `;
      this.filePreview.classList.remove('hidden-wg');
      
      const removeBtn = this.filePreview.querySelector('.file-wg-preview-remove');
      removeBtn.addEventListener('click', () => this.removeFilePreview());
    };
    
    reader.readAsDataURL(file);
  }

  showDocumentPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.encodedFile = e.target.result;
      console.log(this.encodedFile);
      const fileIcon = this.getFileIcon(file.type);
      const shortFilename = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
      
      this.filePreview.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; background: var(--bg-wg-color); width: 100%;">
          <div style="background: rgba(57, 56, 51, 0.21); color: white; padding: 8px; border-radius: 4px; font-size: 16px; min-width: 40px; text-align: center;">
            ${fileIcon}
          </div>
          <div style="flex: 1;">
            <div style="font-weight: bold; font-size: 14px; color: #333;">${shortFilename}</div>
            <div style="font-size: 0.75rem;color: var(--text-wg-color)">${file.type}</div>
            <div style="font-size: 0.75rem; color: var(--text-wg-color); opacity: 0.6;">${this.formatFileSize(file.size)}</div>
          </div>
          <button class="file-wg-preview-remove" type="button" style="background: var(--primary-wg-color); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      `;
      this.filePreview.classList.remove('hidden-wg');
      
      const removeBtn = this.filePreview.querySelector('.file-wg-preview-remove');
      removeBtn.addEventListener('click', () => this.removeFilePreview());
    };
    
    reader.readAsDataURL(file);
  }


  removeFilePreview() {
    this.filePreview.classList.add('hidden-wg');
    this.selectedFile = null;
    this.encodedFile = null;
    this.filePreview.innerHTML = '';
    this.fileInput.value = '';
  
    this.enableMessageInput();
    this.messageInput.value = '';
  }

  

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateStatus(status) {
    if (status === 'typing') {
      this.typingDots.classList.remove('hidden-wg');
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.typingDots.classList.add('hidden-wg');
      }, 5000);
    } else {
      this.typingDots.classList.add('hidden-wg');
    }
  }

  applyTheme(themeName) {
    const themes = {
      'default': {
        '--primary-wg-color': '#7b3fe4',
        '--bg-wg-color': '#ffffff',
        '--text-wg-color': '#000000',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#000000',
        '--bg-wg-right-bubble': '#e5e5ea'
      },
      'dark': {
        '--primary-wg-color': '#2d3748',
        '--bg-wg-color': '#1a202c',
        '--text-wg-color': '#e2e8f0',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#ffffff',
        '--bg-wg-right-bubble': '#4a5568'
      },
      'light': {
        '--primary-wg-color': '#4299e1',
        '--bg-wg-color': '#ffffff',
        '--text-wg-color': '#2d3748',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#000000',
        '--bg-wg-right-bubble': '#edf2f7'
      },
      'purple': {
        '--primary-wg-color': '#6b46c1',
        '--bg-wg-color': '#faf5ff',
        '--text-wg-color': '#2d3748',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#000000',
        '--bg-wg-right-bubble': '#e9d8fd'
      },
      'blue': {
        '--primary-wg-color': '#3182ce',
        '--bg-wg-color': '#ebf8ff',
        '--text-wg-color': '#2d3748',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#000000',
        '--bg-wg-right-bubble': '#bee3f8'
      },
      'pink':{
        '--primary-wg-color': '#d8125b',
        '--bg-wg-color': '#ffffff',
        '--text-wg-color': '#000000',
        '--text-wg-left-bubble': '#ffffff',
        '--text-wg-right-bubble': '#ffffff',
        '--bg-wg-right-bubble': '#2c2e39'
      }
    };

    const theme = themes[themeName] || themes['default'];
    for (const [property, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(property, value);
    }
  }

  positionElements(position) {
    const chatPositions = {
      'top-right': { 
        button: { top: '20px', right: '20px', left: 'auto', bottom: 'auto' },
        window: { top: `${this.config.axisY}px`, right: `${this.config.axisX}px`, left: 'auto', bottom: 'auto' },
        transform: null,
        tooltip: { position: { top:'-5px', right: '60px', bottom:'auto', left:'auto' } }
      },
      'top-middle': { 
        button: { top: '20px', left: '50%', right: 'auto', bottom: 'auto' },
        window: { top: `${this.config.axisY}px`, left: '50%', right: 'auto', bottom: 'auto' },
        transform: 'translateX(-50%)',
        tooltip: { position: { top:'-5px', right: 'auto', bottom:'auto', left:'210px' }, transform: 'translateX(-50%)' }
      },
      'top-left': { 
        button: { top: '20px', left: '20px', right: 'auto', bottom: 'auto' },
        window: { top: `${this.config.axisY}px`, left: `${this.config.axisX}px`, right: 'auto', bottom: 'auto' },
        transform: null,
        tooltip: { position: { top:'-5px', right: '60px', bottom:'auto', left:'60px' } }
      },
      'bottom-right': { 
        button: { bottom: '20px', right: '20px', left: 'auto', top: 'auto' },
        window: { bottom: `${this.config.axisY}px`, right: `${this.config.axisX}px`, left: 'auto', top: 'auto' },
        transform: null,
        tooltip: { position: { top:'auto',right: '60px', bottom:'-4px', left:'auto'} }
      },
      'bottom-middle': { 
        button: { bottom: '20px', left: '50%', right: 'auto', top: 'auto' },
        window: { bottom: `${this.config.axisY}px`, left: '50%', right: 'auto', top: 'auto' },
        transform: 'translateX(-50%)',
        tooltip: { position: { top: 'auto', right: 'auto', bottom: '-4px', left: '1px' }, transform: 'translateX(20%)' }
      },
      'bottom-left': { 
        button: { bottom: '20px', left: '20px', right: 'auto', top: 'auto' },
        window: { bottom: `${this.config.axisY}px`, left: `${this.config.axisX}px`, right: 'auto', top: 'auto' },
        transform: null,
        tooltip: { position: { top:'auto', right: '60px', bottom:'-4px',left: '60px'} }
      }
    };

    const config = chatPositions[position] || chatPositions['bottom-middle'];
    
    // Posicionar botón
    Object.assign(this.chatLauncher.style, config.window);
    this.chatLauncher.style.transform = config.window || '';
    
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
      document.documentElement.style.setProperty('--primary-wg-color', colors.primaryColor);
    }
    if (colors.bgColor) {
      document.documentElement.style.setProperty('--bg-wg-color', colors.bgColor);
    }
    if (colors.textColor) {
      document.documentElement.style.setProperty('--text-wg-color', colors.textColor);
    }
    if (colors.textLeftBubble) {
      document.documentElement.style.setProperty('--text-wg-left-bubble', colors.textLeftBubble);
    }
    if (colors.textRightBubble) {
      document.documentElement.style.setProperty('--text-wg-right-bubble', colors.textRightBubble);
    }
    if (colors.bgRightBubble) {
      document.documentElement.style.setProperty('--bg-wg-right-bubble', colors.bgRightBubble);
    }
  }

  setCompanyInfo({ name, logoUrl }) {
    if (name) {
      this.config.companyName = name;
      this.chatWrapper.querySelector('.chat-wg-header-title').textContent = name;
      this.chatTooltip.querySelector('strong').textContent = name;
    }
    if (logoUrl) {
      this.config.logoUrl = logoUrl;
      this.chatWrapper.querySelector('.chat-wg-header-title img').src = logoUrl;
    }
  }

  setMessages({ welcome, response, tooltip }) {
    if (welcome) {
      this.config.welcomeMessage = welcome;
      this.messagesContainer.querySelector('.chat-wg-bubble.left-wg').textContent = welcome;
    }
    if (response) {
      this.config.responseMessage = response;
    }
    if (tooltip) {
      this.config.tooltipText = tooltip;
      this.chatTooltip.querySelector('.tooltip-wg-content').innerHTML = `
        <strong>${this.config.companyName}</strong><br>
        ${tooltip}
        <span class="close-wg-tooltip">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
        </span>
      `;
    }
  }
  mark(text) {
    // Escapar caracteres HTML
    text = text.replace(/[&<>"']/g, function (match) {
      const escape = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return escape[match];
    });
  
    // Reemplazar combinaciones de negritas e itálicas
    text = text.replace(/\*_([^*]+)_\*/g, '<em><strong>$1</strong></em>');
    text = text.replace(/_\*([^*]+)_\*/g, '<em><strong>$1</strong></em>');
  
    // Reemplazar combinaciones de subrayados y negritas
    text = text.replace(/\*~([^~]+)~\*/g, '<s><strong>$1</strong></s>');
    text = text.replace(/~\*([^~]+)~\*/g, '<s><strong>$1</strong></s>');
  
    // Reemplazar combinaciones de subrayados e itálicas
    text = text.replace(/_~([^~]+)~_/g, '<s><em>$1</em></s>');
    text = text.replace(/~_([^~]+)~_/g, '<s><em>$1</em></s>');
  
    // Reemplazar negritas
    text = text.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  
    // Reemplazar itálicas
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
  
    // Reemplazar tachados
    text = text.replace(/~([^~]+)~/g, '<s>$1</s>');
  
    // Reemplazar formato para monoespaciado: ```
    text = text.replace(/```([^\`]+)```/g, '<code>$1</code>');
  
    // Reemplazar saltos de línea
    text = text.replace(/\\\s/g, '<br>');
  
 
  
    return text;
  }
  destroy() {
    this.closeWebSocket();
    if (this.fetchMessagesInterval) {
    clearInterval(this.fetchMessagesInterval);
    this.fetchMessagesInterval = null;
  }
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    if (this.chatButton) {
      this.chatButton.removeEventListener('click', () => this.openChat());
    }
    
    if (this.chatTooltip) {
      this.chatTooltip.removeEventListener('click', () => this.openChat());
      const closeTooltipBtn = this.chatTooltip.querySelector('.close-wg-tooltip');
      if (closeTooltipBtn) {
        closeTooltipBtn.removeEventListener('click', (e) => {
          e.stopPropagation();
          this.closeTooltip();
        });
      }
    }

    if (this.chatWrapper) {
      const closeBtn = this.chatWrapper.querySelector('#closeChat');
      if (closeBtn) {
        closeBtn.removeEventListener('click', () => this.closeChat());
      }

      const sendBtn = this.chatWrapper.querySelector('#sendMessageBtn');
      if (sendBtn) {
        sendBtn.removeEventListener('click', () => this.sendMessage());
      }
    }

    if (this.messageInput) {
      this.messageInput.removeEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (this.fileInput) {
      this.fileInput.removeEventListener('change', () => this.handleFileUpload());
    }

    if (this.messagesContainer) {
      this.messagesContainer.removeEventListener('scroll', () => {
        const atBottom = this.messagesContainer.scrollTop + this.messagesContainer.clientHeight >= 
                        this.messagesContainer.scrollHeight - 20;
        this.scrollBtn.className = atBottom ? 'hidden-wg' : 'scroll-wg-bottom-btn';
      });
    }

    if (this.scrollBtn) {
      this.scrollBtn.removeEventListener('click', () => this.scrollToBottom());
    }

    if (this.chatLauncher && this.chatLauncher.parentNode) {
      this.chatLauncher.parentNode.removeChild(this.chatLauncher);
    }
    
    if (this.chatWrapper && this.chatWrapper.parentNode) {
      this.chatWrapper.parentNode.removeChild(this.chatWrapper);
    }

    const styleElement = document.getElementById('chat-widget-styles');
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }

    this.chatLauncher = null;
    this.chatButton = null;
    this.chatTooltip = null;
    this.chatWrapper = null;
    this.messagesContainer = null;
    this.messageInput = null;
    this.scrollBtn = null;
    this.fileInput = null;
    this.typingDots = null;
    this.config = null;

    if (typeof window !== 'undefined' && window.chatWidget === this) {
      window.chatWidget = null;
    }
  }
}
if (typeof window !== 'undefined') {
  window.ChatWidget = this;
}

