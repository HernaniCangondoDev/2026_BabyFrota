namespace BabyFrota.DTOs.Locacoes;

/// <summary>Estado de uma locação na consulta: entregue (o carrinho ainda está com o cliente) ou devolvido.</summary>
public enum EstadoLocacaoFiltro
{
    Entregue = 1,
    Devolvido = 2,
}

public class LocacaoConsultaFiltro
{
    public DateTime? DataEntregaInicio { get; set; }
    public DateTime? DataEntregaFim { get; set; }
    public EstadoLocacaoFiltro? Estado { get; set; }
    public string? ClienteNome { get; set; }
    public int? CarrinhoId { get; set; }
    public int? TipoCarrinhoId { get; set; }

    /// <summary>Locações que receberam algum pagamento nessa forma.</summary>
    public int? FormaRecebimentoId { get; set; }

    public int Pagina { get; set; } = 1;
    public int TamanhoPagina { get; set; } = 10;
}

public class LocacaoConsultaDto
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public string CarrinhoDescricao { get; set; } = string.Empty;
    public string TipoCarrinhoDescricao { get; set; } = string.Empty;
    public DateTime DataEntrega { get; set; }
    public DateTime? DataDevolucao { get; set; }
    public int? TempoMinutos { get; set; }

    /// <summary>Só existe depois da devolução: o valor é apurado e cobrado nela.</summary>
    public decimal? ValorTotal { get; set; }
    public bool Entregue { get; set; }
}

/// <summary>Totais de todas as locações do filtro (não só da página).</summary>
public class LocacaoConsultaResumoDto
{
    public int TotalLocacoes { get; set; }
    public int TotalEntregues { get; set; }
    public int TotalDevolvidas { get; set; }

    /// <summary>Soma do valor das locações devolvidas.</summary>
    public decimal ValorTotal { get; set; }
}

public class LocacaoPagamentoDto
{
    public int Numero { get; set; }
    public int FormaRecebimentoId { get; set; }
    public string FormaRecebimentoNome { get; set; } = string.Empty;
    public decimal ValorRecebido { get; set; }
}

/// <summary>Tudo de uma locação: alimenta o modal de detalhes e os comprovantes impressos.</summary>
public class LocacaoDetalheDto
{
    public int Id { get; set; }

    /// <summary>Ainda sem devolução.</summary>
    public bool Entregue { get; set; }

    public int ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public string? ClienteDddTelefone { get; set; }
    public string? ClienteTelefone { get; set; }
    public string? ClienteDddCelular { get; set; }
    public string? ClienteCelular { get; set; }

    public int CarrinhoId { get; set; }
    public string CarrinhoDescricao { get; set; } = string.Empty;
    public string TipoCarrinhoDescricao { get; set; } = string.Empty;

    public DateTime DataEntrega { get; set; }
    public DateTime? DataDevolucao { get; set; }
    public string UsuarioEntregaNome { get; set; } = string.Empty;
    public string? UsuarioDevolucaoNome { get; set; }
    public int? TempoMinutos { get; set; }

    /// <summary>Valor da tabela de preços: valor total mais o desconto. Não é gravado, é calculado.</summary>
    public decimal? ValorTabela { get; set; }
    public decimal? Desconto { get; set; }
    public decimal? ValorTotal { get; set; }
    public decimal? Troco { get; set; }
    public decimal ValorRecebido { get; set; }

    /// <summary>Um campo só: a observação da entrega e a da devolução ficam concatenadas.</summary>
    public string? Observacao { get; set; }
    public int CaixaId { get; set; }

    /// <summary>
    /// Os pagamentos não fecham com o valor (recebido − troco ≠ total) ou há pagamento numa locação ainda não devolvida —
    /// sinal de parcelas do fluxo antigo, em que a entrega também cobrava.
    /// </summary>
    public bool PagamentosInconsistentes { get; set; }

    public List<LocacaoPagamentoDto> Pagamentos { get; set; } = new();
    public List<TrocaDto> Trocas { get; set; } = new();
}
