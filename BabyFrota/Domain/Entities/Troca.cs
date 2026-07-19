using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Troca
{
    public int Cdtroca { get; set; }

    public int Cdlocacao { get; set; }

    public int CdcarrinhoAnterior { get; set; }

    public int CdnovoCarrinho { get; set; }

    public decimal? PrecoCarrinhoAnterior { get; set; }

    public int? TempoCarrinhoAnterior { get; set; }

    public DateTime Dttroca { get; set; }

    public int CdusuarioTroca { get; set; }

    public virtual Carrinho CdcarrinhoAnteriorNavigation { get; set; } = null!;

    public virtual Locacao CdlocacaoNavigation { get; set; } = null!;

    public virtual Carrinho CdnovoCarrinhoNavigation { get; set; } = null!;
}
