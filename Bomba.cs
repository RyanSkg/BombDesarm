// Importa tipos básicos, como Random.
using System;

// Define a classe que representa a bomba do jogo.
class Bomba
{
    // Guarda o código secreto necessário para desarmar a bomba.
    private readonly string codigoDesarme;

    // Informa se a bomba já foi desarmada; fora da classe, só é possível ler.
    public bool Desarmada { get; private set; }

    // Retorna a quantidade de dígitos do código secreto.
    public int Digitos => codigoDesarme.Length;

    // Método construtor: roda quando criamos uma nova bomba.
    public Bomba(int quantidadeDigitos)
    {
        // Gera e guarda o código secreto com a quantidade de dígitos escolhida.
        codigoDesarme = GerarCodigo(quantidadeDigitos);
    }

    // Recebe uma tentativa do jogador e retorna o resultado.
    public string TentarDesarmar(string tentativa)
    {
        // Verifica se a tentativa é exatamente igual ao código secreto.
        if (tentativa == codigoDesarme)
        {
            // Marca a bomba como desarmada.
            Desarmada = true;

            // Retorna a mensagem de sucesso.
            return "Código correto! Bomba desarmada.";
        }

        // Se a tentativa estiver errada, gera uma dica.
        return GerarDica(tentativa);
    }

    // Gera um código aleatório com a quantidade de dígitos pedida.
    private string GerarCodigo(int quantidadeDigitos)
    {
        // Cria o gerador de números aleatórios.
        Random aleatorio = new Random();

        // Começa o código como texto vazio.
        string codigo = "";

        // Repete uma vez para cada dígito que o código precisa ter.
        for (int i = 0; i < quantidadeDigitos; i++)
        {
            // Sorteia um número de 0 a 9 e adiciona ao final do código.
            codigo += aleatorio.Next(0, 10);
        }

        // Devolve o código gerado para quem chamou o método.
        return codigo;
    }

    // Gera uma dica comparando o código secreto com a tentativa do jogador.
    private string GerarDica(string tentativa)
    {
        // Conta quantos dígitos estão corretos e na posição correta.
        int certosNoLugarCerto = 0;

        // Conta quantos dígitos existem no código, mas estão na posição errada.
        int certosNoLugarErrado = 0;

        // Guarda quantas vezes cada dígito de 0 a 9 ainda pode ser contado como "lugar errado".
        int[] digitosDisponiveis = new int[10];

        // Primeiro laço: encontra os acertos exatos e guarda os outros dígitos disponíveis.
        for (int i = 0; i < codigoDesarme.Length; i++)
        {
            // Verifica se o dígito está certo e na mesma posição.
            if (tentativa[i] == codigoDesarme[i])
            {
                // Conta um acerto na posição correta.
                certosNoLugarCerto++;
            }
            else
            {
                // Converte o caractere numérico do código para um número inteiro de 0 a 9.
                int digitoDoCodigo = codigoDesarme[i] - '0';

                // Registra que esse dígito ainda pode aparecer como acerto na posição errada.
                digitosDisponiveis[digitoDoCodigo]++;
            }
        }

        // Segundo laço: verifica os dígitos que existem no código, mas foram digitados em outra posição.
        for (int i = 0; i < tentativa.Length; i++)
        {
            // Ignora posições que já foram contadas como acerto exato.
            if (tentativa[i] == codigoDesarme[i])
            {
                // Pula para a próxima repetição do for.
                continue;
            }

            // Converte o caractere numérico da tentativa para um número inteiro de 0 a 9.
            int digitoTentado = tentativa[i] - '0';

            // Verifica se esse dígito ainda está disponível para contar como "lugar errado".
            if (digitosDisponiveis[digitoTentado] > 0)
            {
                // Conta um acerto de dígito em posição errada.
                certosNoLugarErrado++;

                // Remove uma ocorrência disponível para evitar contar dígito repetido mais vezes que deveria.
                digitosDisponiveis[digitoTentado]--;
            }
        }

        // Verifica se não houve nenhum tipo de acerto.
        if (certosNoLugarCerto == 0 && certosNoLugarErrado == 0)
        {
            // Retorna uma mensagem simples quando nenhum dígito aparece no código.
            return "Nenhum dígito está correto.";
        }

        // Retorna a dica com a quantidade de acertos exatos e acertos em posição errada.
        return $"Certos no lugar certo: {certosNoLugarCerto} | Certos no lugar errado: {certosNoLugarErrado}";
    }
}
