# BombDesarm — Jogo de Desarmar Bomba

Uma bomba foi ativada e você precisa descobrir o código secreto antes que o tempo acabe.
A cada tentativa errada o jogo mostra quantos dígitos estão no lugar certo e quantos existem, mas estão no lugar errado.

## Jogar online

👉 **https://ryanskg.github.io/BombDesarm/**

## Versões

O projeto tem duas versões com a mesma lógica (classes `Bomba`, `Jogo` e `Tela`):

| Versão | Pasta | Tecnologias |
| --- | --- | --- |
| Console | raiz do projeto | C# / .NET 10 |
| Web | `web/` | HTML, CSS e JavaScript |

### Versão web

- Dificuldades Fácil, Médio, Difícil (erro tira 5 segundos) e Personalizado
- Teclado numérico na tela ou teclado do computador (números, Backspace e Enter)
- Histórico de tentativas com bolinhas: 🟢 lugar certo / 🟡 lugar errado
- 1 dica por partida, que revela um dígito e custa 10 segundos
- Sons, modo perigo nos últimos 10 segundos e animação de explosão
- Recordes de tempo salvos no navegador

### Versão console

```bash
dotnet run
```

## Publicação

A pasta `web/` é publicada automaticamente no GitHub Pages pelo workflow `.github/workflows/pages.yml` a cada push na branch `main`.
