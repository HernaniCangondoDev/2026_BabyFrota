using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Carrinho
{
    public int Cdcarrinho { get; set; }

    public string Descricao { get; set; } = null!;

    public int CdtipoCarrinho { get; set; }

    public byte[]? Foto { get; set; }

    public string? MimeFoto { get; set; }

    public DateOnly Dtaquisicao { get; set; }

    public string Fornecedor { get; set; } = null!;

    public byte[]? DocumentoCompra { get; set; }

    public string? MimeDocumentoCompra { get; set; }

    public decimal ValorAquisicao { get; set; }

    public string? Observacao { get; set; }

    public int Cdstatus { get; set; }

    public DateTime? DataCadastro { get; set; }

    public int? CdusuarioCadastro { get; set; }

    public DateTime? DataAlteracao { get; set; }

    public int? CdusuarioAlteracao { get; set; }

    public virtual Status CdstatusNavigation { get; set; } = null!;

    public virtual TipoCarrinho CdtipoCarrinhoNavigation { get; set; } = null!;

    public virtual ICollection<Locacao> Locacoes { get; set; } = new List<Locacao>();

    public virtual ICollection<Troca> TrocaCdcarrinhoAnteriorNavigations { get; set; } = new List<Troca>();

    public virtual ICollection<Troca> TrocaCdnovoCarrinhoNavigations { get; set; } = new List<Troca>();
}
