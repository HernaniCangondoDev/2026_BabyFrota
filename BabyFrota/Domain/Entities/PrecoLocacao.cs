using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class PrecoLocacao
{
    public int CdprecoLocacao { get; set; }

    public int CdtipoCarrinho { get; set; }

    public int MinimoMinutos { get; set; }

    public int MaximoMinutos { get; set; }

    public decimal Valor { get; set; }

    public virtual TipoCarrinho CdtipoCarrinhoNavigation { get; set; } = null!;
}
