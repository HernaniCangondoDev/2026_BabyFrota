using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Vtroca
{
    public DateTime DthoraTroca { get; set; }

    public string Usuario { get; set; } = null!;

    public int TempoCarrinhoAnterior { get; set; }

    public decimal PrecoCarrinhoAnterior { get; set; }

    public int CodigoCarrinhoAnterior { get; set; }

    public string DescricaoCarrinhoAnterior { get; set; } = null!;

    public int CodigoNovoCarrinho { get; set; }

    public string DescricaoNovoCarrinho { get; set; } = null!;

    public DateTime DthoraLocacao { get; set; }

    public int Cliente { get; set; }
}
