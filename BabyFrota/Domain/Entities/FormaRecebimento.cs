using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class FormaRecebimento
{
    public int CdformaRecebimento { get; set; }

    public string Nome { get; set; } = null!;

    public virtual ICollection<Parcela> Parcelas { get; set; } = new List<Parcela>();
}
