using System.Security.Claims;
using BabyFrota.DTOs.Caixa;
using BabyFrota.DTOs.Common;
using BabyFrota.Services.Caixas;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CaixaController : ControllerBase
{
    private readonly ICaixaService _service;
    private readonly IFluxoCaixaService _fluxo;

    public CaixaController(ICaixaService service, IFluxoCaixaService fluxo)
    {
        _service = service;
        _fluxo = fluxo;
    }

    private int UsuarioIdAtual =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token sem identificação de usuário."));

    /// <summary>GET /api/caixa/aberto — 404 se não houver caixa aberto no momento.</summary>
    [HttpGet("aberto")]
    public async Task<ActionResult<CaixaMovimentoDto>> ObterAberto(CancellationToken ct)
    {
        var caixa = await _service.ObterAbertoAsync(UsuarioIdAtual, ct);
        return caixa is null ? NotFound() : Ok(caixa);
    }

    [HttpPost("abertura")]
    public async Task<ActionResult<CaixaMovimentoDto>> Abrir([FromBody] AberturaCaixaRequest request, CancellationToken ct)
        => Ok(await _service.AbrirAsync(UsuarioIdAtual, request, ct));

    /// <summary>Fecha o caixa aberto, sem corpo (como no legado, nenhum valor é digitado). 403 se o usuário não puder fechá-lo.</summary>
    [HttpPost("fechamento")]
    public async Task<ActionResult<CaixaMovimentoDto>> Fechar(CancellationToken ct)
        => Ok(await _service.FecharAsync(UsuarioIdAtual, ct));

    /// <summary>GET /api/caixa/fluxo — caixas do filtro, paginados (Administrador e Gerente veem todos; os demais, só os seus).</summary>
    [HttpGet("fluxo")]
    public async Task<ActionResult<PagedResult<FluxoCaixaDto>>> ListarFluxo([FromQuery] FluxoCaixaFiltro filtro, CancellationToken ct)
        => Ok(await _fluxo.ListarAsync(UsuarioIdAtual, filtro, ct));

    /// <summary>GET /api/caixa/fluxo/resumo — indicadores, série por dia e recebimento por utilizador do mesmo filtro.</summary>
    [HttpGet("fluxo/resumo")]
    public async Task<ActionResult<FluxoCaixaResumoDto>> ObterResumoFluxo([FromQuery] FluxoCaixaFiltro filtro, CancellationToken ct)
        => Ok(await _fluxo.ObterResumoAsync(UsuarioIdAtual, filtro, ct));

    [HttpGet("suprimentos")]
    public async Task<ActionResult<List<MovimentoCaixaDto>>> ListarSuprimentos(CancellationToken ct)
        => Ok(await _service.ListarSuprimentosAsync(ct));

    [HttpPost("suprimentos")]
    public async Task<ActionResult<MovimentoCaixaDto>> RegistrarSuprimento([FromBody] MovimentoCaixaRequest request, CancellationToken ct)
        => Ok(await _service.RegistrarSuprimentoAsync(UsuarioIdAtual, request.Valor, ct));

    [HttpGet("sangrias")]
    public async Task<ActionResult<List<MovimentoCaixaDto>>> ListarSangrias(CancellationToken ct)
        => Ok(await _service.ListarSangriasAsync(ct));

    [HttpPost("sangrias")]
    public async Task<ActionResult<MovimentoCaixaDto>> RegistrarSangria([FromBody] MovimentoCaixaRequest request, CancellationToken ct)
        => Ok(await _service.RegistrarSangriaAsync(UsuarioIdAtual, request.Valor, ct));
}
