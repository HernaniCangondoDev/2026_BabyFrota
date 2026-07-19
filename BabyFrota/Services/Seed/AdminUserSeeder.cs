using BabyFrota.Data;
using BabyFrota.Domain.Entities;
using BabyFrota.Domain.Enums;
using BabyFrota.Services.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BabyFrota.Services.Seed;

/// <summary>
/// Garante que exista pelo menos um usuário com perfil Administrador, para permitir o primeiro
/// acesso ao sistema novo. Idempotente e seguro para rodar a cada subida da API — NÃO usa EF
/// Migrations (o banco é o mesmo do sistema legado, já em produção).
///
/// Credenciais configuráveis em appsettings, seção "Seed:AdminUser" (Nome/Email/Senha).
/// Se nenhuma for informada, usa um padrão que DEVE ser trocado no primeiro login.
/// </summary>
public class AdminUserSeeder
{
    private readonly AppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AdminUserSeeder> _logger;

    public AdminUserSeeder(
        AppDbContext db,
        IPasswordHasher passwordHasher,
        IConfiguration configuration,
        ILogger<AdminUserSeeder> logger)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        var perfilAdminId = (int)PerfilSistema.Administrador;

        var perfilExiste = await _db.Perfis.AnyAsync(p => p.Cdperfil == perfilAdminId, ct);
        if (!perfilExiste)
        {
            _logger.LogWarning(
                "Seed de administrador ignorado: não existe registro em Perfil com CDPerfil={PerfilId}.",
                perfilAdminId);
            return;
        }

        var jaExisteAdministrador = await _db.Usuarios.AnyAsync(u => u.Cdperfil == perfilAdminId, ct);
        if (jaExisteAdministrador)
            return;

        var nome = _configuration["Seed:AdminUser:Nome"] ?? "Administrador";
        var email = _configuration["Seed:AdminUser:Email"] ?? "admin@babyfrota.com.br";
        var senha = _configuration["Seed:AdminUser:Senha"] ?? "TrocarSenha@123";

        if (await _db.Usuarios.AnyAsync(u => u.Email == email, ct))
        {
            _logger.LogWarning(
                "Seed de administrador ignorado: já existe um usuário com o email {Email} (com outro perfil).",
                email);
            return;
        }

        _db.Usuarios.Add(new Usuario
        {
            Cdperfil = perfilAdminId,
            Nome = nome,
            Email = email,
            Senha = _passwordHasher.Hash(senha),
            Stativo = true,
            DataCadastro = DateTime.Now,
        });

        await _db.SaveChangesAsync(ct);

        _logger.LogWarning(
            "Usuário administrativo criado automaticamente — Email: {Email} / Senha inicial: {Senha}. " +
            "Troque essa senha assim que possível (ou configure Seed:AdminUser em appsettings antes de subir em produção).",
            email, senha);
    }
}
