using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Tblog
{
    public int Cdlog { get; set; }

    public int? Cdusuario { get; set; }

    public string Acao { get; set; } = null!;

    public DateTime Data { get; set; }

    public string Tabela { get; set; } = null!;

    public string? ColunasModificadas { get; set; }

    public string Ip { get; set; } = null!;

    public string? ValorNovo { get; set; }

    public string? ValorAntigo { get; set; }

    public virtual Usuario? CdusuarioNavigation { get; set; }
}
