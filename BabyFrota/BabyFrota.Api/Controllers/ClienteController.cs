using BabyFrota.DTOs.Clientes;
using BabyFrota.DTOs.Common;
using BabyFrota.Services.Clientes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClienteController : ControllerBase
{
    private readonly IClienteService _service;

    public ClienteController(IClienteService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ClienteDto>>> Listar(
        [FromQuery] string? nome, [FromQuery] string? cpf,
        [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 10, CancellationToken ct = default)
        => Ok(await _service.ListarAsync(nome, cpf, pagina, tamanhoPagina, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteDto>> ObterPorId(int id, CancellationToken ct)
    {
        var cliente = await _service.ObterPorIdAsync(id, ct);
        return cliente is null ? NotFound() : Ok(cliente);
    }

    [HttpPost]
    public async Task<ActionResult<ClienteDto>> Criar([FromBody] ClienteUpsertRequest request, CancellationToken ct)
    {
        var criado = await _service.CriarAsync(request, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, criado);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ClienteDto>> Atualizar(int id, [FromBody] ClienteUpsertRequest request, CancellationToken ct)
        => Ok(await _service.AtualizarAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        await _service.ExcluirAsync(id, ct);
        return NoContent();
    }
}
