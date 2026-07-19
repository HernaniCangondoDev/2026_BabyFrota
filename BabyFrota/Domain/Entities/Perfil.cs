using System;
using System.Collections.Generic;

namespace BabyFrota.Domain.Entities;

public partial class Perfil
{
    public int Cdperfil { get; set; }

    public string Nome { get; set; } = null!;

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
