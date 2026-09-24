namespace BabyFrota.DTOs.Caixa;

public class CaixaMovimentoDto
{
    public int Id { get; set; }
    public DateTime DataAbertura { get; set; }
    public DateTime? DataFechamento { get; set; }
    public int UsuarioAberturaId { get; set; }
    public string UsuarioAberturaNome { get; set; } = string.Empty;
    public string? UsuarioFechamentoNome { get; set; }
    public decimal SuprimentoInicial { get; set; }

    /// <summary>Como no legado, gravado no fechamento como o total vendido do caixa; não é um valor digitado.</summary>
    public decimal? ValorFechamento { get; set; }
    public bool Aberto { get; set; }

    /// <summary>Reforços de caixa. Não inclui o suprimento inicial (o legado o grava também como uma linha de suprimento).</summary>
    public decimal TotalSuprimentos { get; set; }
    public decimal TotalSangrias { get; set; }

    /// <summary>Total vendido: soma do valor das locações já devolvidas neste caixa.</summary>
    public decimal TotalLocacoes { get; set; }

    /// <summary>Recebido por forma de recebimento (chave = id da forma). O dinheiro já vem líquido de troco.</summary>
    public Dictionary<int, decimal> PorForma { get; set; } = new();

    /// <summary>Locações entregues neste caixa e ainda não devolvidas. Enquanto houver, o caixa não fecha.</summary>
    public int LocacoesPendentes { get; set; }

    /// <summary>Dinheiro que deveria estar na gaveta: suprimento inicial + reforços + dinheiro líquido de troco − sangrias.</summary>
    public decimal SaldoEmDinheiro { get; set; }

    /// <summary>O usuário que fez a consulta pode fechar este caixa (quem abriu, Gerente ou Administrador).</summary>
    public bool PodeFechar { get; set; }
}

public class AberturaCaixaRequest
{
    public decimal SuprimentoInicial { get; set; }
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
