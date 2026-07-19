using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class CaixaMovimento
{
    public int CdcaixaMovimento { get; set; }

    public DateTime Dtabertura { get; set; }

    public DateTime? Dtfechamento { get; set; }

    public int CdusuarioAbertura { get; set; }

    public int? CdusuarioFechamento { get; set; }

    public decimal SuprimentoInicial { get; set; }

    public decimal? ValorFechamento { get; set; }

    public virtual Usuario CdusuarioAberturaNavigation { get; set; } = null!;

    public virtual Usuario? CdusuarioFechamentoNavigation { get; set; }

    public virtual ICollection<Locacao> Locacaos { get; set; } = new List<Locacao>();

    public virtual ICollection<Sangrium> Sangria { get; set; } = new List<Sangrium>();

    public virtual ICollection<Suprimento> Suprimentos { get; set; } = new List<Suprimento>();
}
