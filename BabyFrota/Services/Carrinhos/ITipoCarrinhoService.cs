using BabyFrota.DTOs.Carrinhos;

namespace BabyFrota.Services.Carrinhos;

public interface ITipoCarrinhoService
{
    Task<List<TipoCarrinhoDto>> ListarAsync(CancellationToken ct = default);
    Task<TipoCarrinhoDto?> ObterPorIdAsync(int id, CancellationToken ct = default);
    Task<TipoCarrinhoDto> CriarAsync(TipoCarrinhoUpsertRequest request, CancellationToken ct = default);
    Task<TipoCarrinhoDto> AtualizarAsync(int id, TipoCarrinhoUpsertRequest request, CancellationToken ct = default);
    Task ExcluirAsync(int id, CancellationToken ct = default);
}
