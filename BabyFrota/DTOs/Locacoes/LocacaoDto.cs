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

public class EntregaRequest
{
    public int ClienteId { get; set; }
    public int CarrinhoId { get; set; }
    public int TempoMinutos { get; set; }
    public decimal Desconto { get; set; }
    public string? Observacao { get; set; }
    public List<PagamentoRequest> Pagamentos { get; set; } = new();
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
}

public class DevolucaoRequest
{
    public decimal Desconto { get; set; }
    public string? Observacao { get; set; }
    public List<PagamentoRequest> Pagamentos { get; set; } = new();
}
