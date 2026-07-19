using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Cep
{
    public int Cep1 { get; set; }

    public int Cdbairro { get; set; }

    public string Logradouro { get; set; } = null!;

    public bool Stbloqueado { get; set; }

    public bool Statualizado { get; set; }

    public virtual Bairro CdbairroNavigation { get; set; } = null!;
}
