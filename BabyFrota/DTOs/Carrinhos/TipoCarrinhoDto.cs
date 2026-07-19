namespace BabyFrota.DTOs.Carrinhos;

public class TipoCarrinhoDto
{
    public int Id { get; set; }
    public string Descricao { get; set; } = string.Empty;
    public int QuantidadeCarrinhos { get; set; }
}

public class TipoCarrinhoUpsertRequest
{
    public string Descricao { get; set; } = string.Empty;
}
