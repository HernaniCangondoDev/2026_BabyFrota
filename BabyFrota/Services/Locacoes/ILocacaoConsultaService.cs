using BabyFrota.DTOs.Common;
using BabyFrota.DTOs.Locacoes;

namespace BabyFrota.Services.Locacoes;

/// <summary>Consulta de locações para a tela "Locações": lista com filtros, totais e detalhe. Só leitura.</summary>
public interface ILocacaoConsultaService
{
    Task<PagedResult<LocacaoConsultaDto>> ConsultarAsync(LocacaoConsultaFiltro filtro, CancellationToken ct = default);

    /// <summary>Totais de todas as locações do filtro (a lista é paginada; o total não pode ser só o da página).</summary>
    Task<LocacaoConsultaResumoDto> ObterResumoAsync(LocacaoConsultaFiltro filtro, CancellationToken ct = default);

    Task<LocacaoDetalheDto> ObterDetalheAsync(int locacaoId, CancellationToken ct = default);
}
