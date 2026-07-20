using BabyFrota.DTOs.Clientes;
using BabyFrota.DTOs.Common;

namespace BabyFrota.Services.Clientes;

public interface IClienteService
{
    Task<PagedResult<ClienteDto>> ListarAsync(string? nome, string? cpf, int pagina, int tamanhoPagina, CancellationToken ct = default);
    Task<ClienteDto?> ObterPorIdAsync(int id, CancellationToken ct = default);
    Task<ClienteDto> CriarAsync(ClienteUpsertRequest request, CancellationToken ct = default);
    Task<ClienteDto> AtualizarAsync(int id, ClienteUpsertRequest request, CancellationToken ct = default);
    Task ExcluirAsync(int id, CancellationToken ct = default);
}
