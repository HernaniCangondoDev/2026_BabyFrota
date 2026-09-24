namespace BabyFrota.DTOs.Locacoes;

public class CarrinhoDisponivelDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public int TipoCarrinhoId { get; set; }
    public string TipoCarrinhoDescricao { get; set; } = string.Empty;
}

public class FaixaPrecoDto
{
    public int MinimoMinutos { get; set; }
    public int MaximoMinutos { get; set; }
    public decimal Valor { get; set; }
}

public class FormaRecebimentoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
}

public class PagamentoRequest
{
    public int FormaRecebimentoId { get; set; }
    public decimal Valor { get; set; }
}

/// <summary>A entrega só reserva o carrinho: preço, desconto e pagamento são apurados na devolução.</summary>
public class EntregaRequest
{
    public int ClienteId { get; set; }
    public int CarrinhoId { get; set; }
    public string? Observacao { get; set; }
}

public class LocacaoDto
{
    public int Id { get; set; }
    public int ClienteId { get; set; }
    public string ClienteNome { get; set; } = string.Empty;
    public int CarrinhoId { get; set; }
    public string CarrinhoDescricao { get; set; } = string.Empty;
    public DateTime DataEntrega { get; set; }
    public DateTime? DataDevolucao { get; set; }
    public int? TempoMinutos { get; set; }
    public decimal? ValorTotal { get; set; }
    public decimal? Desconto { get; set; }
    public decimal? Troco { get; set; }
    public string UsuarioEntregaNome { get; set; } = string.Empty;
    public bool EmAndamento { get; set; }
}

public class TrocaCarrinhoRequest
{
    public int NovoCarrinhoId { get; set; }
}

public class TrocaDto
{
    public int Id { get; set; }
    public int CarrinhoAnteriorId { get; set; }
    public string CarrinhoAnteriorDescricao { get; set; } = string.Empty;
    public int NovoCarrinhoId { get; set; }
    public string NovoCarrinhoDescricao { get; set; } = string.Empty;
    public decimal? PrecoCarrinhoAnterior { get; set; }
    public int? TempoCarrinhoAnterior { get; set; }
    public DateTime DataTroca { get; set; }
    public string UsuarioNome { get; set; } = string.Empty;
}

public class PreviaDevolucaoDto
{
    public int TempoMinutos { get; set; }
    public decimal Valor { get; set; }

    /// <summary>O tempo passou da última faixa cadastrada e <see cref="Valor"/> é o preço dessa última faixa.</summary>
    public bool AcimaDaTabela { get; set; }

    /// <summary>Limite em minutos da última faixa; só vem preenchido quando <see cref="AcimaDaTabela"/> é verdadeiro.</summary>
    public int? MaximoTabelaMinutos { get; set; }

    /// <summary>
    /// Soma das parcelas que a locação já tem. No fluxo atual a entrega não cobra, então só é maior que zero em locações
    /// entregues no fluxo antigo. Conta como já pago na devolução.
    /// </summary>
    public decimal ValorJaRecebido { get; set; }
}

public class DevolucaoRequest
{
    public decimal Desconto { get; set; }
    public string? Observacao { get; set; }
    public List<PagamentoRequest> Pagamentos { get; set; } = new();
}
