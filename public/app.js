import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCv4s9MY2LusJsNHFMZeTGrbEnYxLcMlNQ",
  authDomain: "votacionesevento.firebaseapp.com",
  projectId: "votacionesevento",
  storageBucket: "votacionesevento.firebasestorage.app",
  messagingSenderId: "811437774346",
  appId: "1:811437774346:web:201f29d00468e12e4971f3",
  measurementId: "G-CCGHNMLGV7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const eventId = "2025";

const cardsContainer = document.getElementById('cards-container');

// Referencias al Modal
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.querySelector('.close-modal');
const modalGroupName = document.getElementById('modal-group-name');
const modalScore = document.getElementById('modal-score');

// Manejo del Modal (Cerrar)
closeModalBtn.onclick = () => modalOverlay.classList.add('hidden');
modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); };

// --- ESTADO LOCAL ---
let participantesCache = {}; 
let scoresCache = [];
let totalJueces = 0; // Se actualiza dinámicamente desde Firebase
let completedGroupsShown = new Set(); // Para no repetir el popup si ya se mostró

function calcularYRenderizar() {
  // 1. Agrupar votos por Participante
  let grupos = {};

  // Inicializar grupos con la info de participantes
  Object.values(participantesCache).forEach(p => {
    grupos[p.id] = {
      id: p.id,
      nombre: p.nombre,
      tipoBaile: p.tipoBaile,
      votos: [], // Aquí guardaremos los objetos score
      total: 0
    };
  });

  // Llenar votos
  scoresCache.forEach(score => {
    if (grupos[score.participantId]) {
      grupos[score.participantId].votos.push(score);
    }
  });

  // 2. Procesar cada grupo para generar la lista final
  let listaFinal = Object.values(grupos).map(grupo => {
    // Calcular Total
    grupo.total = grupo.votos.reduce((sum, v) => sum + v.totalFinal, 0);

    // SECUENCIALIDAD: "Juez 1", "Juez 2"... basado en el orden de llegada
    // (Asumimos que el array se llena en orden de llegada desde Firebase)
    grupo.votosFormateados = grupo.votos.map((voto, index) => ({
      etiqueta: `Juez ${index + 1}`,
      valor: voto.totalFinal
    }));

    // --- LÓGICA DEL POPUP ---
    // Si tenemos jueces definidos (>0) y la cantidad de votos es igual al total de jueces...
    if (totalJueces > 0 && grupo.votos.length === totalJueces) {
      // Y si no hemos mostrado este popup antes...
      if (!completedGroupsShown.has(grupo.id)) {
        mostrarModal(grupo.nombre, grupo.total);
        completedGroupsShown.add(grupo.id); // Marcamos para no repetir
      }
    }

    return grupo;
  });

  // 3. Ordenar por puntaje (Mayor a Menor)
  listaFinal.sort((a, b) => b.total - a.total);

  // 4. Renderizar HTML
  cardsContainer.innerHTML = "";
  
  if (listaFinal.length === 0) {
    cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 20px;">Esperando comparsas...</div>`;
    return;
  }

  listaFinal.forEach((p, index) => {
    let rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "";

    // Generar HTML del Gráfico de Barras Horizontal
    let graficoHtml = "";
    if (p.votosFormateados.length > 0) {
      graficoHtml = `<div class="chart-container">`;
      p.votosFormateados.forEach(v => {
        // Cálculo del ancho de la barra (sobre 10 o 100)
        let porcentaje = Math.min((v.valor / 10) * 100, 100);
        if(v.valor > 10) porcentaje = Math.min((v.valor / 100) * 100, 100);

        graficoHtml += `
          <div class="chart-row">
            <div class="chart-label">${v.etiqueta}</div>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width: ${porcentaje}%;"></div>
            </div>
            <div class="chart-value">${v.valor}</div>
          </div>
        `;
      });
      graficoHtml += `</div>`;
    } else {
      graficoHtml = `<div style="color:#999; font-size:0.8em; margin:15px 0;">Esperando inicio de votación...</div>`;
    }

    const card = document.createElement("div");
    card.className = `card ${rankClass}`;
    
    card.innerHTML = `
      <div class="card-title">${p.nombre}</div>
      <div class="dance-type">🎭 ${p.tipoBaile}</div>
      
      ${graficoHtml}

      <div class="total-label">Puntaje Total</div>
      <div class="total-number">${p.total.toFixed(2)}</div>
    `;
    
    cardsContainer.appendChild(card);
  });
}

// Función para mostrar el Popup
function mostrarModal(nombre, puntaje) {
  modalGroupName.innerText = nombre;
  modalScore.innerText = puntaje.toFixed(2);
  modalOverlay.classList.remove('hidden');
}

// --- LISTENERS ---

// 1. Contar Jueces (Vital para saber cuándo mostrar el popup)
onSnapshot(collection(db, `events/${eventId}/judges`), (snap) => {
  totalJueces = snap.size;
  calcularYRenderizar();
});

// 2. Participantes
onSnapshot(collection(db, `events/${eventId}/participants`), (snap) => {
  participantesCache = {}; 
  snap.forEach(doc => {
    const data = doc.data();
    participantesCache[doc.id] = { 
      id: doc.id, 
      nombre: data.nombre || data.participantNombre || "Sin nombre",
      tipoBaile: data.tipoBaile || data.danceType || "Danza" 
    };
  });
  calcularYRenderizar();
});

// 3. Puntajes
onSnapshot(collection(db, `events/${eventId}/scores`), (snap) => {
  scoresCache = []; 
  snap.forEach(doc => { scoresCache.push(doc.data()); });
  calcularYRenderizar();
});

// Nieve
function createSnowflakes() {
    const snowContainer = document.getElementById('snow-container');
    if (!snowContainer) return;
    for (let i = 0; i < 50; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + 'vw';
        snowflake.style.animationDuration = Math.random() * 3 + 2 + 's'; 
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
        snowContainer.appendChild(snowflake);
    }
}
createSnowflakes();