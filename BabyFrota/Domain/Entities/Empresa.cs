using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Empresa
{
    public int Cdempresa { get; set; }

    public string Cnpj { get; set; } = null!;

    public string RazaoSocial { get; set; } = null!;

    public string ResponsavelLegal { get; set; } = null!;

    public string? Cep { get; set; }

    public string? Logradouro { get; set; }

    public string? Complemento { get; set; }

    public string? Nrlogradouro { get; set; }

    public string? Ddd { get; set; }

    public string? Telefone { get; set; }

    public string? Celular { get; set; }

    public byte[]? Logomarca { get; set; }

    public string? MimeLogomarca { get; set; }
}
