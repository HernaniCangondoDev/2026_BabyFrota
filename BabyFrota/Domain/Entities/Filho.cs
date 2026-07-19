using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Filho
{
    public int Cdfilho { get; set; }

    public int Cdcliente { get; set; }

    public string Nome { get; set; } = null!;

    public DateOnly? Dtnascimento { get; set; }

    public string? Tpsexo { get; set; }

    public virtual Cliente CdclienteNavigation { get; set; } = null!;
}
