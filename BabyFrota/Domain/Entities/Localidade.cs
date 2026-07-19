using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Localidade
{
    public int Cdlocalidade { get; set; }

    public string Localidade1 { get; set; } = null!;

    public int Cduf { get; set; }

    public short Ddd { get; set; }

    public string? Chaveloc { get; set; }

    public string? CdmunicipioIbge { get; set; }

    public virtual ICollection<Bairro> Bairros { get; set; } = new List<Bairro>();

    public virtual Uf CdufNavigation { get; set; } = null!;
}
