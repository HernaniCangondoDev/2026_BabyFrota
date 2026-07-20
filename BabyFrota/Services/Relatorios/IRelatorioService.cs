using BabyFrota.DTOs.Common;
using BabyFrota.DTOs.Relatorios;

namespace BabyFrota.Services.Relatorios;

public interface IRelatorioService
{
    Task<PagedResult<ClienteRelatorioDto>> ListarClientesAsync(RelatorioClientesFiltro filtro, CancellationToken ct = default);
    Task<RelatorioClientesResumoDto> ObterResumoClientesAsync(RelatorioClientesFiltro filtro, CancellationToken ct = default);

    Task<PagedResult<LocacaoHistoricoDto>> ListarHistoricoAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default);
    Task<RelatorioHistoricoResumoDto> ObterResumoHistoricoAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default);
    Task<List<FaturamentoPorDiaDto>> ObterFaturamentoPorDiaAsync(RelatorioHistoricoFiltro filtro, CancellationToken ct = default);
}
