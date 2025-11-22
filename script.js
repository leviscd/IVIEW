// --- CONFIGURAÇÕES E DADOS MOCKADOS ---
const CATEGORIES = [
    { name: 'Esporte', icon: 'fa-futbol', focusArea: 'sidebar', index: 0 },
    { name: 'TV Aberta', icon: 'fa-tv', focusArea: 'sidebar', index: 1 },
    { name: 'Entretenimento', icon: 'fa-ticket-alt', focusArea: 'sidebar', index: 2 },
    { name: 'Infantil', icon: 'fa-child', focusArea: 'sidebar', index: 3 },
    { name: 'Filmes', icon: 'fa-film', focusArea: 'sidebar', index: 4 },
];

const CHANNELS_MOCK = [
    {
        id: '1',
        name: 'Record TV',
        category: 'TV Aberta',
        description: 'Jornalismo e Entretenimento Nacional',
        streamUrl:
            'https://d1muf25xa11so8hp23.s27-usa-cloudfront-net.online/token/4bd1630030a7e3ed90151baff41b00e8/record.m3u8',
    },
    // Mock de outros canais
    ...Array.from({ length: 19 }, (_, i) => ({
        id: String(i + 2),
        name: `Canal iTv ${i + 2}`,
        category: i < 5 ? 'TV Aberta' : i < 10 ? 'Esporte' : 'Entretenimento',
        description: `Conteúdo Premium ao Vivo ${i + 2}`,
        streamUrl: `https://mock.stream/id/${i + 2}.m3u8`,
    })),
    {
        id: '22',
        name: 'Desenho Feliz',
        category: 'Infantil',
        description: 'Animações Clássicas',
        streamUrl: `https://mock.stream/id/22.m3u8`,
    },
    {
        id: '23',
        name: 'Filmes Ação 4K',
        category: 'Filmes',
        description: 'Lançamento Exclusivo',
        streamUrl: `https://mock.stream/id/23.m3u8`,
    },
];

const NUM_COLUMNS = 4;
let focusedElement = { area: 'sidebar', index: 1 }; // Começa em TV Aberta
let selectedCategory = CATEGORIES[1].name;
let filteredChannels = [];
let isPlaying = false;
let playerSimulations = {}; // Armazena timers do player

// --- ELEMENTOS DOM ---
const appContainer = document.getElementById('app-container');
const playerScreen = document.getElementById('player-screen');
const mainInterface = document.getElementById('main-interface');
const categoriesList = document.getElementById('categories-list');
const channelGrid = document.getElementById('channel-grid');
const categoryTitle = document.getElementById('category-title');
const noChannelsDiv = document.getElementById('no-channels');

// --- FUNÇÕES DE RENDERIZAÇÃO ---

/**
 * Atualiza o array de canais filtrados e recarrega a grade.
 */
function updateChannelGrid() {
    // 1. Filtra os canais
    filteredChannels = CHANNELS_MOCK.filter(c => c.category === selectedCategory);
    
    // 2. Limpa a grade e o título
    channelGrid.innerHTML = '';
    categoryTitle.textContent = `${selectedCategory.toUpperCase()} AO VIVO`;

    // 3. Renderiza os canais
    if (filteredChannels.length === 0) {
        noChannelsDiv.classList.remove('hidden');
        return;
    }

    noChannelsDiv.classList.add('hidden');
    
    filteredChannels.forEach((channel, index) => {
        const card = document.createElement('div');
        card.className = 'channel-card focusable';
        card.dataset.focusArea = 'grid';
        card.dataset.index = index;

        card.innerHTML = `
            <div class="channel-image-placeholder">
                <i class="fas fa-tv"></i>
                <span>${channel.name}</span>
            </div>
            <div class="channel-info">
                <div class="channel-name">${channel.name}</div>
                <div class="channel-description">${channel.description}</div>
            </div>
        `;
        // Adiciona listener para cliques (mouse/touch)
        card.addEventListener('click', () => {
            // Se clicado, foca nele e simula o Enter
            focusedElement = { area: 'grid', index: index };
            updateFocus();
            handleRemotePress('Enter');
        });
        channelGrid.appendChild(card);
    });
}

/**
 * Renderiza a lista de categorias e atribui classes 'selected' e 'focused'.
 */
function renderCategories() {
    categoriesList.innerHTML = '';
    CATEGORIES.forEach((cat) => {
        const link = document.createElement('a');
        link.href = '#';
        link.className = `category-item focusable`;
        link.dataset.focusArea = cat.focusArea;
        link.dataset.index = cat.index;
        
        link.innerHTML = `
            <i class="fas ${cat.icon}"></i>
            <span>${cat.name}</span>
        `;
        
        // Adiciona listener para cliques
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Se clicado, foca nele e simula o Enter
            focusedElement = { area: cat.focusArea, index: cat.index };
            updateFocus();
            handleRemotePress('Enter');
        });

        categoriesList.appendChild(link);
    });
}

// --- FUNÇÕES DE FOCO E NAVEGAÇÃO ---

/**
 * Remove o foco de todos os elementos e aplica o foco ao elemento atual.
 */
function updateFocus() {
    // 1. Remove foco de todos os elementos
    document.querySelectorAll('.focused').forEach(el => {
        el.classList.remove('focused');
        el.classList.remove('selected');
    });

    // 2. Aplica a classe 'selected' na categoria atual
    document.querySelectorAll('.category-item').forEach(el => {
        const catName = el.querySelector('span').textContent;
        if (catName === selectedCategory) {
            el.classList.add('selected');
        }
    });

    // 3. Aplica o foco ao elemento atual
    const selector = `.focusable[data-focus-area="${focusedElement.area}"][data-index="${focusedElement.index}"]`;
    const newFocusEl = document.querySelector(selector);
    
    if (newFocusEl) {
        newFocusEl.classList.add('focused');
        
        // 4. Garante que o elemento esteja visível (Scroll)
        if (focusedElement.area === 'grid') {
            const gridContainer = document.getElementById('content-area');
            const rect = newFocusEl.getBoundingClientRect();
            const containerRect = gridContainer.getBoundingClientRect();

            // Rola apenas se o elemento estiver fora do viewport do contêiner
            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
                // Calcula a posição de scroll desejada
                const scrollPosition = newFocusEl.offsetTop - gridContainer.offsetTop - 50;
                gridContainer.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                });
            }
        } else if (focusedElement.area === 'sidebar') {
            newFocusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

/**
 * Lógica principal de navegação por teclado (D-Pad).
 */
function handleRemotePress(key) {
    if (isPlaying) {
        if (key === 'Enter' || key === 'ArrowLeft') {
            stopPlayer();
        }
        return;
    }

    let { area, index } = focusedElement;
    let newIndex = index;
    let transition = false; // Indica se houve mudança de área ou índice

    if (area === 'sidebar') {
        if (key === 'ArrowDown') {
            newIndex = Math.min(index + 1, CATEGORIES.length - 1);
            transition = newIndex !== index;
        } else if (key === 'ArrowUp') {
            newIndex = Math.max(index - 1, 0);
            transition = newIndex !== index;
        } else if (key === 'ArrowRight') {
            if (filteredChannels.length > 0) {
                focusedElement = { area: 'grid', index: 0 };
                updateFocus();
                return;
            }
        } else if (key === 'Enter') {
            // A seleção de categoria já ocorre no ArrowUp/Down, mas o Enter confirma a mudança
            // de foco para a grade, se houver canais.
            if (filteredChannels.length > 0) {
                 focusedElement = { area: 'grid', index: 0 };
                 updateFocus();
                 return;
            }
        }

        if (transition) {
            // Animação CSS na troca de categoria
            appContainer.style.opacity = 0.5;
            setTimeout(() => {
                selectedCategory = CATEGORIES[newIndex].name;
                updateChannelGrid();
                focusedElement = { area: 'sidebar', index: newIndex };
                updateFocus();
                appContainer.style.opacity = 1;
            }, 100); 
            return;
        }
    } else if (area === 'grid') {
        const totalItems = filteredChannels.length;
        if (totalItems === 0) {
            focusedElement = { area: 'sidebar', index: CATEGORIES.findIndex(c => c.name === selectedCategory) };
            updateFocus();
            return;
        }

        if (key === 'ArrowDown') {
            newIndex = Math.min(index + NUM_COLUMNS, totalItems - 1);
        } else if (key === 'ArrowUp') {
            newIndex = Math.max(index - NUM_COLUMNS, 0);
        } else if (key === 'ArrowRight') {
            if ((index + 1) % NUM_COLUMNS !== 0 && index < totalItems - 1) {
                newIndex = index + 1;
            }
        } else if (key === 'ArrowLeft') {
            if (index % NUM_COLUMNS !== 0) {
                newIndex = index - 1;
            } else {
                // Volta para a sidebar
                focusedElement = { area: 'sidebar', index: CATEGORIES.findIndex(c => c.name === selectedCategory) };
                updateFocus();
                return;
            }
        } else if (key === 'Enter') {
            startPlayer(filteredChannels[index]);
            return;
        }

        if (newIndex !== index) {
            focusedElement = { area: 'grid', index: newIndex };
            updateFocus();
        }
    }
    
    // Atualiza o foco após qualquer navegação na sidebar
    if (area === 'sidebar') {
        focusedElement = { area: 'sidebar', index: newIndex };
        updateFocus();
    }
}

// --- LÓGICA DO PLAYER SIMULADO ---

function startPlayer(channel) {
    isPlaying = true;
    mainInterface.classList.add('hidden');
    playerScreen.classList.remove('hidden');

    // Limpa timers antigos
    Object.values(playerSimulations).forEach(clearTimeout);
    playerScreen.innerHTML = '';
    
    // Inicia a tela de carregamento
    showLoadingScreen(channel);
}

function showLoadingScreen(channel) {
    let progress = 0;
    let ping = 85;
    const maxProgress = 100;
    
    playerScreen.innerHTML = `
        <div class="loading-screen">
            <span class="ping-display">PING: <span id="ping-value" style="color: var(--success);">85 ms</span></span>
            <div style="margin-top: -100px;"><i class="fas fa-satellite-dish" style="font-size: 80px; color: var(--violet-glow); animation: pulse 1s infinite alternate;"></i></div>
            <p class="loading-text" id="loading-text">CARREGANDO: 0%</p>
            <div class="progress-bar-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <p class="hint-text">Aguarde a estabilização da conexão...</p>
        </div>
    `;
    
    // Referências DOM da tela de loading
    const pingValueEl = document.getElementById('ping-value');
    const loadingTextEl = document.getElementById('loading-text');
    const progressBarEl = document.getElementById('progress-bar');
    
    // Simulação de Progresso e Ping
    playerSimulations.interval = setInterval(() => {
        // Simulação do ping (rede)
        ping = Math.max(50, Math.floor(Math.random() * 150));
        pingValueEl.textContent = `${ping} ms`;
        pingValueEl.style.color = ping < 100 ? 'var(--success)' : 'var(--alert)';

        // Simulação do progresso
        if (progress < maxProgress) {
            progress += 5;
            loadingTextEl.textContent = `CARREGANDO: ${progress}%`;
            progressBarEl.style.width = `${progress}%`;
        }
    }, 200);

    // Transição para o Player
    playerSimulations.timeout = setTimeout(() => {
        clearInterval(playerSimulations.interval);
        loadingTextEl.textContent = 'CARREGADO COM SUCESSO!';
        
        // Simulação de transição
        setTimeout(() => {
             showVideoPlayer(channel);
        }, 1000);

    }, 4500); // 4.5 segundos para o carregamento completo
}

function showVideoPlayer(channel) {
    playerScreen.innerHTML = `
        <div id="video-player" style="background-color: black; display: flex; justify-content: center; align-items: center; font-size: 30px; color: var(--violet);">
            REPRODUZINDO ${channel.name} (Link: ${channel.streamUrl})
        </div>
        <div class="video-overlay">
            <p class="overlay-text">${channel.name} | AO VIVO</p>
            <p class="overlay-hint">Pressione ENTER/Esquerda para sair.</p>
            <p class="overlay-no-pause">[Controle de Pausa Desativado]</p>
        </div>
    `;
}

function stopPlayer() {
    isPlaying = false;
    // Limpa todos os timers de simulação
    Object.values(playerSimulations).forEach(clearTimeout);
    playerScreen.classList.add('hidden');
    mainInterface.classList.remove('hidden');
    updateFocus(); // Retorna o foco para o item da grade
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Renderiza a estrutura inicial
    renderCategories();
    updateChannelGrid();
    
    // Aplica o foco inicial
    focusedElement = { area: 'sidebar', index: 1 };
    updateFocus();
    
    // Evento para capturar teclas (para PC/Web)
    document.addEventListener('keydown', (e) => {
        let keyMap = {
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight',
            'Enter': 'Enter',
        };
        if (keyMap[e.key]) {
            e.preventDefault();
            handleRemotePress(keyMap[e.key]);
        }
    });

    // Função de seleção de categoria em tempo real ao navegar na sidebar
    // Isso é necessário porque o keydown é o que move o foco
    const categoryEls = document.querySelectorAll('.category-item');
    categoryEls.forEach(el => {
        el.addEventListener('mouseenter', () => {
             if (!isPlaying && focusedElement.area !== 'grid') {
                const newIndex = parseInt(el.dataset.index);
                if (newIndex !== focusedElement.index) {
                    // Simula o movimento do D-Pad (mesma lógica)
                    handleRemotePress('ArrowDown'); // Ou qualquer tecla que force a atualização de foco/seleção
                }
             }
        });
    });
});
