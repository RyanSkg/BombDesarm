// Jogo Desarme a Bomba — versão web do JogoDeDesarmarBomba em C#.
// A organização segue as mesmas classes do console: Bomba, Jogo e Tela.

// ======================================================================
// CONFIGURAÇÕES
// ======================================================================

// Regras de cada dificuldade (igual às constantes do Program.cs, só que para vários níveis).
const NIVEIS = {
  facil: { nome: "Fácil", digitos: 3, tempo: 60, tentativas: 8, penalidade: 0 },
  medio: { nome: "Médio", digitos: 4, tempo: 60, tentativas: 6, penalidade: 0 },
  dificil: { nome: "Difícil", digitos: 5, tempo: 75, tentativas: 6, penalidade: 5 }
};

// Quantos segundos a dica custa.
const CUSTO_DA_DICA = 10;

// A partir de quantos segundos a bomba entra em "modo perigo".
const TEMPO_DE_PERIGO = 10;

// Chaves usadas para salvar dados no navegador.
const CHAVE_RECORDES = "bomba-recordes";
const CHAVE_SOM = "bomba-som";

// ======================================================================
// CLASSE BOMBA — guarda o código secreto e gera as dicas
// ======================================================================

class Bomba {
  // Método construtor: roda quando criamos uma nova bomba.
  constructor(quantidadeDigitos) {
    // Gera e guarda o código secreto.
    this.codigo = this.gerarCodigo(quantidadeDigitos);

    // Começa armada.
    this.desarmada = false;
  }

  // Retorna a quantidade de dígitos do código.
  get digitos() {
    return this.codigo.length;
  }

  // Gera um código aleatório com a quantidade de dígitos pedida.
  gerarCodigo(quantidadeDigitos) {
    let codigo = "";

    // Sorteia um número de 0 a 9 para cada posição.
    for (let i = 0; i < quantidadeDigitos; i++) {
      codigo += Math.floor(Math.random() * 10);
    }

    return codigo;
  }

  // Recebe a tentativa do jogador e devolve um objeto com o resultado.
  tentarDesarmar(tentativa) {
    // Se acertou tudo, a bomba é desarmada.
    if (tentativa === this.codigo) {
      this.desarmada = true;
      return { acertou: true, certos: this.digitos, quase: 0 };
    }

    // Se errou, calcula a dica.
    return this.gerarDica(tentativa);
  }

  // Mesma lógica do GerarDica do C#: conta dígitos no lugar certo e no lugar errado.
  gerarDica(tentativa) {
    let certos = 0;
    let quase = 0;

    // Guarda quantas vezes cada dígito (0 a 9) ainda pode contar como "lugar errado".
    const digitosDisponiveis = new Array(10).fill(0);

    // Primeiro laço: acertos exatos.
    for (let i = 0; i < this.codigo.length; i++) {
      if (tentativa[i] === this.codigo[i]) {
        certos++;
      } else {
        digitosDisponiveis[Number(this.codigo[i])]++;
      }
    }

    // Segundo laço: dígitos que existem, mas em outra posição.
    for (let i = 0; i < tentativa.length; i++) {
      // Pula as posições que já foram acerto exato.
      if (tentativa[i] === this.codigo[i]) {
        continue;
      }

      const digitoTentado = Number(tentativa[i]);

      // Só conta se ainda houver esse dígito disponível (evita contar repetido a mais).
      if (digitosDisponiveis[digitoTentado] > 0) {
        quase++;
        digitosDisponiveis[digitoTentado]--;
      }
    }

    return { acertou: false, certos, quase };
  }

  // Escolhe uma posição ainda não revelada e devolve ela junto com o dígito.
  revelarDigito(posicoesTravadas) {
    // Monta a lista de posições que ainda podem ser reveladas.
    const livres = [];

    for (let i = 0; i < this.digitos; i++) {
      if (!posicoesTravadas[i]) {
        livres.push(i);
      }
    }

    // Se não sobrou nenhuma, não há o que revelar.
    if (livres.length === 0) {
      return null;
    }

    // Sorteia uma das posições livres.
    const posicao = livres[Math.floor(Math.random() * livres.length)];

    return { posicao, digito: this.codigo[posicao] };
  }
}

// ======================================================================
// SOM — pequenos bipes feitos pelo próprio navegador (Web Audio API)
// ======================================================================

const Som = {
  contexto: null,
  ligado: lerDoNavegador(CHAVE_SOM, true),

  // O navegador só deixa tocar som depois de um clique do jogador, então criamos aqui.
  preparar() {
    if (!this.contexto) {
      this.contexto = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  // Toca um bipe simples com frequência e duração escolhidas.
  bip(frequencia, duracao = 0.08, tipo = "square", volume = 0.05) {
    if (!this.ligado || !this.contexto) {
      return;
    }

    const agora = this.contexto.currentTime;
    const oscilador = this.contexto.createOscillator();
    const ganho = this.contexto.createGain();

    oscilador.type = tipo;
    oscilador.frequency.value = frequencia;

    // O volume diminui até zero para o som não "estalar" no final.
    ganho.gain.setValueAtTime(volume, agora);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);

    oscilador.connect(ganho).connect(this.contexto.destination);
    oscilador.start(agora);
    oscilador.stop(agora + duracao);
  },

  // Bipe do relógio; fica mais agudo no modo perigo.
  tique(perigo) {
    this.bip(perigo ? 1400 : 900, 0.06);
  },

  tecla() {
    this.bip(600, 0.03, "triangle", 0.04);
  },

  erro() {
    this.bip(180, 0.25, "sawtooth", 0.06);
  },

  // Três notas subindo.
  vitoria() {
    [523, 659, 784, 1047].forEach((nota, i) => {
      setTimeout(() => this.bip(nota, 0.18, "triangle", 0.08), i * 120);
    });
  },

  // Explosão: ruído aleatório que vai sumindo.
  explosao() {
    if (!this.ligado || !this.contexto) {
      return;
    }

    const duracao = 1.4;
    const tamanho = this.contexto.sampleRate * duracao;
    const buffer = this.contexto.createBuffer(1, tamanho, this.contexto.sampleRate);
    const dados = buffer.getChannelData(0);

    // Preenche o som com valores aleatórios que diminuem com o tempo.
    for (let i = 0; i < tamanho; i++) {
      dados[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / tamanho, 2);
    }

    const fonte = this.contexto.createBufferSource();
    const filtro = this.contexto.createBiquadFilter();
    const ganho = this.contexto.createGain();

    // Filtro passa-baixa deixa o som mais "grave", parecido com estrondo.
    filtro.type = "lowpass";
    filtro.frequency.value = 900;
    ganho.gain.value = 0.5;

    fonte.buffer = buffer;
    fonte.connect(filtro).connect(ganho).connect(this.contexto.destination);
    fonte.start();
  }
};

// ======================================================================
// CLASSE JOGO — controla a partida (tempo, tentativas, digitação)
// ======================================================================

class Jogo {
  constructor(configuracao) {
    this.configuracao = configuracao;
    this.bomba = new Bomba(configuracao.digitos);
    this.maxTentativas = configuracao.tentativas;
    this.tempoInicial = configuracao.tempo;
    this.tempoRestante = configuracao.tempo;
    this.tentativasUsadas = 0;
    this.dicaUsada = false;
    this.terminou = false;

    // A tentativa é uma lista de casas; null significa casa vazia.
    this.tentativa = new Array(this.bomba.digitos).fill(null);

    // Casas travadas são as que a dica revelou.
    this.travadas = new Array(this.bomba.digitos).fill(false);

    this.intervalo = null;
  }

  // Começa a contagem regressiva.
  iniciar() {
    Tela.mostrarJogo(this);

    // A cada 1 segundo, tira um segundo do relógio.
    this.intervalo = setInterval(() => this.passarUmSegundo(), 1000);
  }

  passarUmSegundo() {
    this.tempoRestante--;
    Som.tique(this.tempoRestante <= TEMPO_DE_PERIGO);
    this.verificarTempo();
    Tela.atualizarTempo(this);
  }

  // Se o tempo chegou a zero, a bomba explode.
  verificarTempo() {
    if (this.tempoRestante <= 0) {
      this.tempoRestante = 0;
      this.finalizar(false, "tempo");
    }
  }

  // Coloca um dígito na primeira casa livre (que não esteja travada).
  digitar(digito) {
    if (this.terminou) {
      return;
    }

    const posicao = this.tentativa.findIndex((valor, i) => valor === null && !this.travadas[i]);

    // Se todas as casas estão cheias, ignora a tecla.
    if (posicao === -1) {
      return;
    }

    this.tentativa[posicao] = digito;
    Som.tecla();
    Tela.atualizarCasas(this);
  }

  // Apaga o último dígito digitado (sem apagar os revelados pela dica).
  apagar() {
    if (this.terminou) {
      return;
    }

    for (let i = this.tentativa.length - 1; i >= 0; i--) {
      if (this.tentativa[i] !== null && !this.travadas[i]) {
        this.tentativa[i] = null;
        Som.tecla();
        Tela.atualizarCasas(this);
        return;
      }
    }
  }

  // Envia a tentativa para a bomba (equivale ao TentarDesarmar do C#).
  confirmar() {
    if (this.terminou) {
      return;
    }

    // Não deixa confirmar com casas vazias, e não gasta tentativa.
    if (this.tentativa.includes(null)) {
      Tela.mostrarMensagem(`Digite ${this.bomba.digitos} dígitos antes de confirmar.`, "aviso");
      return;
    }

    const texto = this.tentativa.join("");
    this.tentativasUsadas++;

    const resultado = this.bomba.tentarDesarmar(texto);
    Tela.adicionarAoHistorico(texto, resultado, this.bomba.digitos);

    // Acertou: vitória!
    if (resultado.acertou) {
      this.finalizar(true);
      return;
    }

    // Errou: som de erro, balança as casas e mostra a dica.
    Som.erro();
    Tela.balancarCasas();

    // Acabaram as tentativas: explode.
    if (this.tentativasUsadas >= this.maxTentativas) {
      this.finalizar(false, "tentativas");
      return;
    }

    // No difícil, cada erro tira segundos do relógio.
    let textoPenalidade = "";

    if (this.configuracao.penalidade > 0) {
      this.tempoRestante -= this.configuracao.penalidade;
      textoPenalidade = ` (-${this.configuracao.penalidade}s)`;
    }

    if (resultado.certos === 0 && resultado.quase === 0) {
      Tela.mostrarMensagem(`Nenhum dígito está correto.${textoPenalidade}`, "erro");
    } else {
      Tela.mostrarMensagem(
        `Lugar certo: ${resultado.certos} | Lugar errado: ${resultado.quase}${textoPenalidade}`,
        "erro"
      );
    }

    // Limpa as casas que não estão travadas para a próxima tentativa.
    this.tentativa = this.tentativa.map((valor, i) => (this.travadas[i] ? valor : null));

    Tela.atualizarCasas(this);
    Tela.atualizarTentativas(this);
    Tela.atualizarTempo(this);
    this.verificarTempo();
  }

  // Revela um dígito do código, custando segundos. Só pode uma vez por partida.
  usarDica() {
    if (this.terminou || this.dicaUsada) {
      return;
    }

    const revelado = this.bomba.revelarDigito(this.travadas);

    if (!revelado) {
      return;
    }

    this.dicaUsada = true;
    this.travadas[revelado.posicao] = true;
    this.tentativa[revelado.posicao] = revelado.digito;
    this.tempoRestante -= CUSTO_DA_DICA;

    Som.bip(1200, 0.15, "sine", 0.08);
    Tela.mostrarMensagem(
      `Dica: a posição ${revelado.posicao + 1} é o número ${revelado.digito}. (-${CUSTO_DA_DICA}s)`,
      "aviso"
    );
    Tela.atualizarCasas(this);
    Tela.atualizarBotaoDica(this);
    Tela.atualizarTempo(this);
    this.verificarTempo();
  }

  // Termina a partida, para o relógio e mostra o resultado.
  finalizar(venceu, motivo) {
    if (this.terminou) {
      return;
    }

    this.terminou = true;
    clearInterval(this.intervalo);

    const tempoGasto = this.tempoInicial - this.tempoRestante;
    let novoRecorde = false;

    if (venceu) {
      Som.vitoria();
      novoRecorde = salvarRecorde(this.configuracao.id, tempoGasto);
    } else {
      Som.explosao();
      Tela.explodir();
    }

    // Pequena espera para dar tempo da animação/som acontecer.
    setTimeout(() => {
      Tela.mostrarResultado({
        venceu,
        motivo,
        codigo: this.bomba.codigo,
        tempoGasto,
        tentativasUsadas: this.tentativasUsadas,
        maxTentativas: this.maxTentativas,
        novoRecorde
      });
    }, venceu ? 400 : 900);
  }

  // Para o relógio sem mostrar resultado (usado ao sair para o menu).
  cancelar() {
    this.terminou = true;
    clearInterval(this.intervalo);
  }
}

// ======================================================================
// TELA — tudo que mexe no HTML fica aqui (igual à classe Tela do C#)
// ======================================================================

// Atalho para pegar elementos pelo id.
const $ = (id) => document.getElementById(id);

const Tela = {
  // Mostra a tela de jogo e monta as casas, o teclado e as luzes.
  mostrarJogo(jogo) {
    $("telaInicio").classList.add("escondido");
    $("telaResultado").classList.add("escondido");
    $("telaJogo").classList.remove("escondido");

    $("historico").innerHTML = '<li class="vazio">Nenhuma tentativa ainda.</li>';

    this.mostrarMensagem(`A senha tem ${jogo.bomba.digitos} dígitos. Boa sorte!`);
    this.atualizarCasas(jogo);
    this.atualizarTentativas(jogo);
    this.atualizarTempo(jogo);
    this.atualizarBotaoDica(jogo);
  },

  // Formata segundos como mm:ss.
  formatarTempo(segundos) {
    const minutos = Math.floor(segundos / 60);
    const resto = segundos % 60;
    return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
  },

  // Atualiza o visor, a barra e o modo perigo.
  atualizarTempo(jogo) {
    const tempo = Math.max(0, jogo.tempoRestante);
    const porcentagem = (tempo / jogo.tempoInicial) * 100;
    const barra = $("barraPreenchida");

    $("tempo").textContent = this.formatarTempo(tempo);
    barra.style.width = `${porcentagem}%`;

    // A cor da barra muda conforme o tempo acaba.
    if (porcentagem > 50) {
      barra.style.backgroundColor = "var(--success)";
    } else if (porcentagem > 25) {
      barra.style.backgroundColor = "var(--warning)";
    } else {
      barra.style.backgroundColor = "var(--danger)";
    }

    $("bomba").classList.toggle("perigo", tempo <= TEMPO_DE_PERIGO && !jogo.terminou);
  },

  // Redesenha as casas dos dígitos.
  atualizarCasas(jogo) {
    const casas = $("casas");
    casas.innerHTML = "";

    // Descobre qual é a próxima casa que o jogador vai preencher.
    const proxima = jogo.tentativa.findIndex((valor, i) => valor === null && !jogo.travadas[i]);

    jogo.tentativa.forEach((valor, i) => {
      const casa = document.createElement("div");
      casa.className = "casa";
      casa.textContent = valor ?? "";

      if (jogo.travadas[i]) {
        casa.classList.add("revelada");
      } else if (valor !== null) {
        casa.classList.add("preenchida");
      } else if (i === proxima) {
        casa.classList.add("atual");
      }

      casas.appendChild(casa);
    });
  },

  // Acende uma luz para cada tentativa que ainda resta.
  atualizarTentativas(jogo) {
    const luzes = $("luzesTentativas");
    luzes.innerHTML = "";

    for (let i = 0; i < jogo.maxTentativas; i++) {
      const luz = document.createElement("span");
      luz.className = "luz";

      if (i < jogo.tentativasUsadas) {
        luz.classList.add("apagada");
      }

      luzes.appendChild(luz);
    }
  },

  atualizarBotaoDica(jogo) {
    $("botaoDica").disabled = jogo.dicaUsada;
  },

  // Mostra uma mensagem abaixo das casas. O tipo muda a cor (erro / aviso).
  mostrarMensagem(texto, tipo = "") {
    const mensagem = $("mensagem");
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
  },

  // Adiciona a tentativa no topo do histórico, com bolinhas coloridas.
  adicionarAoHistorico(texto, resultado, digitos) {
    const historico = $("historico");

    // Remove o aviso de "nenhuma tentativa".
    const vazio = historico.querySelector(".vazio");
    if (vazio) {
      vazio.remove();
    }

    const item = document.createElement("li");

    const palpite = document.createElement("span");
    palpite.className = "palpite";
    palpite.textContent = texto;

    const bolinhas = document.createElement("span");
    bolinhas.className = "bolinhas";
    bolinhas.title = `Lugar certo: ${resultado.certos} | Lugar errado: ${resultado.quase}`;

    // Verdes primeiro, depois amarelas, e o resto cinza.
    for (let i = 0; i < digitos; i++) {
      const bolinha = document.createElement("span");

      if (i < resultado.certos) {
        bolinha.className = "bolinha certa";
      } else if (i < resultado.certos + resultado.quase) {
        bolinha.className = "bolinha quase";
      } else {
        bolinha.className = "bolinha errada";
      }

      bolinhas.appendChild(bolinha);
    }

    item.append(palpite, bolinhas);
    historico.prepend(item);
  },

  // Reinicia a animação de balançar (remove e coloca a classe de novo).
  balancarCasas() {
    const casas = $("casas");
    casas.classList.remove("balancar");
    void casas.offsetWidth;
    casas.classList.add("balancar");
  },

  // Clarão na tela inteira.
  explodir() {
    const clarao = $("clarao");
    clarao.classList.remove("ativo");
    void clarao.offsetWidth;
    clarao.classList.add("ativo");
    $("bomba").classList.remove("perigo");
  },

  // Mostra a janela de vitória ou derrota (equivale ao MostrarResultado do C#).
  mostrarResultado(dados) {
    const icone = $("iconeResultado");

    if (dados.venceu) {
      icone.className = "icone-resultado vitoria";
      icone.innerHTML = ICONE_ESCUDO;
      $("tituloResultado").textContent = "Bomba desarmada!";
      $("textoResultado").textContent =
        `Você levou ${this.formatarTempo(dados.tempoGasto)} e usou ${dados.tentativasUsadas} de ${dados.maxTentativas} tentativas.`;
    } else {
      icone.className = "icone-resultado derrota";
      icone.innerHTML = ICONE_EXPLOSAO;
      $("tituloResultado").textContent = "BOOOM!";
      $("textoResultado").textContent =
        dados.motivo === "tentativas"
          ? "Você usou todas as tentativas."
          : dados.motivo === "desistiu"
            ? "Você desistiu e a bomba explodiu."
            : "A contagem chegou ao fim!";
    }

    $("codigoRevelado").textContent = dados.codigo;
    $("novoRecorde").classList.toggle("escondido", !dados.novoRecorde);
    $("telaResultado").classList.remove("escondido");
    $("botaoJogarDeNovo").focus();
  },

  // Volta para o menu inicial.
  mostrarInicio() {
    $("telaJogo").classList.add("escondido");
    $("telaResultado").classList.add("escondido");
    $("telaInicio").classList.remove("escondido");
    this.mostrarRecordes();
  },

  // Lista o melhor tempo de cada dificuldade.
  mostrarRecordes() {
    const recordes = lerDoNavegador(CHAVE_RECORDES, {});
    const lista = $("listaRecordes");
    lista.innerHTML = "";

    Object.entries(NIVEIS).forEach(([id, nivel]) => {
      const item = document.createElement("li");
      const tempo = recordes[id] !== undefined ? this.formatarTempo(recordes[id]) : "--:--";
      item.innerHTML = `<span>${nivel.nome}</span><strong>${tempo}</strong>`;
      lista.appendChild(item);
    });
  },

  // Monta o teclado numérico da bomba.
  montarTeclado() {
    const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "apagar", "0", "confirmar"];
    const teclado = $("teclado");

    teclas.forEach((tecla) => {
      const botao = document.createElement("button");
      botao.className = "tecla";
      botao.dataset.tecla = tecla;

      if (tecla === "apagar") {
        botao.classList.add("apagar");
        botao.textContent = "Apagar";
      } else if (tecla === "confirmar") {
        botao.classList.add("confirmar");
        botao.textContent = "OK";
      } else {
        botao.textContent = tecla;
      }

      botao.addEventListener("click", () => apertarTecla(tecla));
      teclado.appendChild(botao);
    });
  },

  // Dá o efeito de "afundar" no botão quando o jogador usa o teclado do PC.
  destacarTecla(tecla) {
    const botao = document.querySelector(`.tecla[data-tecla="${tecla}"]`);

    if (!botao) {
      return;
    }

    botao.classList.add("pressionada");
    setTimeout(() => botao.classList.remove("pressionada"), 100);
  },

  atualizarIconeSom() {
    $("iconeSomLigado").classList.toggle("escondido", !Som.ligado);
    $("iconeSomDesligado").classList.toggle("escondido", Som.ligado);
  }
};

// Ícones usados na tela de resultado.
const ICONE_ESCUDO = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path></svg>`;
const ICONE_EXPLOSAO = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 14 8 20 6 16 11 22 14 15 15 16 22 12 17 8 22 9 15 2 14 8 11 4 6 10 8Z"></path></svg>`;

// ======================================================================
// SALVAR NO NAVEGADOR (localStorage)
// ======================================================================

// Lê um valor salvo; se der erro ou não existir, usa o valor padrão.
function lerDoNavegador(chave, valorPadrao) {
  try {
    const texto = localStorage.getItem(chave);
    return texto === null ? valorPadrao : JSON.parse(texto);
  } catch {
    return valorPadrao;
  }
}

function salvarNoNavegador(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Se o navegador bloquear, o jogo continua funcionando sem salvar.
  }
}

// Salva o tempo se for o melhor daquela dificuldade. Retorna true se bateu o recorde.
function salvarRecorde(nivel, tempoGasto) {
  // O modo personalizado não tem recorde, porque as regras mudam.
  if (!NIVEIS[nivel]) {
    return false;
  }

  const recordes = lerDoNavegador(CHAVE_RECORDES, {});

  if (recordes[nivel] === undefined || tempoGasto < recordes[nivel]) {
    recordes[nivel] = tempoGasto;
    salvarNoNavegador(CHAVE_RECORDES, recordes);
    return true;
  }

  return false;
}

// ======================================================================
// CONTROLE DA PÁGINA (equivale ao Program.cs)
// ======================================================================

let jogoAtual = null;
let nivelEscolhido = "facil";

// Lê um número de um campo, com valor padrão e limites (igual ao LerInteiro do C#).
function lerInteiro(id, valorPadrao, minimo, maximo) {
  const valor = parseInt($(id).value, 10);

  if (Number.isNaN(valor) || valor < minimo || valor > maximo) {
    $(id).value = valorPadrao;
    return valorPadrao;
  }

  return valor;
}

// Monta a configuração da partida a partir da dificuldade escolhida.
function montarConfiguracao() {
  if (nivelEscolhido === "personalizado") {
    return {
      id: "personalizado",
      digitos: lerInteiro("campoDigitos", 4, 1, 8),
      tempo: lerInteiro("campoTempo", 30, 5, 600),
      tentativas: lerInteiro("campoTentativas", 3, 1, 20),
      penalidade: 0
    };
  }

  return { id: nivelEscolhido, ...NIVEIS[nivelEscolhido] };
}

function iniciarPartida() {
  Som.preparar();

  if (jogoAtual) {
    jogoAtual.cancelar();
  }

  jogoAtual = new Jogo(montarConfiguracao());
  jogoAtual.iniciar();
}

function voltarAoMenu() {
  if (jogoAtual) {
    jogoAtual.cancelar();
  }

  Tela.mostrarInicio();
}

// Decide o que fazer com cada tecla (equivale ao ProcessarTecla do C#).
function apertarTecla(tecla) {
  if (!jogoAtual || jogoAtual.terminou) {
    return;
  }

  if (tecla === "confirmar") {
    jogoAtual.confirmar();
  } else if (tecla === "apagar") {
    jogoAtual.apagar();
  } else {
    jogoAtual.digitar(tecla);
  }
}

// ---------- Eventos ----------

// Escolha da dificuldade.
document.querySelectorAll(".dificuldade").forEach((botao) => {
  botao.addEventListener("click", () => {
    document.querySelectorAll(".dificuldade").forEach((b) => b.classList.remove("selecionada"));
    botao.classList.add("selecionada");
    nivelEscolhido = botao.dataset.nivel;
    $("camposPersonalizado").classList.toggle("escondido", nivelEscolhido !== "personalizado");
  });
});

$("botaoIniciar").addEventListener("click", iniciarPartida);
$("botaoJogarDeNovo").addEventListener("click", iniciarPartida);
$("botaoMenu").addEventListener("click", voltarAoMenu);
$("botaoDica").addEventListener("click", () => jogoAtual && jogoAtual.usarDica());

$("botaoDesistir").addEventListener("click", () => {
  if (jogoAtual && !jogoAtual.terminou) {
    jogoAtual.finalizar(false, "desistiu");
  }
});

$("botaoSom").addEventListener("click", () => {
  Som.ligado = !Som.ligado;
  salvarNoNavegador(CHAVE_SOM, Som.ligado);
  Som.preparar();
  Tela.atualizarIconeSom();
});

// Teclado do computador: números, Backspace e Enter.
document.addEventListener("keydown", (evento) => {
  // Só funciona durante a partida.
  if ($("telaJogo").classList.contains("escondido") || !jogoAtual || jogoAtual.terminou) {
    return;
  }

  let tecla = null;

  if (/^[0-9]$/.test(evento.key)) {
    tecla = evento.key;
  } else if (evento.key === "Backspace") {
    tecla = "apagar";
  } else if (evento.key === "Enter") {
    tecla = "confirmar";
  }

  if (tecla) {
    // Evita que o Enter também "clique" no botão que estiver focado.
    evento.preventDefault();
    Tela.destacarTecla(tecla);
    apertarTecla(tecla);
  }
});

// ---------- Início ----------

Tela.montarTeclado();
Tela.atualizarIconeSom();
Tela.mostrarRecordes();
