namespace BabyFrota.Domain.Enums;

/// <summary>
/// Espelha os valores de referência da tabela Status (dados) / enum EStatus do sistema legado.
/// Mantido como enum auxiliar para regras de negócio; a fonte da verdade continua sendo a tabela Status.
/// </summary>
public enum SituacaoCarrinho
{
    Disponivel = 1,
    Manutencao = 2,
    Reservado = 3,
    Alugado = 4,
}
