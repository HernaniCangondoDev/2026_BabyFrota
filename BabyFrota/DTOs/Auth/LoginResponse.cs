namespace BabyFrota.DTOs.Auth;

public class LoginResponse
{
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiraEm { get; set; }
    public UsuarioLogadoDto Usuario { get; set; } = null!;
}

/// <summary>Dados do usuário autenticado, incluindo o perfil (usado pelo front para montar menus/permissões).</summary>
public class UsuarioLogadoDto
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int PerfilId { get; set; }
    public string PerfilNome { get; set; } = string.Empty;
}
