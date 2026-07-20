namespace BabyFrota.DTOs.Carrinhos;

public class CarrinhoDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public int TipoCarrinhoId { get; set; }
    public string TipoCarrinhoDescricao { get; set; } = string.Empty;
    public int StatusId { get; set; }
    public string StatusNome { get; set; } = string.Empty;
    public DateOnly DataAquisicao { get; set; }
    public string Fornecedor { get; set; } = string.Empty;
    public decimal ValorAquisicao { get; set; }
    public string? Observacao { get; set; }
    public DateTime? DataCadastro { get; set; }
}

public class CarrinhoUpsertRequest
{
    public string Descricao { get; set; } = string.Empty;
    public int TipoCarrinhoId { get; set; }
    public int StatusId { get; set; }
    public DateOnly DataAquisicao { get; set; }
    public string Fornecedor { get; set; } = string.Empty;
    public decimal ValorAquisicao { get; set; }
    public string? Observacao { get; set; }
}

public class StatusDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
}
