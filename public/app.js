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

// --- ESTADO LOCAL ---
let participantesCache = {}; 
let scoresCache = [];
let previousTop3String = "";

function calcularYRenderizar() {
  // 1. Agrupar votos por Participante
  let grupos = {};

  Object.values(participantesCache).forEach(p => {
    grupos[p.id] = {
      id: p.id,
      nombre: p.nombre,
      tipoBaile: p.tipoBaile,
      votos: [],
      total: 0
    };
  });

  // Llenar votos
  scoresCache.forEach(score => {
    if (grupos[score.participantId]) {
      grupos[score.participantId].votos.push(score);
    }
  });

  // 2. Procesar grupos
  let listaFinal = Object.values(grupos).map(grupo => {
    grupo.total = grupo.votos.reduce((sum, v) => sum + v.totalFinal, 0);

    // SECUENCIALIDAD: "Juez 1", "Juez 2"...
    // Asigna el número según el orden en que llegaron al array
    grupo.votosFormateados = grupo.votos.map((voto, index) => ({
      etiqueta: `Juez ${index + 1}`,
      valor: voto.totalFinal
    }));

    return grupo;
  });

  // 3. Ordenar
  // Animación Flash al cambiar el Top 3
  const currentTop3Ids = listaFinal.slice(0, 3).map(p => p.id);
  const currentTop3String = JSON.stringify(currentTop3Ids);
  if (previousTop3String !== "" && previousTop3String !== currentTop3String && listaFinal.length > 0) {
      cardsContainer.classList.add('animate-update');
      setTimeout(() => cardsContainer.classList.remove('animate-update'), 1200);
  }
  previousTop3String = currentTop3String;

  // 4. Renderizar HTML
  cardsContainer.innerHTML = "";
  
  if (listaFinal.length === 0) {
    cardsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: white; padding: 20px;">Esperando comparsas...</div>`;
    return;
  }

  listaFinal.forEach((p, index) => {
    let rankClass = index === 0 ? "rank-1" : index === 1 ? "rank-2" : index === 2 ? "rank-3" : "";

    // GENERAR HTML DEL GRÁFICO VERTICAL
    let graficoHtml = "";
    if (p.votosFormateados.length > 0) {
      graficoHtml = `<div class="chart-container-vertical">`;
      p.votosFormateados.forEach(v => {
        // Cálculo del porcentaje (altura)
        // Ajusta el denominador (10 o 100) según tu escala de notas
        let porcentaje = Math.min((v.valor / 10) * 100, 100);
        if(v.valor > 10) porcentaje = Math.min((v.valor / 100) * 100, 100);

        graficoHtml += `
          <div class="chart-column">
            <div class="chart-value-vertical">${v.valor}</div>
            <div class="chart-bar-bg-vertical">
              <div class="chart-bar-fill-vertical" style="height: ${porcentaje}%;"></div>
            </div>
            <div class="chart-label-vertical">${v.etiqueta}</div>
          </div>
        `;
      });
      graficoHtml += `</div>`;
    } else {
      graficoHtml = `<div style="color:#999; font-size:0.8em; margin:15px 0; min-height:150px; display:flex; align-items:center; justify-content:center;">Esperando inicio de votación...</div>`;
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

// --- LISTENERS ---

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