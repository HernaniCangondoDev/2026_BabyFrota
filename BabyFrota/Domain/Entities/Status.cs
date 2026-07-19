using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Status
{
    public int Cdstatus { get; set; }

    public string Nome { get; set; } = null!;

    public virtual ICollection<Carrinho> Carrinhos { get; set; } = new List<Carrinho>();
}
