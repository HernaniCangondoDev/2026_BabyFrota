using BabyFrota.DTOs.Ceps;
using BabyFrota.Services.Ceps;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CepController : ControllerBase
{
    private readonly ICepService _service;

    public CepController(ICepService service)
    {
        _service = service;
    }

    /// <summary>GET /api/cep/01001000 — autopreenchimento de endereço (usado no cadastro de Cliente).</summary>
    [HttpGet("{cep}")]
    public async Task<ActionResult<CepDto>> Consultar(string cep, CancellationToken ct)
    {
        var resultado = await _service.ConsultarAsync(cep, ct);
        return resultado is null ? NotFound(new { mensagem = "CEP não encontrado." }) : Ok(resultado);
    }
}
