using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Bairro
{
    public int Cdbairro { get; set; }

    public int Cdlocalidade { get; set; }

    public string Bairro1 { get; set; } = null!;

    public string? Chvbai { get; set; }

    public virtual Localidade CdlocalidadeNavigation { get; set; } = null!;

    public virtual ICollection<Cep> Ceps { get; set; } = new List<Cep>();
}
