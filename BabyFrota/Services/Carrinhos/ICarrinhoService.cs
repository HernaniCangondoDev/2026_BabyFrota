using BabyFrota.DTOs.Carrinhos;
using BabyFrota.DTOs.Common;

namespace BabyFrota.Services.Carrinhos;

public interface ICarrinhoService
{
    Task<PagedResult<CarrinhoDto>> ListarAsync(
        string? descricao, int? statusId, int? tipoCarrinhoId, int pagina, int tamanhoPagina, CancellationToken ct = default);
    Task<CarrinhoDto?> ObterPorIdAsync(int id, CancellationToken ct = default);
    Task<CarrinhoDto> CriarAsync(CarrinhoUpsertRequest request, CancellationToken ct = default);
    Task<CarrinhoDto> AtualizarAsync(int id, CarrinhoUpsertRequest request, CancellationToken ct = default);
    Task ExcluirAsync(int id, CancellationToken ct = default);
    Task<List<StatusDto>> ListarStatusAsync(CancellationToken ct = default);
}
