// Importa tipos básicos, como Console e ConsoleKeyInfo.
using System;

// Importa Stopwatch, usado para medir o tempo de forma mais precisa.
using System.Diagnostics;

// Importa Thread, usado para fazer pequenas pausas no programa.
using System.Threading;

// Define a classe responsável por controlar a partida.
class Jogo
{
    // Guarda a bomba que será usada nesta partida.
    private readonly Bomba bomba;

    // Guarda o limite máximo de tentativas permitidas.
    private readonly int maxTentativas;

    // Guarda quantos segundos ainda restam para desarmar a bomba.
    private int tempoRestante;

    // Guarda quantas tentativas o jogador já usou.
    private int tentativasUsadas;

    // Guarda o código que o jogador está digitando no momento.
    private string tentativa = "";

    // Guarda a mensagem de dica exibida depois de uma tentativa errada.
    private string dica = "";

    // Método construtor: roda quando criamos um novo objeto Jogo.
    public Jogo(Bomba bomba, int maxTentativas, int tempoInicial)
    {
        // Guarda no atributo da classe a bomba recebida pelo construtor.
        this.bomba = bomba;

        // Guarda no atributo da classe o número máximo de tentativas.
        this.maxTentativas = maxTentativas;

        // Define o tempo inicial da partida.
        tempoRestante = tempoInicial;
    }

    // Método público que inicia e controla o fluxo principal do jogo.
    public void Iniciar()
    {
        // Mostra a mensagem inicial da bomba ativada.
        Tela.MostrarBombaAtivada(bomba.Digitos, maxTentativas);

        // Continua o jogo enquanto houver tempo, a bomba não estiver desarmada e ainda houver tentativas.
        while (tempoRestante > 0 && !bomba.Desarmada && tentativasUsadas < maxTentativas)
        {
            // Atualiza a tela com o estado atual do jogo.
            Tela.MostrarEstado(tempoRestante, bomba.Digitos, tentativasUsadas, maxTentativas, tentativa, dica);

            // Espera um segundo, mas continua lendo as teclas digitadas pelo jogador.
            EsperarUmSegundoLendoTeclas();

            // Se a bomba ainda não foi desarmada e ainda há tentativas, diminui o tempo.
            if (!bomba.Desarmada && tentativasUsadas < maxTentativas)
            {
                // Remove um segundo do contador.
                tempoRestante--;
            }
        }

        // Mostra a mensagem final de vitória ou derrota.
        Tela.MostrarResultado(bomba.Desarmada, tentativasUsadas, maxTentativas);
    }

    // Método privado que espera um segundo sem travar completamente a leitura do teclado.
    private void EsperarUmSegundoLendoTeclas()
    {
        // Cria e inicia um cronômetro para medir a passagem de um segundo.
        Stopwatch cronometro = Stopwatch.StartNew();

        // Continua lendo teclas por até um segundo, desde que o jogo ainda não tenha acabado.
        while (cronometro.Elapsed.TotalSeconds < 1 && !bomba.Desarmada && tentativasUsadas < maxTentativas)
        {
            // Verifica se nenhuma tecla foi pressionada.
            if (!Console.KeyAvailable)
            {
                // Faz uma pausa curta para não deixar o processador trabalhando sem necessidade.
                Thread.Sleep(20);

                // Volta para o início do while e testa de novo se alguma tecla apareceu.
                continue;
            }

            // Lê a tecla pressionada sem mostrar automaticamente no console.
            ConsoleKeyInfo tecla = Console.ReadKey(true);

            // Processa a tecla para decidir se ela entra na tentativa, apaga ou confirma.
            ProcessarTecla(tecla);

            // Atualiza a tela depois da tecla pressionada.
            Tela.MostrarEstado(tempoRestante, bomba.Digitos, tentativasUsadas, maxTentativas, tentativa, dica);
        }
    }

    // Método privado que decide o que fazer com cada tecla pressionada.
    private void ProcessarTecla(ConsoleKeyInfo tecla)
    {
        // Verifica se o jogador apertou Enter.
        if (tecla.Key == ConsoleKey.Enter)
        {
            // Tenta desarmar a bomba com o código digitado.
            TentarDesarmar();

            // Sai do método para não processar a tecla como número depois.
            return;
        }

        // Verifica se o jogador apertou Backspace e se existe algo para apagar.
        if (tecla.Key == ConsoleKey.Backspace && tentativa.Length > 0)
        {
            // Remove o último caractere digitado.
            tentativa = tentativa.Substring(0, tentativa.Length - 1);

            // Sai do método porque a tecla já foi tratada.
            return;
        }

        // Verifica se a tecla é um dígito e se a tentativa ainda não atingiu o tamanho da senha.
        if (char.IsDigit(tecla.KeyChar) && tentativa.Length < bomba.Digitos)
        {
            // Adiciona o dígito pressionado ao texto da tentativa.
            tentativa += tecla.KeyChar;
        }
    }

    // Método privado que valida e envia a tentativa atual para a bomba.
    private void TentarDesarmar()
    {
        // Verifica se o jogador digitou menos dígitos do que a senha exige.
        if (tentativa.Length != bomba.Digitos)
        {
            // Mostra uma dica pedindo a quantidade correta de dígitos.
            dica = $"Digite {bomba.Digitos} dígitos antes de confirmar.";

            // Sai do método sem gastar tentativa.
            return;
        }

        // Aumenta o contador de tentativas usadas.
        tentativasUsadas++;

        // Envia a tentativa para a bomba e recebe uma dica ou mensagem de sucesso.
        dica = bomba.TentarDesarmar(tentativa);

        // Limpa a tentativa para o jogador digitar outro código se tiver errado.
        tentativa = "";
    }
}
