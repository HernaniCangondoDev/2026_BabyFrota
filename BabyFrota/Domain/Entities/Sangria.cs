using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Sangria
{
    public int Cdsangria { get; set; }

    public int CdcaixaMovimento { get; set; }

    public int Cdusuario { get; set; }

    public DateTime Dtsangria { get; set; }

    public decimal Valor { get; set; }

    public virtual CaixaMovimento CdcaixaMovimentoNavigation { get; set; } = null!;

    public virtual Usuario CdusuarioNavigation { get; set; } = null!;
}
