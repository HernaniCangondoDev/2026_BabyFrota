using BabyFrota.DTOs.Caixa;

namespace BabyFrota.Services.Caixas;

public interface ICaixaService
{
    /// <param name="usuarioId">Quem consulta; define <see cref="CaixaMovimentoDto.PodeFechar"/>.</param>
    Task<CaixaMovimentoDto?> ObterAbertoAsync(int usuarioId, CancellationToken ct = default);
    Task<CaixaMovimentoDto> AbrirAsync(int usuarioId, AberturaCaixaRequest request, CancellationToken ct = default);

    /// <summary>Fecha o caixa aberto, como no legado: sem valor digitado. Só quem abriu, um Gerente ou um Administrador pode fechar.</summary>
    Task<CaixaMovimentoDto> FecharAsync(int usuarioId, CancellationToken ct = default);
    Task<MovimentoCaixaDto> RegistrarSuprimentoAsync(int usuarioId, decimal valor, CancellationToken ct = default);
    Task<MovimentoCaixaDto> RegistrarSangriaAsync(int usuarioId, decimal valor, CancellationToken ct = default);
    Task<List<MovimentoCaixaDto>> ListarSuprimentosAsync(CancellationToken ct = default);
    Task<List<MovimentoCaixaDto>> ListarSangriasAsync(CancellationToken ct = default);
}
