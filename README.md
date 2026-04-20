# 🥁 Bateria Invisível

Um projeto interativo construído com React e TypeScript que transforma sua webcam em uma bateria tocável no ar. Sem necessidade de hardware caro ou sensores Bluetooth: apenas a câmera do seu computador, duas baquetas e um pouco de massa de modelar colorida.

## ✨ Características

* **Rastreamento de Cores em Tempo Real:** Utiliza matemática pura (conversão de RGB para HSL) e a API do Canvas (HTML5) para rastrear as pontas das baquetas a 60 FPS.
* **Áudio de Baixíssima Latência:** Implementado com a **Web Audio API** nativa. Os samples de áudio são decodificados diretamente na memória RAM, garantindo que o som dispare no exato milissegundo da colisão.
* **Totalmente Client-Side:** Todo o processamento de imagem e áudio acontece localmente no seu navegador. Nenhuma imagem é enviada para servidores externos.

## 🛠️ Tecnologias Utilizadas

* [React](https://reactjs.org/)
* [TypeScript](https://www.typescriptlang.org/)
* [Vite](https://vitejs.dev/)
* HTML5 Canvas API
* Web Audio API nativa

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos
* **Node.js** (versão 16 ou superior)
* Uma webcam funcional
* Duas baquetas (ou canetas/gravetos) com as pontas coloridas (recomendado: massa de modelar ou fita isolante **Verde** na esquerda e **Vermelha** na direita).

### Customização e Calibragem

* Se você quiser usar fitas ou massas de outras cores, basta alterar a constante TARGET_COLORS no arquivo src/App.tsx. Você pode ajustar o hueRange (Matiz) para encontrar qualquer cor do arco-íris:

const TARGET_COLORS = [
  { 
    id: 'minhaCor', 
    name: 'Baqueta Azul', 
    hueRange: [200, 240], // Faixa do azul
    satRange: [60, 100],  
    lightRange: [30, 80],  
    debugColor: '#0000ff' 
  }
];

---

Desenvolvido por: Alexandre Lopes (GitHub: @alexlbnt)