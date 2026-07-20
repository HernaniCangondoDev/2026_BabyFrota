namespace BabyFrota.DTOs.Clientes;

public class ClienteDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string? Rg { get; set; }
    public string Ddd { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? DddCelular { get; set; }
    public string? Celular { get; set; }
    public string? Email { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Cidade { get; set; }
    public string? Uf { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? Profissao { get; set; }
    public string? ClasseSocial { get; set; }
    public string? Sexo { get; set; }
    public string? Observacao { get; set; }
    public DateTime? DataCadastro { get; set; }
    public int QuantidadeFilhos { get; set; }
    public int QuantidadeLocacoes { get; set; }
    public List<FilhoDto> Filhos { get; set; } = new();
}

public class FilhoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateOnly? DataNascimento { get; set; }
    public string? Sexo { get; set; }
}

public class FilhoUpsertRequest
{
    /// <summary>Nulo = filho novo (será criado). Preenchido = filho existente (será atualizado).</summary>
    public int? Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public DateOnly? DataNascimento { get; set; }
    public string? Sexo { get; set; }
}

public class ClienteUpsertRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Cpf { get; set; } = string.Empty;
    public string? Rg { get; set; }
    public string Ddd { get; set; } = string.Empty;
    public string Telefone { get; set; } = string.Empty;
    public string? DddCelular { get; set; }
    public string? Celular { get; set; }
    public string? Email { get; set; }
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Numero { get; set; }
    public string? Complemento { get; set; }
    public string? Cidade { get; set; }
    public string? Uf { get; set; }
    public DateOnly? DataNascimento { get; set; }
    public string? Profissao { get; set; }
    public string? ClasseSocial { get; set; }
    public string? Sexo { get; set; }
    public string? Observacao { get; set; }
    public List<FilhoUpsertRequest> Filhos { get; set; } = new();
}
