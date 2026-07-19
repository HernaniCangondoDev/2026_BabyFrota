using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Locacao
{
    public int Cdlocacao { get; set; }

    public int Cdcarrinho { get; set; }

    public DateTime Dtentrega { get; set; }

    public int CdusuarioEntrega { get; set; }

    public DateTime? Dtdevolucao { get; set; }

    public int? CdusuarioDevolucao { get; set; }

    public int Cdcliente { get; set; }

    public int? Tempo { get; set; }

    public decimal? Desconto { get; set; }

    public string? Observacao { get; set; }

    public decimal? Troco { get; set; }

    public int CdcaixaMovimento { get; set; }

    public decimal? ValorTotal { get; set; }

    public virtual CaixaMovimento CdcaixaMovimentoNavigation { get; set; } = null!;

    public virtual Carrinho CdcarrinhoNavigation { get; set; } = null!;

    public virtual Cliente CdclienteNavigation { get; set; } = null!;

    public virtual Usuario? CdusuarioDevolucaoNavigation { get; set; }

    public virtual Usuario CdusuarioEntregaNavigation { get; set; } = null!;

    public virtual ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();

    public virtual ICollection<Troca> Trocas { get; set; } = new List<Troca>();
}
