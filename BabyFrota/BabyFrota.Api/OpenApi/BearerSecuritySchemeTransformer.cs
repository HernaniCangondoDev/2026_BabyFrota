using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace BabyFrota.Api.OpenApi;

/// <summary>
/// Adiciona o esquema de segurança Bearer (JWT) ao documento OpenAPI nativo do .NET 10.
/// API do pacote Microsoft.OpenApi 2.x: os tipos vivem em "Microsoft.OpenApi" (não mais
/// "Microsoft.OpenApi.Models").
///
/// Só registramos o esquema no nível do documento (habilita o botão "Authorize" no
/// Swagger UI). NÃO aplicamos "OpenApiSecuritySchemeReference" por operação: há um bug
/// conhecido no .NET 10 onde essa referência não resolve e gera "security: [{}]" vazio
/// no JSON (https://github.com/dotnet/aspnetcore/issues/64524) — sem efeito prático aqui,
/// já que a autenticação real é garantida pelo [Authorize] nos Controllers.
/// </summary>
public class BearerSecuritySchemeTransformer : IOpenApiDocumentTransformer
{
    private readonly IAuthenticationSchemeProvider _authenticationSchemeProvider;

    public BearerSecuritySchemeTransformer(IAuthenticationSchemeProvider authenticationSchemeProvider)
    {
        _authenticationSchemeProvider = authenticationSchemeProvider;
    }

    public async Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        var schemes = await _authenticationSchemeProvider.GetAllSchemesAsync();
        if (!schemes.Any(s => s.Name == "Bearer"))
            return;

        var securityScheme = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Informe: Bearer {seu token}",
        };

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = securityScheme,
        };
    }
}
