using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.DTOs.Auth;
using Microsoft.EntityFrameworkCore;

namespace BabyFrota.Services.Auth;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _tokenGenerator;

    public AuthService(AppDbContext db, IPasswordHasher passwordHasher, IJwtTokenGenerator tokenGenerator)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string enderecoIp, CancellationToken ct = default)
    {
        var usuario = await _db.Usuarios
            .Include(u => u.CdperfilNavigation)
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        // TODO(compatibilidade legada): ver observação em PasswordHasher — usuários migrados do
        // sistema antigo ainda não têm hash BCrypt válido. Enquanto a estratégia de migração de
        // senha não for definida, esses usuários precisarão de reset de senha.
        if (usuario is null || !_passwordHasher.Verify(request.Senha, usuario.Senha))
            throw new UnauthorizedAccessException("Email ou senha inválidos.");

        if (!usuario.Stativo)
            throw new UnauthorizedAccessException("Usuário inativo no sistema.");

        _db.LogsAuditoria.Add(new LogAuditoria
        {
            Cdusuario = usuario.Cdusuario,
            Acao = "Login",
            Data = DateTime.Now,
            Tabela = "Usuario",
            Ip = enderecoIp,
        });
        await _db.SaveChangesAsync(ct);

        var (token, expiraEm) = _tokenGenerator.Gerar(usuario);

        return new LoginResponse
        {
            Token = token,
            ExpiraEm = expiraEm,
            Usuario = new UsuarioLogadoDto
            {
                Id = usuario.Cdusuario,
                Nome = usuario.Nome,
                Email = usuario.Email,
                PerfilId = usuario.Cdperfil,
                PerfilNome = usuario.CdperfilNavigation.Nome,
            },
        };
    }
}
