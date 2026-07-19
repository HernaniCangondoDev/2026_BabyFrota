using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Usuario
{
    public int Cdusuario { get; set; }

    public int Cdperfil { get; set; }

    public string Nome { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Senha { get; set; } = null!;

    public string? Cpf { get; set; }

    public string? Rg { get; set; }

    public DateOnly? Dtnascimento { get; set; }

    public string? Telefone { get; set; }

    public string? Celular { get; set; }

    public string? Ddd { get; set; }

    public string? Dddcelular { get; set; }

    public string? Referencias { get; set; }

    public string? NrcarteiraTrabalho { get; set; }

    public DateOnly? Dtadmissao { get; set; }

    public byte[]? Foto { get; set; }

    public byte[]? Documento { get; set; }

    public string? MimeFoto { get; set; }

    public string? MimeDocumento { get; set; }

    public string? Cep { get; set; }

    public string? Logradouro { get; set; }

    public string? Complemento { get; set; }

    public string? Nrlogradouro { get; set; }

    public string? Observacao { get; set; }

    public bool Stativo { get; set; }

    public DateTime? DataCadastro { get; set; }

    public int? CdusuarioCadastro { get; set; }

    public DateTime? DataAlteracao { get; set; }

    public int? CdusuarioAlteracao { get; set; }

    public string? Cidade { get; set; }

    public string? Uf { get; set; }

    public virtual ICollection<CaixaMovimento> CaixaMovimentoCdusuarioAberturaNavigations { get; set; } = new List<CaixaMovimento>();

    public virtual ICollection<CaixaMovimento> CaixaMovimentoCdusuarioFechamentoNavigations { get; set; } = new List<CaixaMovimento>();

    public virtual Perfil CdperfilNavigation { get; set; } = null!;

    public virtual ICollection<Locacao> LocacaoCdusuarioDevolucaoNavigations { get; set; } = new List<Locacao>();

    public virtual ICollection<Locacao> LocacaoCdusuarioEntregaNavigations { get; set; } = new List<Locacao>();

    public virtual ICollection<Sangria> Sangrias { get; set; } = new List<Sangria>();

    public virtual ICollection<Suprimento> Suprimentos { get; set; } = new List<Suprimento>();

    public virtual ICollection<LogAuditoria> LogsAuditoria { get; set; } = new List<LogAuditoria>();
}
