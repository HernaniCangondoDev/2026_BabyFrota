namespace BabyFrota.DTOs.Caixa;

public class CaixaMovimentoDto
{
    public int Id { get; set; }
    public DateTime DataAbertura { get; set; }
    public DateTime? DataFechamento { get; set; }
    public string UsuarioAberturaNome { get; set; } = string.Empty;
    public string? UsuarioFechamentoNome { get; set; }
    public decimal SuprimentoInicial { get; set; }
    public decimal? ValorFechamento { get; set; }
    public bool Aberto { get; set; }
    public decimal TotalSuprimentos { get; set; }
    public decimal TotalSangrias { get; set; }
    public decimal TotalLocacoes { get; set; }
    /// <summary>Suprimento inicial + locações + suprimentos - sangrias (o que deveria estar em caixa agora).</summary>
    public decimal SaldoAtual { get; set; }
}

public class AberturaCaixaRequest
{
    public decimal SuprimentoInicial { get; set; }
}

public class FechamentoCaixaRequest
{
    /// <summary>Valor contado fisicamente no fechamento — comparado ao SaldoAtual calculado.</summary>
    public decimal ValorFechamento { get; set; }
}

public class MovimentoCaixaRequest
{
    public decimal Valor { get; set; }
}

public class MovimentoCaixaDto
{
    public int Id { get; set; }
    public DateTime Data { get; set; }
    public decimal Valor { get; set; }
    public string UsuarioNome { get; set; } = string.Empty;
}
