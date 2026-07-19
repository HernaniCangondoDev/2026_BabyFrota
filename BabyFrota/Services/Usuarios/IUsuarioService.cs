using BabyFrota.DTOs.Usuarios;

namespace BabyFrota.Services.Usuarios;

public interface IUsuarioService
{
    Task<List<UsuarioDto>> ListarAsync(string? nome, string? cpf, CancellationToken ct = default);
    Task<UsuarioDto?> ObterPorIdAsync(int id, CancellationToken ct = default);
    Task<UsuarioDto> CriarAsync(UsuarioUpsertRequest request, CancellationToken ct = default);
    Task<UsuarioDto> AtualizarAsync(int id, UsuarioUpsertRequest request, CancellationToken ct = default);
    Task InativarAsync(int id, CancellationToken ct = default);
    Task<List<PerfilDto>> ListarPerfisAsync(CancellationToken ct = default);
}
