using BabyFrota.Services.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Middleware;

/// <summary>
/// Converte exceções de negócio lançadas pelos Services em respostas HTTP padronizadas (ProblemDetails),
/// evitando try/catch repetido em cada Controller.
/// </summary>
public class ApiExceptionHandler : IExceptionHandler
{
    private readonly ILogger<ApiExceptionHandler> _logger;

    public ApiExceptionHandler(ILogger<ApiExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Não autorizado"),
            AcessoNegadoException => (StatusCodes.Status403Forbidden, "Acesso negado"),
            KeyNotFoundException => (StatusCodes.Status404NotFound, "Recurso não encontrado"),
            InvalidOperationException => (StatusCodes.Status400BadRequest, "Operação inválida"),
            ArgumentException => (StatusCodes.Status400BadRequest, "Requisição inválida"),
            _ => (StatusCodes.Status500InternalServerError, "Erro interno"),
        };

        if (status == StatusCodes.Status500InternalServerError)
            _logger.LogError(exception, "Erro não tratado em {Path}", httpContext.Request.Path);

        httpContext.Response.StatusCode = status;

        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message,
            Instance = httpContext.Request.Path,
        }, cancellationToken);

        return true;
    }
}
