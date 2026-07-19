using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class TipoCarrinho
{
    public int CdtipoCarrinho { get; set; }

    public string Descricao { get; set; } = null!;

    public virtual ICollection<Carrinho> Carrinhos { get; set; } = new List<Carrinho>();

    public virtual ICollection<PrecoLocacao> PrecoLocacoes { get; set; } = new List<PrecoLocacao>();
}
