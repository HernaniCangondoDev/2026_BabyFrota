using System.Security.Claims;
using BabyFrota.DTOs.Common;
using BabyFrota.DTOs.Locacoes;
using BabyFrota.Services.Locacoes;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BabyFrota.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LocacaoController : ControllerBase
{
    private readonly ILocacaoService _service;
    private readonly ILocacaoConsultaService _consulta;

    public LocacaoController(ILocacaoService service, ILocacaoConsultaService consulta)
    {
        _service = service;
        _consulta = consulta;
    }

    private int UsuarioIdAtual =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token sem identificação de usuário."));

    [HttpGet("carrinhos-disponiveis")]
    public async Task<ActionResult<List<CarrinhoDisponivelDto>>> ListarCarrinhosDisponiveis(CancellationToken ct)
        => Ok(await _service.ListarCarrinhosDisponiveisAsync(ct));

    [HttpGet("carrinhos/{carrinhoId:int}/precos")]
    public async Task<ActionResult<List<FaixaPrecoDto>>> ListarFaixasPreco(int carrinhoId, CancellationToken ct)
        => Ok(await _service.ListarFaixasPrecoAsync(carrinhoId, ct));

    [HttpGet("formas-recebimento")]
    public async Task<ActionResult<List<FormaRecebimentoDto>>> ListarFormasRecebimento(CancellationToken ct)
        => Ok(await _service.ListarFormasRecebimentoAsync(ct));

    /// <summary>GET /api/locacao/consulta — todas as locações (entregues e devolvidas) com filtros, paginadas.</summary>
    [HttpGet("consulta")]
    public async Task<ActionResult<PagedResult<LocacaoConsultaDto>>> Consultar([FromQuery] LocacaoConsultaFiltro filtro, CancellationToken ct)
        => Ok(await _consulta.ConsultarAsync(filtro, ct));

    /// <summary>GET /api/locacao/consulta/resumo — totais de todas as locações do mesmo filtro.</summary>
    [HttpGet("consulta/resumo")]
    public async Task<ActionResult<LocacaoConsultaResumoDto>> ObterResumoConsulta([FromQuery] LocacaoConsultaFiltro filtro, CancellationToken ct)
        => Ok(await _consulta.ObterResumoAsync(filtro, ct));

    /// <summary>GET /api/locacao/{id}/detalhe — pagamentos, trocas, observação e demais dados (modal de detalhes e comprovantes).</summary>
    [HttpGet("{locacaoId:int}/detalhe")]
    public async Task<ActionResult<LocacaoDetalheDto>> ObterDetalhe(int locacaoId, CancellationToken ct)
        => Ok(await _consulta.ObterDetalheAsync(locacaoId, ct));

    [HttpGet("em-andamento")]
    public async Task<ActionResult<List<LocacaoDto>>> ListarEmAndamento(CancellationToken ct)
        => Ok(await _service.ListarEmAndamentoAsync(ct));

    [HttpPost("entrega")]
    public async Task<ActionResult<LocacaoDto>> RegistrarEntrega([FromBody] EntregaRequest request, CancellationToken ct)
        => Ok(await _service.RegistrarEntregaAsync(UsuarioIdAtual, request, ct));

    [HttpGet("{locacaoId:int}/carrinhos-para-troca")]
    public async Task<ActionResult<List<CarrinhoDisponivelDto>>> ListarCarrinhosParaTroca(int locacaoId, CancellationToken ct)
        => Ok(await _service.ListarCarrinhosParaTrocaAsync(locacaoId, ct));

    [HttpPost("{locacaoId:int}/troca")]
    public async Task<ActionResult<LocacaoDto>> TrocarCarrinho(int locacaoId, [FromBody] TrocaCarrinhoRequest request, CancellationToken ct)
        => Ok(await _service.TrocarCarrinhoAsync(UsuarioIdAtual, locacaoId, request, ct));

    [HttpGet("{locacaoId:int}/trocas")]
    public async Task<ActionResult<List<TrocaDto>>> ListarTrocas(int locacaoId, CancellationToken ct)
        => Ok(await _service.ListarTrocasAsync(locacaoId, ct));

    [HttpGet("{locacaoId:int}/previa-devolucao")]
    public async Task<ActionResult<PreviaDevolucaoDto>> ObterPreviaDevolucao(int locacaoId, CancellationToken ct)
        => Ok(await _service.ObterPreviaDevolucaoAsync(locacaoId, ct));

    [HttpPost("{locacaoId:int}/devolucao")]
    public async Task<ActionResult<LocacaoDto>> RegistrarDevolucao(int locacaoId, [FromBody] DevolucaoRequest request, CancellationToken ct)
        => Ok(await _service.RegistrarDevolucaoAsync(UsuarioIdAtual, locacaoId, request, ct));
}
