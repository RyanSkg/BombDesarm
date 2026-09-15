// Define quantos dígitos o código secreto da bomba terá.
const int DigitosDaSenha = 4;

// Define o número padrão de tentativas caso o usuário digite um valor inválido.
const int TentativasPadrao = 3;

// Define o tempo padrão do jogo caso o usuário digite um valor inválido.
const int TempoPadraoEmSegundos = 30;

// Cria um objeto da classe Bomba, passando a quantidade de dígitos da senha.
Bomba bomba = new Bomba(DigitosDaSenha);

// Mostra a tela inicial com o logo do jogo.
Tela.MostrarLogo();

// Lê a quantidade máxima de tentativas informada pelo usuário.
int maxTentativas = Tela.LerInteiro(
    // Mensagem que será exibida antes da leitura.
    "Digite a quantidade máxima de tentativas: ",
    // Valor usado se a entrada do usuário for inválida.
    TentativasPadrao,
    // Menor valor aceito para a quantidade de tentativas.
    minimo: 1);

// Lê o tempo inicial do jogo informado pelo usuário.
int tempoInicial = Tela.LerInteiro(
    // Mensagem que será exibida antes da leitura.
    "Digite o tempo para desarmar a bomba (em segundos): ",
    // Valor usado se a entrada do usuário for inválida.
    TempoPadraoEmSegundos,
    // Menor valor aceito para o tempo inicial.
    minimo: 1);

// Cria um objeto da classe Jogo, entregando a bomba e as configurações escolhidas.
Jogo jogo = new Jogo(bomba, maxTentativas, tempoInicial);

// Inicia a partida.
jogo.Iniciar();
