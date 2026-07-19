using BabyFrota.DTOs.Carrinhos;
using BabyFrota.Services.Carrinhos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

/// <summary>
/// CRUD de referência (fatia vertical de demonstração da arquitetura). Os demais cadastros
/// (Cliente, Usuário, Carrinho, PrecoLocacao...) seguem exatamente este mesmo padrão.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TipoCarrinhoController : ControllerBase
{
    private readonly ITipoCarrinhoService _service;

    public TipoCarrinhoController(ITipoCarrinhoService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<TipoCarrinhoDto>>> Listar(CancellationToken ct)
        => Ok(await _service.ListarAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TipoCarrinhoDto>> ObterPorId(int id, CancellationToken ct)
    {
        var item = await _service.ObterPorIdAsync(id, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<ActionResult<TipoCarrinhoDto>> Criar([FromBody] TipoCarrinhoUpsertRequest request, CancellationToken ct)
    {
        var criado = await _service.CriarAsync(request, ct);
        return CreatedAtAction(nameof(ObterPorId), new { id = criado.Id }, criado);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TipoCarrinhoDto>> Atualizar(int id, [FromBody] TipoCarrinhoUpsertRequest request, CancellationToken ct)
        => Ok(await _service.AtualizarAsync(id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        await _service.ExcluirAsync(id, ct);
        return NoContent();
    }
}
