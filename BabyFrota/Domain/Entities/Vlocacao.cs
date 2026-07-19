using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Vlocacao
{
    public DateTime Dtentrega { get; set; }

    public string UsuarioEntrega { get; set; } = null!;

    public string Carrinho { get; set; } = null!;

    public string TipoCarrinho { get; set; } = null!;

    public string Cliente { get; set; } = null!;

    public int? Tempo { get; set; }

    public decimal? Valor { get; set; }

    public decimal? Desconto { get; set; }

    public decimal? ValorRecebido { get; set; }

    public string FormaRecebimento { get; set; } = null!;

    public DateTime? Dtdevolucao { get; set; }

    public string UsuarioDevolucao { get; set; } = null!;

    public string? Observacao { get; set; }
}
