namespace BabyFrota.DTOs.Caixa;

public class FluxoCaixaFiltro
{
    /// <summary>Início do período, pela data de abertura do caixa.</summary>
    public DateTime? DataInicio { get; set; }

    /// <summary>Fim do período (inclusive), pela data de abertura do caixa.</summary>
    public DateTime? DataFim { get; set; }

    /// <summary>Trecho do nome de quem abriu ou fechou o caixa.</summary>
    public string? UsuarioNome { get; set; }

    public int Pagina { get; set; } = 1;
    public int TamanhoPagina { get; set; } = 10;
}

/// <summary>Quanto um usuário recebeu (processou devoluções) dentro dos caixas consultados.</summary>
public class FluxoCaixaRecebidoDto
{
    public int UsuarioId { get; set; }
    public string UsuarioNome { get; set; } = string.Empty;
    public decimal TotalRecebido { get; set; }
    public int QuantidadeLocacoes { get; set; }
}

/// <summary>Uma linha do Fluxo de Caixa: um caixa (turno) e o que o sistema apurou dele.</summary>
public class FluxoCaixaDto
{
    public int Id { get; set; }
    public string UsuarioAberturaNome { get; set; } = string.Empty;
    public string? UsuarioFechamentoNome { get; set; }
    public DateTime DataAbertura { get; set; }
    public DateTime? DataFechamento { get; set; }
    public bool Aberto { get; set; }

    public decimal SuprimentoInicial { get; set; }
    public decimal Reforcos { get; set; }
    public decimal TotalVendido { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal Troco { get; set; }
    public int QuantidadeLocacoes { get; set; }
    public int LocacoesPendentes { get; set; }

    /// <summary>Recebido por forma de recebimento (chave = id da forma). O dinheiro já vem líquido de troco.</summary>
    public Dictionary<int, decimal> PorForma { get; set; } = new();

    public decimal SaldoEmDinheiro { get; set; }

    /// <summary>A soma das formas não bate com o total vendido (ex.: parcelas em duplicidade do fluxo antigo).</summary>
    public bool SomaFormasDiverge { get; set; }

    public List<FluxoCaixaRecebidoDto> RecebidoPorUsuario { get; set; } = new();
}

public class FluxoCaixaTotaisDto
{
    public int QuantidadeCaixas { get; set; }
    public int CaixasAbertos { get; set; }
    public int CaixasComDivergencia { get; set; }
    public decimal SuprimentoInicial { get; set; }
    public decimal Reforcos { get; set; }
    public decimal TotalVendido { get; set; }
    public decimal TotalGastos { get; set; }
    public decimal Troco { get; set; }
    public int QuantidadeLocacoes { get; set; }
    public decimal SaldoEmDinheiro { get; set; }
    public Dictionary<int, decimal> PorForma { get; set; } = new();
}

public class FluxoCaixaDiaDto
{
    public DateTime Data { get; set; }
    public int Caixas { get; set; }
    public decimal TotalVendido { get; set; }
    public decimal TotalGastos { get; set; }
    public Dictionary<int, decimal> PorForma { get; set; } = new();
}

/// <summary>Indicadores, série diária e ranking de recebimento, todos sobre o mesmo filtro (todos os caixas dele, não só uma página).</summary>
public class FluxoCaixaResumoDto
{
    public FluxoCaixaTotaisDto Totais { get; set; } = new();
    public List<FluxoCaixaDiaDto> PorDia { get; set; } = new();
    public List<FluxoCaixaRecebidoDto> PorUtilizador { get; set; } = new();
}
