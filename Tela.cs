// Importa tipos básicos, como Console.
using System;

// Importa Thread, usado para fazer pausas entre telas.
using System.Threading;

// Define a classe responsável por mostrar mensagens e ler entradas no console.
class Tela
{
    // Define a pausa padrão entre telas em milissegundos.
    private const int PausaEntreTelasEmMs = 2000;

    // Mostra o logo inicial do jogo.
    public static void MostrarLogo()
    {
        // Escreve o desenho em texto na tela.
        Console.Write(@"__________                 ____   ____.__            .___    ._.
\______   \ ____   _____   \   \ /   /|__| ____    __| _/____| |
 |    |  _// __ \ /     \   \   Y   / |  |/    \  / __ |/  _ \ |
 |    |   \  ___/|  Y Y  \   \     /  |  |   |  \/ /_/ (  <_> )|
 |______  /\___  >__|_|  /    \___/   |__|___|  /\____ |\____/__
        \/     \/      \/                     \/      \/      \/ ");

        // Pausa a execução para o jogador conseguir ver o logo.
        Thread.Sleep(PausaEntreTelasEmMs);

        // Limpa a tela do console.
        Console.Clear();

        // Mostra uma mensagem avisando que a bomba foi criada.
        Console.WriteLine("Bomba gerada!");
    }

    // Lê um número inteiro digitado pelo usuário, com valor padrão se a entrada for inválida.
    public static int LerInteiro(string mensagem, int valorPadrao, int minimo)
    {
        // Mostra a mensagem recebida antes de ler a entrada.
        Console.Write(mensagem);

        // Tenta converter a entrada para int e verifica se ela é maior ou igual ao mínimo.
        if (int.TryParse(Console.ReadLine(), out int valor) && valor >= minimo)
        {
            // Retorna o valor digitado quando ele é válido.
            return valor;
        }

        // Avisa que a entrada foi inválida e mostra qual valor será usado.
        Console.WriteLine($"Valor inválido. Usando {valorPadrao}.");

        // Pausa rapidamente para o jogador conseguir ler a mensagem.
        Thread.Sleep(1500);

        // Retorna o valor padrão.
        return valorPadrao;
    }

    // Mostra a tela inicial depois que a bomba foi ativada.
    public static void MostrarBombaAtivada(int digitos, int maxTentativas)
    {
        // Limpa a tela antes de escrever a nova mensagem.
        Console.Clear();

        // Mostra que o jogo começou.
        Console.WriteLine("Bomba ativada!");

        // Mostra quantos dígitos a senha possui.
        Console.WriteLine($"A senha tem {digitos} dígitos.");

        // Mostra quantas tentativas o jogador pode usar.
        Console.WriteLine($"Você tem {maxTentativas} tentativas.");

        // Pausa para o jogador ler as informações iniciais.
        Thread.Sleep(PausaEntreTelasEmMs);
    }

    // Mostra o estado atual da partida durante o jogo.
    public static void MostrarEstado(
        // Tempo que ainda resta para o jogador.
        int tempoRestante,
        // Quantidade de dígitos da senha.
        int digitos,
        // Quantidade de tentativas já usadas.
        int tentativasUsadas,
        // Quantidade máxima de tentativas.
        int maxTentativas,
        // Texto que o jogador digitou até agora.
        string tentativa,
        // Dica atual exibida para o jogador.
        string dica)
    {
        // Limpa a tela para redesenhar as informações atualizadas.
        Console.Clear();

        // Mostra o tempo restante.
        Console.WriteLine($"Tempo restante: {tempoRestante}");

        // Mostra quantos dígitos o código possui.
        Console.WriteLine($"A senha tem {digitos} dígitos.");

        // Mostra o número de tentativas usadas e o limite total.
        Console.WriteLine($"Tentativas: {tentativasUsadas}/{maxTentativas}");

        // Mostra a tentativa que está sendo digitada.
        Console.WriteLine($"Digite o código de desarme: {tentativa}");

        // Mostra a dica atual, se existir.
        Console.WriteLine(dica);
    }

    // Mostra a mensagem final da partida.
    public static void MostrarResultado(bool bombaDesarmada, int tentativasUsadas, int maxTentativas)
    {
        // Limpa a tela antes de mostrar o resultado final.
        Console.Clear();

        // Verifica se o jogador venceu.
        if (bombaDesarmada)
        {
            // Mostra a mensagem de vitória.
            Console.WriteLine("Código correto! Bomba desarmada.");
        }
        // Verifica se o jogador perdeu por acabar as tentativas.
        else if (tentativasUsadas >= maxTentativas)
        {
            // Mostra a mensagem de derrota por tentativas esgotadas.
            Console.WriteLine("Booom! Você usou todas as tentativas.");
        }
        // Se não venceu e não perdeu por tentativas, perdeu pelo tempo.
        else
        {
            // Mostra a mensagem de derrota por tempo esgotado.
            Console.WriteLine("Booom! A contagem chegou ao fim!");
        }
    }
}
