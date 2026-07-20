namespace BabyFrota.DTOs.Empresa;

public class EmpresaDto
{
    public int Id { get; set; }
    public string Cnpj { get; set; } = string.Empty;
    public string RazaoSocial { get; set; } = string.Empty;
    public string ResponsavelLegal { get; set; } = string.Empty;
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Complemento { get; set; }
    public string? Numero { get; set; }
    public string? Ddd { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
}

public class EmpresaUpsertRequest
{
    public string Cnpj { get; set; } = string.Empty;
    public string RazaoSocial { get; set; } = string.Empty;
    public string ResponsavelLegal { get; set; } = string.Empty;
    public string? Cep { get; set; }
    public string? Logradouro { get; set; }
    public string? Complemento { get; set; }
    public string? Numero { get; set; }
    public string? Ddd { get; set; }
    public string? Telefone { get; set; }
    public string? Celular { get; set; }
}
