using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Cliente
{
    public int Cdcliente { get; set; }

    public string Nome { get; set; } = null!;

    public string Cpf { get; set; } = null!;

    public string? Rg { get; set; }

    public string Dddtelefone { get; set; } = null!;

    public string? Dddcelular { get; set; }

    public string Telefone { get; set; } = null!;

    public string? Celular { get; set; }

    public string? Email { get; set; }

    public string? Cep { get; set; }

    public string? Logradouro { get; set; }

    public string? Complemento { get; set; }

    public string? Nrlogradouro { get; set; }

    public byte[]? Foto { get; set; }

    public byte[]? Documento { get; set; }

    public string? MimeFoto { get; set; }

    public string? MimeDocumento { get; set; }

    public string? Cidade { get; set; }

    public string? Uf { get; set; }

    public DateTime? DataCadastro { get; set; }

    public int? CdusuarioCadastro { get; set; }

    public DateTime? DataAlteracao { get; set; }

    public int? CdusuarioAlteracao { get; set; }

    public string? Profissao { get; set; }

    public DateOnly? Dtnascimento { get; set; }

    public string? ClasseSocial { get; set; }

    public string? Tpsexo { get; set; }

    public string? Observacao { get; set; }

    public virtual ICollection<Filho> Filhos { get; set; } = new List<Filho>();

    public virtual ICollection<Locacao> Locacoes { get; set; } = new List<Locacao>();
}
