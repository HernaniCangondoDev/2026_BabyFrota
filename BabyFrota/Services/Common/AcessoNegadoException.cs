namespace BabyFrota.Services.Common;

/// <summary>
/// O usuário está autenticado, mas o perfil dele não permite a operação (HTTP 403).
/// Não usar <see cref="UnauthorizedAccessException"/> para isso: ela vira 401, e o front faz logout em todo 401.
/// </summary>
public class AcessoNegadoException : Exception
{
    public AcessoNegadoException(string message) : base(message)
    {
    }
}
