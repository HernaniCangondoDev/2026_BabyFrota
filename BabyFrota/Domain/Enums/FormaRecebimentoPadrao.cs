namespace BabyFrota.Domain.Enums;

/// <summary>
/// Ids fixos da tabela FormaRecebimento. O legado também depende deles (o comprovante de fechamento soma as formas 1 a 4),
/// e o Fluxo de Caixa precisa saber qual é o dinheiro para descontar o troco e calcular o saldo da gaveta.
/// </summary>
public enum FormaRecebimentoPadrao
{
    Dinheiro = 1,
    Debito = 2,
    Credito = 3,
    Pix = 4,
}
