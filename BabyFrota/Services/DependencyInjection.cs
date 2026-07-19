using BabyFrota.Services.Auth;
using BabyFrota.Services.Carrinhos;
using BabyFrota.Services.Dashboard;
using BabyFrota.Services.Seed;
using BabyFrota.Services.Usuarios;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BabyFrota.Services;

/// <summary>Registro dos serviços de aplicação (regras de negócio) no container de DI.</summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IAuthService, AuthService>();

        services.AddScoped<ITipoCarrinhoService, TipoCarrinhoService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUsuarioService, UsuarioService>();

        services.AddScoped<AdminUserSeeder>();

        return services;
    }
}
