using BabyFrota.Domain.Entities;

namespace BabyFrota.Services.Auth;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiraEm) Gerar(Usuario usuario);
}
