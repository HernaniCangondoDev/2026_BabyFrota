namespace BabyFrota.Services.Auth;

/// <summary>
/// Hash de senha via BCrypt (padrão moderno, com salt embutido).
///
/// ATENÇÃO — compatibilidade com o banco legado:
/// as senhas atuais em Usuario.Senha foram gravadas pelo sistema antigo usando
/// WayCommerce.Comum.Seguranca.Simetrica.Encryptar (criptografia simétrica proprietária,
/// não um hash). Este serviço NÃO consegue validar esses valores existentes.
/// Antes de ir para produção é preciso decidir com o time:
///   a) obter o algoritmo/chave da WayCommerce para validar a senha antiga no primeiro
///      login e then regravar como hash BCrypt (migração transparente); ou
///   b) forçar reset de senha de todos os usuários na virada para o novo sistema.
/// Ver anotação também em AuthService.Login.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    public string Hash(string senhaTextoPlano) => BCrypt.Net.BCrypt.HashPassword(senhaTextoPlano);

    public bool Verify(string senhaTextoPlano, string hashArmazenado)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(senhaTextoPlano, hashArmazenado);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // hashArmazenado não está em formato BCrypt (provavelmente veio do sistema legado).
            return false;
        }
    }
}
