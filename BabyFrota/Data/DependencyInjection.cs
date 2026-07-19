using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BabyFrota.Data;

/// <summary>
/// Ponto único de registro da camada de acesso a dados (EF Core + SQL Server) no container de DI.
/// O contexto se conecta ao MESMO banco do sistema legado (Database First) — não usamos
/// Migrations aqui para não divergir da estrutura já validada em produção.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddData(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection não configurada.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
            {
                sql.EnableRetryOnFailure(maxRetryCount: 3);
                sql.CommandTimeout(30);
            }));

        return services;
    }
}
