using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Uf
{
    public int Cduf { get; set; }

    public string Uf1 { get; set; } = null!;

    public string Descricao { get; set; } = null!;

    public string Regiao { get; set; } = null!;

    public string Pais { get; set; } = null!;

    public bool StfreteGratuito { get; set; }

    public decimal? VlminVendaFreteGratuito { get; set; }

    public string? Nrufibge { get; set; }

    public string? NrmunicipioIbge { get; set; }

    public string? NrcodPais { get; set; }

    public virtual ICollection<Localidade> Localidades { get; set; } = new List<Localidade>();
}
