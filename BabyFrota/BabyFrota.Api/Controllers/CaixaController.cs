using System.Security.Claims;
using BabyFrota.DTOs.Caixa;
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

    public CaixaController(ICaixaService service)
    {
        _service = service;
    }

    private int UsuarioIdAtual =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token sem identificação de usuário."));

    /// <summary>GET /api/caixa/aberto — 404 se não houver caixa aberto no momento.</summary>
    [HttpGet("aberto")]
    public async Task<ActionResult<CaixaMovimentoDto>> ObterAberto(CancellationToken ct)
    {
        var caixa = await _service.ObterAbertoAsync(ct);
        return caixa is null ? NotFound() : Ok(caixa);
    }

    [HttpPost("abertura")]
    public async Task<ActionResult<CaixaMovimentoDto>> Abrir([FromBody] AberturaCaixaRequest request, CancellationToken ct)
        => Ok(await _service.AbrirAsync(UsuarioIdAtual, request, ct));

    [HttpPost("fechamento")]
    public async Task<ActionResult<CaixaMovimentoDto>> Fechar([FromBody] FechamentoCaixaRequest request, CancellationToken ct)
        => Ok(await _service.FecharAsync(UsuarioIdAtual, request, ct));

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
