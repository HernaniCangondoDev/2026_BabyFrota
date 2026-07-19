namespace BabyFrota.Services.Auth;

public interface IPasswordHasher
{
    string Hash(string senhaTextoPlano);
    bool Verify(string senhaTextoPlano, string hashArmazenado);
}
