using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Parcela
{
    public int Cdlocacao { get; set; }

    public int Nrparcela { get; set; }

    public int CdformaRecebimento { get; set; }

    public decimal ValorRecebido { get; set; }

    public virtual FormaRecebimento CdformaRecebimentoNavigation { get; set; } = null!;

    public virtual Locacao CdlocacaoNavigation { get; set; } = null!;
}
