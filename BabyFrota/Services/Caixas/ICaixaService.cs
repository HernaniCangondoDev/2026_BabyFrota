using BabyFrota.DTOs.Caixa;

namespace BabyFrota.Services.Caixas;

public interface ICaixaService
{
    Task<CaixaMovimentoDto?> ObterAbertoAsync(CancellationToken ct = default);
    Task<CaixaMovimentoDto> AbrirAsync(int usuarioId, AberturaCaixaRequest request, CancellationToken ct = default);
    Task<CaixaMovimentoDto> FecharAsync(int usuarioId, FechamentoCaixaRequest request, CancellationToken ct = default);
    Task<MovimentoCaixaDto> RegistrarSuprimentoAsync(int usuarioId, decimal valor, CancellationToken ct = default);
    Task<MovimentoCaixaDto> RegistrarSangriaAsync(int usuarioId, decimal valor, CancellationToken ct = default);
    Task<List<MovimentoCaixaDto>> ListarSuprimentosAsync(CancellationToken ct = default);
    Task<List<MovimentoCaixaDto>> ListarSangriasAsync(CancellationToken ct = default);
}
