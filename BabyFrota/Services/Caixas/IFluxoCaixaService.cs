using BabyFrota.DTOs.Caixa;
using BabyFrota.DTOs.Common;

namespace BabyFrota.Services.Caixas;

public interface IFluxoCaixaService
{
    /// <summary>Caixas do filtro, paginados. Administrador e Gerente veem todos; os demais, só os que abriram ou fecharam.</summary>
    Task<PagedResult<FluxoCaixaDto>> ListarAsync(int usuarioId, FluxoCaixaFiltro filtro, CancellationToken ct = default);

    /// <summary>Indicadores, série por dia e ranking de recebimento sobre todos os caixas do filtro (não só a página).</summary>
    Task<FluxoCaixaResumoDto> ObterResumoAsync(int usuarioId, FluxoCaixaFiltro filtro, CancellationToken ct = default);
}
