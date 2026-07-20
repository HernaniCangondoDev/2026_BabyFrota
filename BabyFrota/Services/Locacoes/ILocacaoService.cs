using BabyFrota.DTOs.Locacoes;

namespace BabyFrota.Services.Locacoes;

public interface ILocacaoService
{
    Task<List<CarrinhoDisponivelDto>> ListarCarrinhosDisponiveisAsync(CancellationToken ct = default);
    Task<List<FaixaPrecoDto>> ListarFaixasPrecoAsync(int carrinhoId, CancellationToken ct = default);
    Task<List<FormaRecebimentoDto>> ListarFormasRecebimentoAsync(CancellationToken ct = default);
    Task<List<LocacaoDto>> ListarEmAndamentoAsync(CancellationToken ct = default);
    Task<LocacaoDto> RegistrarEntregaAsync(int usuarioId, EntregaRequest request, CancellationToken ct = default);

    Task<List<CarrinhoDisponivelDto>> ListarCarrinhosParaTrocaAsync(int locacaoId, CancellationToken ct = default);
    Task<LocacaoDto> TrocarCarrinhoAsync(int usuarioId, int locacaoId, TrocaCarrinhoRequest request, CancellationToken ct = default);
    Task<List<TrocaDto>> ListarTrocasAsync(int locacaoId, CancellationToken ct = default);
    Task<PreviaDevolucaoDto> ObterPreviaDevolucaoAsync(int locacaoId, CancellationToken ct = default);
    Task<LocacaoDto> RegistrarDevolucaoAsync(int usuarioId, int locacaoId, DevolucaoRequest request, CancellationToken ct = default);
}
